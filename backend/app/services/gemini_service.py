import json
import re
from typing import Dict, List, Any, Optional
import httpx
from app.core.config import settings
from app.core.logging import logger
from app.agents.tools import (
    get_inventory_tool,
    get_inventory_summary_tool,
    search_product_tool,
    get_replenishment_recommendations_tool,
    get_stockout_risk_tool,
    get_anomalies_tool,
    get_product_details_tool,
    get_action_queue_tool,
    get_data_quality_tool,
    AGENT_TOOLS_DEFINITIONS
)


class GeminiCopilotService:
    """
    AI Inventory Intelligence Copilot powered by Google Gemini.
    Orchestrates specialized analytical tools and explains deterministic metrics
    without hallucinating numbers.
    """

    MODELS_TO_TRY = [
        "gemini-3.1-flash-lite",
        "gemini-3.5-flash",
        "gemini-3.6-flash",
        "gemini-flash-lite-latest",
        "gemini-flash-latest"
    ]

    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY

    def _execute_tool(self, tool_name: str, arguments: Dict[str, Any], dataset_id: str) -> Any:
        """Executes the specific backend analytical tool deterministically."""
        logger.info(f"Executing analytical tool: {tool_name} with args {arguments} for dataset {dataset_id}")
        if tool_name == "search_product":
            return search_product_tool(dataset_id, arguments.get("query", ""))
        elif tool_name == "get_inventory_summary":
            return get_inventory_summary_tool(dataset_id)
        elif tool_name == "get_inventory":
            return get_inventory_tool(dataset_id, arguments.get("sku"))
        elif tool_name == "get_replenishment_recommendations":
            return get_replenishment_recommendations_tool(dataset_id, arguments.get("priority_filter"))
        elif tool_name == "get_stockout_risk":
            return get_stockout_risk_tool(dataset_id)
        elif tool_name == "get_anomalies":
            return get_anomalies_tool(dataset_id)
        elif tool_name == "get_product_details":
            return get_product_details_tool(dataset_id, arguments.get("sku", ""))
        elif tool_name == "get_action_queue":
            return get_action_queue_tool(dataset_id)
        elif tool_name == "get_data_quality":
            return get_data_quality_tool(dataset_id)
        else:
            return {"error": f"Tool '{tool_name}' not recognized."}

    def _extract_product_query(self, message: str) -> Optional[str]:
        """Extracts candidate product name or SKU code from natural language inquiry."""
        cleaned = re.sub(r"[^\w\s-]", " ", message.strip()).strip()
        words = cleaned.split()
        if not words:
            return None

        # Check for hyphenated SKU code
        for w in words:
            if "-" in w and any(c.isdigit() for c in w):
                return w

        stopwords = {
            "is", "are", "there", "or", "not", "it", "in", "stock", "the", "a", "an", "do", "we", "have", "any",
            "available", "to", "for", "please", "can", "you", "tell", "me", "if", "check", "find", "search", "got",
            "present", "left", "remaining", "how", "much", "many", "units", "items", "item", "product", "products",
            "show", "get", "status", "about", "what", "where", "which", "our", "my", "store", "inventory", "catalog",
            "exist", "exists", "currently", "good", "yes", "no"
        }

        candidates = [w for w in words if w.lower() not in stopwords]
        if candidates:
            return " ".join(candidates)
        return None

    def _determine_tools_by_intent(self, message: str) -> List[Dict[str, Any]]:
        """
        Supervisor routing: identifies analytical tools and parameters based on user intent.
        Returns list of dicts: [{"tool_name": str, "args": dict}]
        """
        msg = message.lower()
        tools: List[Dict[str, Any]] = []

        # 1. Out of stock or inventory count inquiry
        if any(w in msg for w in ["out of stock", "how many items", "how many products", "zero stock", "depleted", "items depleted", "empty stock", "out-of-stock", "no stock"]):
            tools.append({"tool_name": "get_inventory_summary", "args": {}})
            tools.append({"tool_name": "get_stockout_risk", "args": {}})
            return tools

        # 2. Product search / availability inquiry ("is pepsi is there or not", "is coke available", "do we have milk")
        prod_query = self._extract_product_query(message)
        is_product_inquiry = (
            any(w in msg for w in ["there", "available", "have", "got", "in stock", "exist", "find", "search", "look up", "check"])
            or msg.startswith("is ")
            or msg.startswith("do we have")
            or msg.startswith("are there")
        )

        if prod_query and is_product_inquiry:
            tools.append({"tool_name": "search_product", "args": {"query": prod_query}})
            tools.append({"tool_name": "get_inventory_summary", "args": {}})
            return tools

        # 3. Replenishment recommendations / What to order
        if any(w in msg for w in ["order", "replenish", "buy", "purchase", "reorder", "procure", "restock"]):
            tools.append({"tool_name": "get_replenishment_recommendations", "args": {}})
            tools.append({"tool_name": "get_action_queue", "args": {}})
            return tools

        # 4. Stockout risk / Deletion predictions
        if any(w in msg for w in ["stockout", "run out", "critical", "exhaust", "hours left", "depletion"]):
            tools.append({"tool_name": "get_stockout_risk", "args": {}})
            tools.append({"tool_name": "get_inventory_summary", "args": {}})
            return tools

        # 5. Anomalies / Phantom stock / Discrepancies
        if any(w in msg for w in ["anomaly", "anomalies", "phantom", "unusual", "strange", "discrepanc", "shrinkage", "theft", "mismatch"]):
            tools.append({"tool_name": "get_anomalies", "args": {}})
            return tools

        # 6. If user specifically mentions a product name or SKU
        if prod_query and len(prod_query) >= 3 and not any(w in msg for w in ["summary", "overview", "help", "hello", "hi"]):
            tools.append({"tool_name": "search_product", "args": {"query": prod_query}})
            return tools

        # Default fallback: Store status & Action queue
        tools.append({"tool_name": "get_inventory_summary", "args": {}})
        tools.append({"tool_name": "get_action_queue", "args": {}})
        tools.append({"tool_name": "get_stockout_risk", "args": {}})
        return tools

    def _generate_deterministic_response(
        self,
        message: str,
        tool_results_context: Dict[str, Any]
    ) -> str:
        """
        Deterministic reasoning fallback engine: guarantees fast, 100% accurate,
        and directly responsive answers even if the Gemini API is unreachable or rate limited.
        """
        msg = message.lower()

        # 1. Product search answer (Direct YES / NO)
        if "search_product" in tool_results_context:
            res = tool_results_context["search_product"]
            query = res.get("query", "Item")
            if res.get("found"):
                matches = res.get("matches", [])
                top = matches[0] if matches else {}
                curr = float(top.get("current_inventory") or 0)
                sku = top.get("sku", "")
                name = top.get("product_name", query)
                status = top.get("status", "")

                if curr > 0:
                    lines = [
                        f"**Yes**, **{name}** (SKU: `{sku}`) is currently in stock.",
                        f"- **Current On-Hand:** **{curr:.0f} units**",
                        f"- **Available for Picking:** **{float(top.get('available_inventory') or curr):.0f} units**",
                        f"- **Stock Status:** {status}"
                    ]
                    if len(matches) > 1:
                        lines.append(f"\nOther matching items in store ({len(matches)} total):")
                        for m in matches[1:4]:
                            lines.append(f"- {m.get('product_name')} (`{m.get('sku')}`): {m.get('current_inventory'):.0f} units")
                    return "\n".join(lines)
                else:
                    return (
                        f"**No**, **{name}** (SKU: `{sku}`) is currently **OUT OF STOCK** (0 units on hand).\n\n"
                        f"It is listed in your catalog, but inventory has reached zero. An urgent purchase order is recommended."
                    )
            else:
                samples = res.get("available_inventory_sample", [])
                sample_str = f"\n\n**Sample items available in this store:**\n" + "\n".join(f"- {s}" for s in samples) if samples else ""
                return f"**No**, **{query}** is not present in your store catalog or inventory records.{sample_str}"

        # 2. Out of stock / inventory summary
        if "get_inventory_summary" in tool_results_context:
            summary = tool_results_context["get_inventory_summary"]
            out_count = summary.get("out_of_stock_count", 0)
            out_items = summary.get("out_of_stock_items", [])
            low_count = summary.get("critical_low_stock_count", 0)
            low_items = summary.get("critical_low_stock_items", [])
            total = summary.get("total_products", 0)

            if any(w in msg for w in ["out of stock", "how many", "zero stock", "depleted", "count"]):
                if out_count > 0:
                    lines = [
                        f"There are currently **{out_count} items out of stock** (0 or negative on-hand units) out of {total} total catalog products:\n"
                    ]
                    for item in out_items:
                        lines.append(f"- **{item.get('product_name')}** (SKU: `{item.get('sku')}`) — **{item.get('current_inventory'):.0f} units**")

                    if low_count > 0:
                        lines.append(f"\nAdditionally, **{low_count} items are at critical low stock** (<= 3 units):")
                        for item in low_items[:5]:
                            lines.append(f"- {item.get('product_name')} (`{item.get('sku')}`): **{item.get('current_inventory'):.0f} units remaining**")

                    lines.append("\nYou can view and generate replenishment purchase orders in the 'What Should I Order?' tab.")
                    return "\n".join(lines)
                else:
                    return f"There are currently **0 items out of stock**. All {total} catalog products have positive inventory on hand."

        # 3. Replenishment recommendations
        if "get_replenishment_recommendations" in tool_results_context:
            recs = tool_results_context.get("get_replenishment_recommendations", [])
            urgent = [r for r in recs if r.get("priority_level") in ("CRITICAL", "HIGH")]
            if recs:
                lines = [
                    f"Based on real-time inventory analytics, **{len(recs)} items require replenishment**, with **{len(urgent)} at high or critical stockout risk**.\n"
                ]
                for r in recs[:4]:
                    lines.append(
                        f"- **{r.get('product_name')}** (SKU: `{r.get('sku')}`): Order **{r.get('recommended_order'):.0f} units** "
                        f"[{r.get('priority_level')} priority] — *{r.get('reason')}*"
                    )
                lines.append("\nYou can approve these purchase orders in the Replenishment tab.")
                return "\n".join(lines)

        # 4. Stockout risks
        if "get_stockout_risk" in tool_results_context:
            risks = tool_results_context.get("get_stockout_risk", [])
            high_risks = [r for r in risks if float(r.get("stockout_probability") or 0) >= 0.5 or float(r.get("estimated_hours_until_stockout") or 999) <= 24]
            if high_risks:
                lines = [f"Found **{len(high_risks)} items at imminent risk of stockout** within the next 24 hours:\n"]
                for r in high_risks[:5]:
                    lines.append(
                        f"- **{r.get('product_name')}** (SKU: `{r.get('sku')}`): **{float(r.get('estimated_hours_until_stockout') or 0):.1f} hours** until stockout "
                        f"({float(r.get('stockout_probability') or 0)*100:.0f}% risk)"
                    )
                return "\n".join(lines)

        # 5. Anomalies
        if "get_anomalies" in tool_results_context:
            anoms = tool_results_context.get("get_anomalies", [])
            if anoms:
                lines = [f"Detected **{len(anoms)} inventory anomalies** requiring cycle count verification:\n"]
                for a in anoms[:4]:
                    lines.append(f"- **{a.get('product_name')}** (SKU: `{a.get('sku')}`): {a.get('anomaly_type')} — *{a.get('reason')}*")
                return "\n".join(lines)

        return "Store inventory metrics are currently loaded and verified. What specific product or replenishment question can I answer?"

    async def chat(
        self,
        dataset_id: str,
        message: str,
        conversation_history: List[Dict[str, Any]] = []
    ) -> Dict[str, Any]:
        """
        Processes a natural language query from the dark store inventory manager.
        Executes analytical tools first, then formats response with Gemini or deterministic engine.
        """
        # 1. Identify necessary tools
        tool_configs = self._determine_tools_by_intent(message)
        executed_records = []
        tool_results_context = {}

        for cfg in tool_configs:
            tname = cfg["tool_name"]
            targs = cfg.get("args", {})
            result = self._execute_tool(tname, targs, dataset_id)
            executed_records.append({
                "tool_name": tname,
                "arguments": targs,
                "result": result
            })
            tool_results_context[tname] = result

        # 2. Build Prompt for Gemini
        system_instruction = (
            "You are the senior AI Inventory Intelligence Copilot for quick-commerce dark stores. "
            "You must reason strictly over the provided Contextual Tool Results from the live store database.\n\n"
            "CRITICAL INSTRUCTIONS:\n"
            "1. DIRECT YES/NO FOR PRODUCT AVAILABILITY:\n"
            "   - When asked if an item is there / in stock / available (e.g. 'is pepsi is there or not', 'is milk available'):\n"
            "     - If the tool indicates found=False or in_stock=False:\n"
            "       Start your answer directly with '**No**, [product name] is currently not in stock or present in the store catalog.'\n"
            "       Cite what related items or soft drinks are in stock if available.\n"
            "     - If found=True and in_stock=True:\n"
            "       Start your answer directly with '**Yes**, [product name] (SKU: `...`) is in stock with **[X] units** available on hand.'\n"
            "     - If found=True but current inventory is 0 or negative:\n"
            "       Start your answer directly with '**No**, [product name] (SKU: `...`) is listed in the catalog but is currently **out of stock** (0 units available).'\n\n"
            "2. EXACT NUMERICAL COUNTS FOR OUT-OF-STOCK & INVENTORY QUESTIONS:\n"
            "   - When asked 'how many items are out of stock' or similar questions:\n"
            "     - You MUST state the exact number immediately (e.g. 'There are currently **[N] items out of stock**').\n"
            "     - List each out of stock item clearly with product name, SKU, and stock level.\n"
            "     - List any items at critical low stock.\n\n"
            "3. ACCURACY & EVIDENCE:\n"
            "   - Never invent or hallucinate numbers, prices, or product names.\n"
            "   - All numerical answers must strictly cite the Contextual Tool Results."
        )

        prompt_payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {"text": f"System Directive: {system_instruction}"},
                        {"text": f"User Question: {message}"},
                        {"text": f"Contextual Tool Results from Real Inventory Engine: {json.dumps(tool_results_context, default=str)}"}
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.1,
                "maxOutputTokens": 1024
            }
        }

        explanation = ""

        # Try active modern Gemini models with fast fallback
        if self.api_key:
            for model_name in self.MODELS_TO_TRY:
                try:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={self.api_key}"
                    async with httpx.AsyncClient(timeout=8.0) as client:
                        res = await client.post(url, json=prompt_payload)
                        if res.status_code == 200:
                            data = res.json()
                            candidates = data.get("candidates", [])
                            if candidates:
                                parts = candidates[0].get("content", {}).get("parts", [])
                                if parts:
                                    explanation = parts[0].get("text", "").strip()
                                    if explanation:
                                        logger.info(f"Gemini response generated successfully using model {model_name}")
                                        break
                        elif res.status_code in (404, 503, 429):
                            logger.warning(f"Model {model_name} returned status {res.status_code}, trying next model...")
                            continue
                        else:
                            logger.warning(f"Model {model_name} returned status {res.status_code}: {res.text[:200]}")
                except Exception as e:
                    logger.warning(f"Model {model_name} invocation error: {e}")
                    continue

        # If Gemini is unavailable or rate-limited, use deterministic engine
        if not explanation:
            logger.info("Using deterministic response engine fallback.")
            explanation = self._generate_deterministic_response(message, tool_results_context)

        suggested = [
            "Is Pepsi in stock?",
            "How many items are out of stock?",
            "What products should I order today?",
            "Show me products with critical stockout risk"
        ]

        return {
            "dataset_id": dataset_id,
            "response": explanation,
            "tool_calls": executed_records,
            "suggested_questions": suggested
        }
