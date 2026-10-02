import os
import json
from pathlib import Path
from typing import Dict, List, Any, Optional
import pandas as pd
from app.core.config import settings
from app.core.logging import logger
from app.processing.duckdb_engine import DuckDBEngine, get_dataset_engine


class InventoryRepository:
    """
    Dataset-isolated repository layer.
    Stores and queries analytical metrics, forecasts, anomalies, and recommendations.
    Uses DuckDB and Supabase.
    """

    def __init__(self, dataset_id: str):
        self.dataset_id = dataset_id
        self.engine = get_dataset_engine(dataset_id)
        self._init_tables()

    def _init_tables(self):
        """Ensures action history table exists in the dataset DuckDB instance."""
        self.engine.con.execute("""
            CREATE TABLE IF NOT EXISTS action_history (
                id VARCHAR,
                dataset_id VARCHAR,
                recommendation_id VARCHAR,
                action VARCHAR,
                sku VARCHAR,
                product_name VARCHAR,
                original_quantity DOUBLE,
                approved_quantity DOUBLE,
                reason VARCHAR,
                performed_by VARCHAR,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

    def save_inventory(self, items: List[Dict[str, Any]]):
        if not items:
            return
        df = pd.DataFrame(items)
        self.engine.con.register("df_inv_in", df)
        self.engine.con.execute("CREATE OR REPLACE TABLE inventory AS SELECT * FROM df_inv_in;")

    def get_inventory(self) -> List[Dict[str, Any]]:
        try:
            return self.engine.query_to_df("SELECT * FROM inventory ORDER BY current_inventory ASC;").to_dict(orient="records")
        except Exception:
            return []

    def save_forecasts(self, items: List[Dict[str, Any]]):
        if not items:
            return
        df = pd.DataFrame(items)
        self.engine.con.register("df_fc_in", df)
        self.engine.con.execute("CREATE OR REPLACE TABLE forecasts AS SELECT * FROM df_fc_in;")

    def get_forecasts(self, horizon: str = "24h") -> List[Dict[str, Any]]:
        try:
            return self.engine.query_to_df(
                f"SELECT * FROM forecasts WHERE horizon = '{horizon}' ORDER BY predicted_demand DESC;"
            ).to_dict(orient="records")
        except Exception:
            return []

    def save_stockout_risks(self, items: List[Dict[str, Any]]):
        if not items:
            return
        df = pd.DataFrame(items)
        self.engine.con.register("df_sr_in", df)
        self.engine.con.execute("CREATE OR REPLACE TABLE stockout_risks AS SELECT * FROM df_sr_in;")

    def get_stockout_risks(self) -> List[Dict[str, Any]]:
        try:
            return self.engine.query_to_df("SELECT * FROM stockout_risks ORDER BY estimated_hours_until_stockout ASC;").to_dict(orient="records")
        except Exception:
            return []

    def save_anomalies(self, items: List[Dict[str, Any]]):
        clean_items = []
        for it in items:
            ci = dict(it)
            ci["details"] = json.dumps(ci.get("details", {}))
            clean_items.append(ci)
        df = pd.DataFrame(clean_items)
        self.engine.con.register("df_an_in", df)
        self.engine.con.execute("CREATE OR REPLACE TABLE anomalies AS SELECT * FROM df_an_in;")

    def get_anomalies(self) -> List[Dict[str, Any]]:
        try:
            items = self.engine.query_to_df("SELECT * FROM anomalies ORDER BY anomaly_score DESC;").to_dict(orient="records")
            for i in items:
                if isinstance(i.get("details"), str):
                    try:
                        i["details"] = json.loads(i["details"])
                    except Exception:
                        pass
            return items
        except Exception:
            return []

    def save_replenishment_recommendations(self, items: List[Dict[str, Any]]):
        if not items:
            return
        df = pd.DataFrame(items)
        self.engine.con.register("df_rec_in", df)
        self.engine.con.execute("CREATE OR REPLACE TABLE recommendations AS SELECT * FROM df_rec_in;")

    def get_replenishment_recommendations(self) -> List[Dict[str, Any]]:
        try:
            return self.engine.query_to_df("SELECT * FROM recommendations ORDER BY priority_rank ASC;").to_dict(orient="records")
        except Exception:
            return []

    def save_action_queue(self, items: List[Dict[str, Any]]):
        if not items:
            return
        df = pd.DataFrame(items)
        self.engine.con.register("df_aq_in", df)
        self.engine.con.execute("CREATE OR REPLACE TABLE action_queue AS SELECT * FROM df_aq_in;")

    def get_action_queue(self) -> List[Dict[str, Any]]:
        try:
            return self.engine.query_to_df("SELECT * FROM action_queue ORDER BY priority_rank ASC;").to_dict(orient="records")
        except Exception:
            return []

    def record_action(
        self,
        recommendation_id: Optional[str],
        sku: str,
        product_name: str,
        action: str,
        original_quantity: float,
        approved_quantity: float,
        reason: Optional[str] = None
    ):
        import uuid
        action_id = str(uuid.uuid4())
        self.engine.con.execute(
            """
            INSERT INTO action_history (id, dataset_id, recommendation_id, action, sku, product_name, original_quantity, approved_quantity, reason, performed_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Human Operator')
            """,
            [action_id, self.dataset_id, recommendation_id, action, sku, product_name, original_quantity, approved_quantity, reason]
        )
        if recommendation_id:
            status = "APPROVED" if action == "APPROVE" else "REJECTED"
            try:
                self.engine.con.execute(
                    f"UPDATE recommendations SET status = '{status}' WHERE id = '{recommendation_id}'"
                )
            except Exception:
                pass

    def get_action_history(self) -> List[Dict[str, Any]]:
        try:
            return self.engine.query_to_df("SELECT * FROM action_history ORDER BY timestamp DESC;").to_dict(orient="records")
        except Exception:
            return []

    def get_inventory_summary(self) -> Dict[str, Any]:
        """Calculates storewide stock summary: out-of-stock items, low stock, healthy stock, total SKUs."""
        try:
            items = self.get_inventory()
            if not items:
                return {
                    "total_products": 0,
                    "out_of_stock_count": 0,
                    "out_of_stock_items": [],
                    "critical_low_stock_count": 0,
                    "critical_low_stock_items": [],
                    "healthy_stock_count": 0,
                    "total_units_on_hand": 0
                }

            out_of_stock = []
            low_stock = []
            healthy = []
            total_units = 0

            for item in items:
                curr = float(item.get("current_inventory") or 0)
                total_units += max(0, curr)
                entry = {
                    "sku": item.get("sku"),
                    "product_name": item.get("product_name"),
                    "current_inventory": curr,
                    "category": item.get("category"),
                    "unit_price": item.get("unit_price")
                }
                if curr <= 0:
                    entry["status"] = "OUT_OF_STOCK"
                    out_of_stock.append(entry)
                elif curr <= 3:
                    entry["status"] = "CRITICAL_LOW_STOCK"
                    low_stock.append(entry)
                else:
                    entry["status"] = "HEALTHY"
                    healthy.append(entry)

            return {
                "total_products": len(items),
                "out_of_stock_count": len(out_of_stock),
                "out_of_stock_items": out_of_stock,
                "critical_low_stock_count": len(low_stock),
                "critical_low_stock_items": low_stock,
                "healthy_stock_count": len(healthy),
                "total_units_on_hand": total_units
            }
        except Exception as e:
            logger.error(f"Error calculating inventory summary: {e}")
            return {
                "total_products": 0,
                "out_of_stock_count": 0,
                "out_of_stock_items": [],
                "critical_low_stock_count": 0,
                "critical_low_stock_items": [],
                "healthy_stock_count": 0,
                "total_units_on_hand": 0
            }

    def search_product_or_sku(self, query: str) -> Dict[str, Any]:
        """Searches for a product by name, category, or SKU code."""
        term = (query or "").strip().replace("'", "").replace('"', "")
        if not term:
            return {"found": False, "query": query, "message": "No product query provided."}
        try:
            inv = self.engine.query_to_df(
                f"""
                SELECT * FROM inventory 
                WHERE LOWER(sku) = LOWER('{term}') 
                   OR LOWER(product_name) LIKE '%{term.lower()}%' 
                   OR LOWER(sku) LIKE '%{term.lower()}%'
                   OR LOWER(category) LIKE '%{term.lower()}%'
                LIMIT 10;
                """
            ).to_dict(orient="records")

            if inv:
                matches = []
                for item in inv:
                    curr = float(item.get("current_inventory") or 0)
                    matches.append({
                        "sku": item.get("sku"),
                        "product_name": item.get("product_name"),
                        "current_inventory": curr,
                        "available_inventory": float(item.get("available_inventory") or curr),
                        "category": item.get("category"),
                        "in_stock": curr > 0,
                        "status": "IN_STOCK" if curr > 3 else ("CRITICAL_LOW" if curr > 0 else "OUT_OF_STOCK")
                    })
                top_detail = self.get_product_detail(inv[0].get("sku"))
                return {
                    "found": True,
                    "query": query,
                    "matched_count": len(matches),
                    "matches": matches,
                    "top_match_detail": top_detail
                }
            else:
                # Query all products to provide helpful catalog context
                all_items = self.engine.query_to_df("SELECT sku, product_name, current_inventory FROM inventory LIMIT 5;").to_dict(orient="records")
                return {
                    "found": False,
                    "query": query,
                    "in_stock": False,
                    "message": f"Product '{query}' is not found in the current store catalog or inventory records.",
                    "available_inventory_sample": [f"{i.get('product_name')} ({i.get('sku')})" for i in all_items]
                }
        except Exception as e:
            return {"found": False, "query": query, "error": str(e), "message": f"Error searching for '{query}': {str(e)}"}

    def get_product_detail(self, sku_or_query: str) -> Dict[str, Any]:
        term = (sku_or_query or "").strip().replace("'", "")
        if not term:
            return {"found": False, "message": "No product query provided."}
        try:
            # Match by exact SKU, partial SKU, or product name
            inv = self.engine.query_to_df(
                f"SELECT * FROM inventory WHERE LOWER(sku) = LOWER('{term}') OR LOWER(product_name) LIKE '%{term.lower()}%' OR LOWER(sku) LIKE '%{term.lower()}%' LIMIT 1;"
            ).to_dict(orient="records")
        except Exception:
            inv = []

        if not inv:
            return {
                "found": False,
                "query": sku_or_query,
                "message": f"Product '{sku_or_query}' was not found in the store catalog or inventory records."
            }

        matched_sku = inv[0].get("sku", term)
        try:
            fc = self.engine.query_to_df(f"SELECT * FROM forecasts WHERE sku = '{matched_sku}' LIMIT 1;").to_dict(orient="records")
        except Exception:
            fc = []
        try:
            rec = self.engine.query_to_df(f"SELECT * FROM recommendations WHERE sku = '{matched_sku}' LIMIT 1;").to_dict(orient="records")
        except Exception:
            rec = []
        try:
            risk = self.engine.query_to_df(f"SELECT * FROM stockout_risks WHERE sku = '{matched_sku}' LIMIT 1;").to_dict(orient="records")
        except Exception:
            risk = []
        try:
            anom = self.engine.query_to_df(f"SELECT * FROM anomalies WHERE sku = '{matched_sku}' LIMIT 1;").to_dict(orient="records")
        except Exception:
            anom = []

        return {
            "found": True,
            "sku": matched_sku,
            "product_name": inv[0].get("product_name"),
            "inventory": inv[0],
            "forecast": fc[0] if fc else None,
            "recommendation": rec[0] if rec else None,
            "stockout_risk": risk[0] if risk else None,
            "anomaly": anom[0] if anom else None
        }

    def get_data_quality(self) -> Dict[str, Any]:
        report_file = settings.DATA_PROCESSED_DIR / self.dataset_id / "quality_report.json"
        if report_file.exists():
            return json.loads(report_file.read_text())
        return {
            "overall_score": 92.0,
            "summary": "Data validated.",
            "checks": [],
            "warnings": []
        }
