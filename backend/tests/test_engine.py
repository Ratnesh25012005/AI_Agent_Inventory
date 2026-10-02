import sys
from pathlib import Path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings
from app.ingestion.schema_mapper import map_column, infer_dataset_role
from app.optimization.replenishment import compute_replenishment
from app.optimization.priority import rank_action_queue
from app.ml.anomaly.isolation_forest_detector import AnomalyDetector

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "services" in data
    assert "gemini" in data["services"]
    assert "database" in data["services"]


def test_environment_configuration():
    assert settings.PROJECT_NAME == "AI Inventory Decision Engine"
    assert settings.SUPABASE_URL.startswith("https://")
    assert len(settings.GEMINI_API_KEY) > 10


def test_schema_mapper():
    col, conf = map_column("available_qty")
    assert col == "current_inventory"
    assert conf == "HIGH"

    col2, conf2 = map_column("delivery_days")
    assert col2 == "lead_time"
    assert conf2 == "HIGH"

    role = infer_dataset_role("daily_sales_store1.csv", ["item_code", "qty_sold"])
    assert role == "sales"


def test_replenishment_math():
    # LTD = 35 * 2 = 70. Safety stock ~ 28. Net need ~ 98 - 18 = 80 units
    calc = compute_replenishment(
        sku="COKE-500",
        product_name="Coca-Cola 500ml",
        current_inventory=18.0,
        daily_forecast=35.0,
        lead_time_days=2.0,
        incoming_stock=0.0
    )
    assert calc.recommended_order > 0
    assert calc.priority_level in ("CRITICAL", "HIGH")
    assert "COKE-500" in calc.sku


def test_action_queue_ranking():
    recs = [
        {"id": "1", "sku": "A", "product_name": "Prod A", "recommended_order": 50, "priority_level": "CRITICAL", "reason": "Stockout imminent"},
        {"id": "2", "sku": "B", "product_name": "Prod B", "recommended_order": 10, "priority_level": "LOW", "reason": "Balanced stock"}
    ]
    queue = rank_action_queue(recs)
    assert len(queue) == 2
    assert queue[0]["priority_level"] == "CRITICAL"
    assert queue[0]["priority_rank"] == 1


def test_anomaly_detection_phantom_stock():
    detector = AnomalyDetector()
    items = [
        {"sku": "SKU-1", "product_name": "Test Item", "current_inventory": 50.0, "expected_inventory": 20.0, "avg_daily_demand": 5.0}
    ]
    anomalies = detector.detect_anomalies(items)
    assert len(anomalies) >= 1
    assert anomalies[0]["anomaly_type"] == "PHANTOM_INVENTORY"
