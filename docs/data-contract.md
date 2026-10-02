# Canonical Inventory Data Contract

## Canonical Field Specifications

| Canonical Field | Description | Type | Aliases Detected |
|---|---|---|---|
| `sku` | Unique Product SKU | String | `item_code`, `product_code`, `product_id`, `item_id`, `barcode` |
| `product_name` | Item display title | String | `product_name`, `title`, `description`, `name`, `item_desc` |
| `current_inventory` | Available physical count | Float | `stock_on_hand`, `available_qty`, `on_hand`, `inventory` |
| `sales_quantity` | Units sold in transaction | Float | `qty_sold`, `units_sold`, `quantity`, `items_sold` |
| `lead_time` | Supplier delivery lead days | Float | `lead_time`, `delivery_days`, `supplier_lead_time` |
| `incoming_inventory` | Pipeline/PO in-transit stock | Float | `in_transit`, `on_order`, `incoming_stock`, `po_qty` |
| `expiry_date` | Best-before date | Date | `expiry_date`, `expiration_date`, `exp_date`, `best_before` |
| `unit_price` | Selling price | Float | `price`, `selling_price`, `mrp`, `retail_price` |
| `cost` | Procurement unit cost | Float | `cost_price`, `unit_cost`, `purchase_price`, `cogs` |
