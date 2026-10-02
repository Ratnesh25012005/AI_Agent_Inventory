from typing import Dict, List, Any, Set


def compute_data_quality(
    files_profiling: List[Dict[str, Any]],
    confirmed_mappings: Dict[str, str]
) -> Dict[str, Any]:
    """
    Evaluates dataset quality and generates a score (0 - 100) with detailed warnings and checks.
    """
    total_checks = 0
    passed_checks = 0
    warnings: List[str] = []
    errors: List[str] = []
    checks: List[Dict[str, Any]] = []

    mapped_canonical: Set[str] = set(confirmed_mappings.values())

    # Check 1: SKU presence
    total_checks += 1
    if "sku" in mapped_canonical:
        passed_checks += 1
        checks.append({"check": "Product SKU Mapping", "status": "PASSED", "message": "Primary SKU mapped"})
    else:
        errors.append("Critical: No SKU or Product ID column mapped. SKU is mandatory for inventory intelligence.")
        checks.append({"check": "Product SKU Mapping", "status": "FAILED", "message": "Missing SKU mapping"})

    # Check 2: Current Inventory presence
    total_checks += 1
    if "current_inventory" in mapped_canonical:
        passed_checks += 1
        checks.append({"check": "Current Inventory Mapping", "status": "PASSED", "message": "Current inventory mapped"})
    else:
        warnings.append("Current inventory column not mapped. Inventory levels will default to available transaction counts.")
        checks.append({"check": "Current Inventory Mapping", "status": "WARNING", "message": "Missing current inventory"})

    # Check 3: Historical Sales
    total_checks += 1
    if "sales_quantity" in mapped_canonical or "quantity" in mapped_canonical:
        passed_checks += 1
        checks.append({"check": "Historical Demand Data", "status": "PASSED", "message": "Sales transactions identified"})
    else:
        warnings.append("Sales demand data not provided. Demand forecasting will use baseline estimation.")
        checks.append({"check": "Historical Demand Data", "status": "WARNING", "message": "No sales transaction volume"})

    # Check 4: Supplier & Lead Time
    total_checks += 1
    if "lead_time" in mapped_canonical:
        passed_checks += 1
        checks.append({"check": "Supplier Lead Times", "status": "PASSED", "message": "Lead time data present"})
    else:
        warnings.append("Supplier lead time not provided. Replenishment will use default quick-commerce lead time (2 days).")
        checks.append({"check": "Supplier Lead Times", "status": "WARNING", "message": "Using fallback lead times"})

    # Check 5: Expiry dates
    total_checks += 1
    if "expiry_date" in mapped_canonical:
        passed_checks += 1
        checks.append({"check": "Perishable Expiry Dates", "status": "PASSED", "message": "Expiry tracking available"})
    else:
        checks.append({"check": "Perishable Expiry Dates", "status": "INFO", "message": "No expiry dates provided"})

    # Check 6: File profile stats
    for f in files_profiling:
        total_checks += 1
        rows = f.get("row_count", 0)
        if rows > 0:
            passed_checks += 1
            checks.append({"check": f"File Integrity ({f.get('filename')})", "status": "PASSED", "message": f"{rows:,} valid rows"})
        else:
            errors.append(f"File {f.get('filename')} contains 0 rows.")
            checks.append({"check": f"File Integrity ({f.get('filename')})", "status": "FAILED", "message": "Empty file"})

    score = round((passed_checks / max(total_checks, 1)) * 100, 1)

    summary = f"Dataset Quality Score: {score}/100. "
    if errors:
        summary += f"{len(errors)} critical issues detected. "
    else:
        summary += "Dataset structure valid for inventory intelligence. "
    if warnings:
        summary += f"{len(warnings)} recommendations for optimal prediction accuracy."

    return {
        "overall_score": score,
        "summary": summary,
        "checks": checks,
        "warnings": warnings,
        "errors": errors
    }


def detect_capabilities(mapped_canonical: Set[str]) -> List[str]:
    """
    Dynamically determines enabled capabilities without hallucinating missing modules.
    """
    capabilities = ["inventory_analysis", "basic_anomaly_detection"]

    if "current_inventory" in mapped_canonical or "sku" in mapped_canonical:
        capabilities.append("overstock_detection")

    if "sales_quantity" in mapped_canonical or "quantity" in mapped_canonical:
        capabilities.append("demand_forecasting")
        capabilities.append("stockout_prediction")
        capabilities.append("replenishment_recommendations")
        capabilities.append("action_priority_queue")

    if "lead_time" in mapped_canonical:
        capabilities.append("lead_time_aware_optimization")

    if "incoming_inventory" in mapped_canonical:
        capabilities.append("pipeline_stock_awareness")

    if "expiry_date" in mapped_canonical:
        capabilities.append("expiry_risk_detection")

    if "inventory_movement_type" in mapped_canonical:
        capabilities.append("phantom_inventory_detection")

    return capabilities
