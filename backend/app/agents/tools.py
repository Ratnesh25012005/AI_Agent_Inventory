from typing import Dict, List, Any, Optional
from app.core.logging import logger
from app.db.repositories.inventory_repository import InventoryRepository


def get_inventory_tool(dataset_id: str, sku: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieves current on-hand and available inventory quantities for the dataset."""
    repo = InventoryRepository(dataset_id)
    items = repo.get_inventory()
    if sku:
        return [i for i in items if i.get("sku") == sku]
    return items[:50]


def get_replenishment_recommendations_tool(dataset_id: str, priority_filter: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieves deterministic replenishment recommendations with calculated quantities and reasons."""
    repo = InventoryRepository(dataset_id)
    recs = repo.get_replenishment_recommendations()
    if priority_filter:
        return [r for r in recs if r.get("priority_level") == priority_filter.upper()]
    return recs[:30]


def get_stockout_risk_tool(dataset_id: str) -> List[Dict[str, Any]]:
    """Retrieves stockout probabilities and estimated hours until stockout."""
    repo = InventoryRepository(dataset_id)
    return repo.get_stockout_risks()[:25]


def get_anomalies_tool(dataset_id: str) -> List[Dict[str, Any]]:
    """Retrieves detected inventory anomalies and phantom inventory discrepancies."""
    repo = InventoryRepository(dataset_id)
    return repo.get_anomalies()


def get_product_details_tool(dataset_id: str, sku: str) -> Dict[str, Any]:
    """Retrieves full details for a product: stock, velocity, forecast, risks, and replenishment recommendation."""
    repo = InventoryRepository(dataset_id)
    return repo.get_product_detail(sku)


def get_action_queue_tool(dataset_id: str) -> List[Dict[str, Any]]:
    """Retrieves the prioritized AI action queue ranked by operational urgency."""
    repo = InventoryRepository(dataset_id)
    return repo.get_action_queue()[:20]


def get_inventory_summary_tool(dataset_id: str) -> Dict[str, Any]:
    """Retrieves high-level inventory summary: out-of-stock items count, low-stock items, and healthy inventory counts."""
    repo = InventoryRepository(dataset_id)
    return repo.get_inventory_summary()


def search_product_tool(dataset_id: str, query: str) -> Dict[str, Any]:
    """Searches for a product in inventory by SKU code or product name."""
    repo = InventoryRepository(dataset_id)
    return repo.search_product_or_sku(query)


def get_data_quality_tool(dataset_id: str) -> Dict[str, Any]:
    """Retrieves data quality metrics, warnings, and detected dataset capabilities."""
    repo = InventoryRepository(dataset_id)
    return repo.get_data_quality()


AGENT_TOOLS_DEFINITIONS = [
    {
        "name": "search_product",
        "description": "Search for whether a specific product or SKU exists in inventory, its stock count, and catalog status.",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Product name, brand, or SKU keyword (e.g. 'pepsi', 'milk', 'coke', 'SKU-SOF-0168')"}
            },
            "required": ["query"]
        }
    },
    {
        "name": "get_inventory_summary",
        "description": "Get overall store inventory status including exact count of out-of-stock items, critical low stock items, and healthy inventory.",
        "parameters": {"type": "object", "properties": {}}
    },
    {
        "name": "get_inventory",
        "description": "Fetch current stock, available units, and reserved inventory. Optional parameter: sku.",
        "parameters": {
            "type": "object",
            "properties": {
                "sku": {"type": "string", "description": "Specific product SKU"}
            }
        }
    },
    {
        "name": "get_replenishment_recommendations",
        "description": "Fetch recommended order quantities, lead time calculations, and safety stock requirements.",
        "parameters": {
            "type": "object",
            "properties": {
                "priority_filter": {"type": "string", "enum": ["CRITICAL", "HIGH", "MEDIUM", "LOW"], "description": "Filter by urgency"}
            }
        }
    },
    {
        "name": "get_stockout_risk",
        "description": "Get stockout risk predictions, probabilities, and estimated hours until depletion.",
        "parameters": {"type": "object", "properties": {}}
    },
    {
        "name": "get_anomalies",
        "description": "Get inventory anomalies, unusual stock movements, and phantom inventory flags.",
        "parameters": {"type": "object", "properties": {}}
    },
    {
        "name": "get_product_details",
        "description": "Get complete operational breakdown for a specific product SKU.",
        "parameters": {
            "type": "object",
            "properties": {
                "sku": {"type": "string", "description": "Product SKU code"}
            },
            "required": ["sku"]
        }
    },
    {
        "name": "get_action_queue",
        "description": "Get the prioritized AI Action Queue of actions (orders, cycle counts, markdowns).",
        "parameters": {"type": "object", "properties": {}}
    },
    {
        "name": "get_data_quality",
        "description": "Get data quality score, warnings, and available platform capabilities.",
        "parameters": {"type": "object", "properties": {}}
    }
]
