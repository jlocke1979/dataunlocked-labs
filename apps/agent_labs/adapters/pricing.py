"""Deterministic Pricing Intelligence adapter backed only by synthetic fixtures."""

from __future__ import annotations

import json
from pathlib import Path
from statistics import median
from typing import Any

from ..core import (
    AdapterMetadata,
    Claim,
    ContractViolation,
    Evidence,
    PolicyDecision,
    Request,
    RunEvent,
    RunRecord,
    StructuredError,
    ToolCall,
    ToolDescriptor,
    ToolResult,
    validate_tool_call,
)

ADAPTER_METADATA = AdapterMetadata(
    adapter_id="adapter.pricing-intelligence",
    adapter_version="1.0.0",
    display_name="Pricing Intelligence",
    supported_claim_types=("pricing.competitive-position",),
)

PRICE_COMPARISON_TOOL = ToolDescriptor(
    tool_id="tool.pricing.compare-market-prices",
    tool_version="1.0.0",
    description="Compare a synthetic product price against competing offers.",
    input_schema={
        "type": "object",
        "additionalProperties": False,
        "required": ["product_id", "current_price", "competitor_prices"],
        "properties": {
            "product_id": {"type": "string"},
            "current_price": {"type": "number", "minimum": 0},
            "competitor_prices": {
                "type": "array",
                "minItems": 1,
                "items": {"type": "number", "minimum": 0},
            },
        },
    },
)


def load_fixture() -> dict[str, Any]:
    fixture_path = Path(__file__).resolve().parent.parent / "fixtures" / "pricing_example.json"
    return json.loads(fixture_path.read_text(encoding="utf-8"))


def fixture_request() -> Request:
    fixture = load_fixture()["request"]
    return Request(adapter_id=ADAPTER_METADATA.adapter_id, **fixture)


class PricingIntelligenceAdapter:
    metadata = ADAPTER_METADATA
    tools = (PRICE_COMPARISON_TOOL,)

    def execute(self, request: Request) -> RunRecord:
        if request.adapter_id != self.metadata.adapter_id:
            raise ContractViolation(
                StructuredError(
                    error_id="error.invalid-adapter",
                    code="INVALID_ADAPTER",
                    message="The request is not for the Pricing Intelligence adapter.",
                )
            )

        fixture = load_fixture()
        run_id = "run.pricing.runner-001.v1"
        call = ToolCall(
            call_id="call.pricing.compare-market-prices.v1",
            tool_id=PRICE_COMPARISON_TOOL.tool_id,
            arguments=request.arguments,
        )
        validate_tool_call(PRICE_COMPARISON_TOOL, call)

        market_median = float(median(call.arguments["competitor_prices"]))
        difference = round(call.arguments["current_price"] - market_median, 2)
        output = {
            "product_id": call.arguments["product_id"],
            "current_price": call.arguments["current_price"],
            "market_median": market_median,
            "difference": difference,
        }
        result = ToolResult(
            result_id="result.pricing.compare-market-prices.v1",
            call_id=call.call_id,
            output=output,
        )
        evidence = Evidence(
            evidence_id="evidence.pricing.runner-001.v1",
            source_id=fixture["source_id"],
            source_uri=fixture["source_uri"],
            observed_at=fixture["observed_at"],
            content=output,
            tool_call_id=call.call_id,
        )
        direction = "above" if difference >= 0 else "below"
        claim = Claim(
            claim_id="claim.pricing.runner-001.v1",
            claim_type="pricing.competitive-position",
            statement=(
                f"Synthetic product {call.arguments['product_id']} is "
                f"${abs(difference):.2f} {direction} the competing-offer median."
            ),
            evidence_ids=(evidence.evidence_id,),
            confidence=1.0,
        )

        return RunRecord(
            run_id=run_id,
            adapter=self.metadata,
            request=request,
            tool_calls=(call,),
            tool_results=(result,),
            evidence=(evidence,),
            claims=(claim,),
            events=(
                RunEvent(
                    event_id="event.pricing.completed.v1",
                    run_id=run_id,
                    event_type="run.completed",
                    occurred_at=fixture["observed_at"],
                    details={"fixture_id": fixture["fixture_id"]},
                ),
            ),
            policy_decisions=(
                PolicyDecision(
                    decision_id="decision.pricing.fixture-read.v1",
                    action="read.synthetic-fixture",
                    outcome="allow",
                    reason="The adapter reads only a local synthetic fixture.",
                ),
            ),
        )
