# AI Copilot & Multi-Agent Workflow

## Agent Hierarchy
The platform uses one unified supervisor workflow with specialized backend tool capabilities:

```
USER QUERY: "What should I order today?"
   │
   ▼
GEMINI COPILOT SERVICE (LLM)
   │
   ▼
SUPERVISOR AGENT
   │
   ├──▶ 1. get_replenishment_recommendations()
   │       └── Returns deterministic calculated orders, MOQ, safety stock
   │
   ├──▶ 2. get_action_queue()
   │       └── Returns prioritized queue (Critical, High, Medium, Low)
   │
   ├──▶ 3. get_product_details(sku)
   │       └── Returns LTD, current stock, velocity, supplier lead time
   │
   ▼
GEMINI EXPLAINABLE SYNTHESIS
   │
   ▼
USER: "12 products require replenishment. The highest priority is Coke 500ml (30 units)..."
```

## Fundamental Principle: No Hallucinations
Gemini reasoning strictly consumes real numerical outputs from:
1. `InventoryRepository`
2. LightGBM demand forecaster
3. Deterministic replenishment optimizer

The LLM explains the math; it never invents the numbers.
