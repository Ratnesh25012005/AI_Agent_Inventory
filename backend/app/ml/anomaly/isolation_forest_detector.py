import numpy as np
from typing import List, Dict, Any
from sklearn.ensemble import IsolationForest
from app.core.logging import logger


class AnomalyDetector:
    """
    Inventory Anomaly Detection engine using Isolation Forest and
    deterministic phantom inventory verification.
    """

    def __init__(self, contamination: float = 0.05):
        self.clf = IsolationForest(contamination=contamination, random_state=42)

    def detect_anomalies(
        self,
        inventory_items: List[Dict[str, Any]],
        movements: List[Dict[str, Any]] = []
    ) -> List[Dict[str, Any]]:
        """
        Detects inventory anomalies and phantom inventory risks.
        """
        anomalies: List[Dict[str, Any]] = []
        if not inventory_items:
            return anomalies

        # 1. Phantom Inventory Detection (Section 16 of spec)
        # Expected inventory vs Recorded inventory
        for item in inventory_items:
            sku = item.get("sku")
            p_name = item.get("product_name", sku)
            recorded = float(item.get("current_inventory", 0.0))
            expected = item.get("expected_inventory")

            if expected is not None:
                expected_val = float(expected)
                diff = recorded - expected_val
                if abs(diff) >= 5.0 and recorded > 0:
                    severity = "CRITICAL" if abs(diff) > 20 else "HIGH"
                    anomalies.append({
                        "sku": sku,
                        "product_name": p_name,
                        "store_code": item.get("store_code", "MAIN"),
                        "anomaly_type": "PHANTOM_INVENTORY",
                        "anomaly_score": round(min(1.0, abs(diff) / max(recorded, 1.0)), 3),
                        "severity": severity,
                        "reason": f"Discrepancy detected: Recorded stock ({recorded:.0f}) differs from expected book inventory ({expected_val:.0f}) by {diff:+.0f} units. Physical cycle count recommended.",
                        "details": {"recorded": recorded, "expected": expected_val, "discrepancy": diff}
                    })

            # Negative inventory flag
            if recorded < 0:
                anomalies.append({
                    "sku": sku,
                    "product_name": p_name,
                    "store_code": item.get("store_code", "MAIN"),
                    "anomaly_type": "NEGATIVE_DRIFT",
                    "anomaly_score": 0.95,
                    "severity": "CRITICAL",
                    "reason": f"Negative inventory recorded ({recorded:.0f}). Urgent inventory adjustment required.",
                    "details": {"current_stock": recorded}
                })

        # 2. Isolation Forest over feature vector [current_stock, sales_velocity, days_of_inventory]
        if len(inventory_items) >= 5:
            feature_matrix = []
            valid_items = []
            for item in inventory_items:
                stock = float(item.get("current_inventory", 0.0))
                daily_sales = float(item.get("avg_daily_demand", 1.0))
                doi = stock / max(daily_sales, 0.1)
                feature_matrix.append([stock, daily_sales, doi])
                valid_items.append(item)

            X = np.array(feature_matrix)
            try:
                preds = self.clf.fit_predict(X)
                scores = self.clf.decision_function(X)

                for idx, (pred, score) in enumerate(zip(preds, scores)):
                    # pred == -1 indicates an outlier
                    if pred == -1:
                        item = valid_items[idx]
                        sku = item.get("sku")
                        p_name = item.get("product_name", sku)
                        # Check if already added
                        if not any(a["sku"] == sku for a in anomalies):
                            normalized_score = round(float(abs(score)), 3)
                            anomalies.append({
                                "sku": sku,
                                "product_name": p_name,
                                "store_code": item.get("store_code", "MAIN"),
                                "anomaly_type": "UNUSUAL_MOVEMENT",
                                "anomaly_score": normalized_score,
                                "severity": "HIGH" if normalized_score > 0.15 else "MEDIUM",
                                "reason": f"Outlier inventory velocity pattern identified (current stock: {item.get('current_inventory'):.0f}, daily velocity: {item.get('avg_daily_demand', 0):.1f}).",
                                "details": {"stock": item.get("current_inventory"), "velocity": item.get("avg_daily_demand")}
                            })
            except Exception as e:
                logger.warning(f"Isolation Forest execution skipped on small sample: {e}")

        return anomalies
