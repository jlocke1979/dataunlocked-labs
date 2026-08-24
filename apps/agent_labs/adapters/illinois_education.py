"""Illinois Education Analytics adapter backed only by synthetic fixture data."""

from __future__ import annotations

import json
from pathlib import Path
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
    adapter_id="adapter.illinois-education-analytics",
    adapter_version="1.0.0",
    display_name="Illinois Education Analytics",
    supported_claim_types=("education.attendance-benchmark-gap",),
)

ATTENDANCE_COMPARISON_TOOL = ToolDescriptor(
    tool_id="tool.illinois-education.compare-attendance",
    tool_version="1.0.0",
    description="Compare a synthetic Illinois district attendance rate with a benchmark.",
    input_schema={
        "type": "object",
        "additionalProperties": False,
        "required": ["district_id", "school_year", "attendance_rate", "benchmark_rate"],
        "properties": {
            "district_id": {"type": "string"},
            "school_year": {"type": "integer", "minimum": 2000},
            "attendance_rate": {"type": "number", "minimum": 0, "maximum": 1},
            "benchmark_rate": {"type": "number", "minimum": 0, "maximum": 1},
        },
    },
)


def load_fixture() -> dict[str, Any]:
    fixture_path = (
        Path(__file__).resolve().parent.parent / "fixtures" / "illinois_education_example.json"
    )
    return json.loads(fixture_path.read_text(encoding="utf-8"))


def fixture_request() -> Request:
    fixture = load_fixture()["request"]
    return Request(adapter_id=ADAPTER_METADATA.adapter_id, **fixture)


class IllinoisEducationAdapter:
    metadata = ADAPTER_METADATA
    tools = (ATTENDANCE_COMPARISON_TOOL,)

    def execute(self, request: Request) -> RunRecord:
        if request.adapter_id != self.metadata.adapter_id:
            raise ContractViolation(
                StructuredError(
                    error_id="error.invalid-adapter",
                    code="INVALID_ADAPTER",
                    message="The request is not for the Illinois Education Analytics adapter.",
                )
            )

        fixture = load_fixture()
        run_id = "run.illinois-education.district-150.v1"
        call = ToolCall(
            call_id="call.illinois-education.compare-attendance.v1",
            tool_id=ATTENDANCE_COMPARISON_TOOL.tool_id,
            arguments=request.arguments,
        )
        validate_tool_call(ATTENDANCE_COMPARISON_TOOL, call)

        gap_points = round(
            (call.arguments["attendance_rate"] - call.arguments["benchmark_rate"]) * 100,
            2,
        )
        output = {
            "district_id": call.arguments["district_id"],
            "school_year": call.arguments["school_year"],
            "attendance_rate": call.arguments["attendance_rate"],
            "benchmark_rate": call.arguments["benchmark_rate"],
            "gap_percentage_points": gap_points,
        }
        result = ToolResult(
            result_id="result.illinois-education.compare-attendance.v1",
            call_id=call.call_id,
            output=output,
        )
        evidence = Evidence(
            evidence_id="evidence.illinois-education.district-150.v1",
            source_id=fixture["source_id"],
            source_uri=fixture["source_uri"],
            observed_at=fixture["observed_at"],
            content=output,
            tool_call_id=call.call_id,
        )
        direction = "above" if gap_points >= 0 else "below"
        claim = Claim(
            claim_id="claim.illinois-education.district-150.v1",
            claim_type="education.attendance-benchmark-gap",
            statement=(
                f"Synthetic district {call.arguments['district_id']} is "
                f"{abs(gap_points):.2f} percentage points {direction} its attendance benchmark."
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
                    event_id="event.illinois-education.completed.v1",
                    run_id=run_id,
                    event_type="run.completed",
                    occurred_at=fixture["observed_at"],
                    details={"fixture_id": fixture["fixture_id"]},
                ),
            ),
            policy_decisions=(
                PolicyDecision(
                    decision_id="decision.illinois-education.fixture-read.v1",
                    action="read.synthetic-fixture",
                    outcome="allow",
                    reason="The adapter reads only a local synthetic fixture.",
                ),
            ),
        )
