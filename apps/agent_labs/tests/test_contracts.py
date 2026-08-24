"""Serialization, contract integrity, and negative validation coverage."""

from __future__ import annotations

import json
import unittest
from dataclasses import replace

from apps.agent_labs.adapters.illinois_education import (
    ATTENDANCE_COMPARISON_TOOL,
    IllinoisEducationAdapter,
    fixture_request as education_fixture_request,
)
from apps.agent_labs.adapters.pricing import (
    PRICE_COMPARISON_TOOL,
    PricingIntelligenceAdapter,
    fixture_request as pricing_fixture_request,
)
from apps.agent_labs.core import (
    SCHEMA_VERSION,
    AdapterMetadata,
    ApprovalRequest,
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
    validate_claim,
    validate_tool_call,
)


class SerializationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.run = PricingIntelligenceAdapter().execute(pricing_fixture_request())
        self.approval = ApprovalRequest(
            approval_id="approval.pricing.review.v1",
            run_id=self.run.run_id,
            action="publish.recommendation",
            reason="A human must approve a customer-facing recommendation.",
        )
        self.error = StructuredError(
            error_id="error.example.v1",
            code="EXAMPLE_ERROR",
            message="An example structured error.",
            details={"field": "current_price"},
            retryable=True,
        )

    def test_every_contract_serializes_and_round_trips(self) -> None:
        contracts = (
            self.run.adapter,
            self.run.request,
            PRICE_COMPARISON_TOOL,
            self.run.tool_calls[0],
            self.run.tool_results[0],
            self.run.evidence[0],
            self.run.claims[0],
            self.run.events[0],
            self.run.policy_decisions[0],
            self.approval,
            self.error,
            self.run,
        )

        for contract in contracts:
            with self.subTest(contract=type(contract).__name__):
                payload = contract.to_dict()
                self.assertEqual(payload["schema_id"], type(contract).SCHEMA_ID)
                self.assertEqual(payload["schema_version"], SCHEMA_VERSION)
                self.assertEqual(type(contract).from_dict(payload), contract)
                self.assertEqual(type(contract).from_json(contract.to_json()), contract)

    def test_nested_contracts_preserve_their_schema_envelopes(self) -> None:
        payload = json.loads(self.run.to_json())
        self.assertEqual(payload["adapter"]["schema_id"], AdapterMetadata.SCHEMA_ID)
        self.assertEqual(payload["request"]["schema_id"], Request.SCHEMA_ID)
        self.assertEqual(payload["tool_calls"][0]["schema_id"], ToolCall.SCHEMA_ID)
        self.assertEqual(payload["tool_results"][0]["schema_id"], ToolResult.SCHEMA_ID)
        self.assertEqual(payload["evidence"][0]["schema_id"], Evidence.SCHEMA_ID)
        self.assertEqual(payload["claims"][0]["schema_id"], Claim.SCHEMA_ID)
        self.assertEqual(payload["events"][0]["schema_id"], RunEvent.SCHEMA_ID)
        self.assertEqual(payload["policy_decisions"][0]["schema_id"], PolicyDecision.SCHEMA_ID)

    def test_approval_gated_policy_decisions_round_trip(self) -> None:
        gated = replace(
            self.run,
            approvals=(self.approval,),
            policy_decisions=(
                PolicyDecision(
                    decision_id="decision.pricing.approval.v1",
                    action="publish.recommendation",
                    outcome="require_approval",
                    reason="Publishing requires a human decision.",
                    approval_id=self.approval.approval_id,
                ),
            ),
            errors=(self.error,),
        )
        self.assertEqual(RunRecord.from_json(gated.to_json()), gated)

    def test_incompatible_schema_version_is_rejected(self) -> None:
        payload = self.run.request.to_dict()
        payload["schema_version"] = "2.0.0"

        with self.assertRaises(ContractViolation) as caught:
            Request.from_dict(payload)

        self.assertEqual(caught.exception.error.code, "INCOMPATIBLE_SCHEMA_VERSION")

    def test_incompatible_nested_schema_version_is_rejected(self) -> None:
        payload = self.run.to_dict()
        payload["evidence"][0]["schema_version"] = "2.0.0"

        with self.assertRaises(ContractViolation) as caught:
            RunRecord.from_dict(payload)

        self.assertEqual(caught.exception.error.code, "INCOMPATIBLE_SCHEMA_VERSION")

    def test_wrong_schema_id_is_rejected(self) -> None:
        payload = self.run.request.to_dict()
        payload["schema_id"] = ToolDescriptor.SCHEMA_ID

        with self.assertRaises(ContractViolation) as caught:
            Request.from_dict(payload)

        self.assertEqual(caught.exception.error.code, "INVALID_SCHEMA_ID")

    def test_unknown_payload_fields_are_rejected(self) -> None:
        payload = self.run.request.to_dict()
        payload["unexpected"] = True

        with self.assertRaises(ContractViolation) as caught:
            Request.from_dict(payload)

        self.assertEqual(caught.exception.error.code, "INVALID_PAYLOAD")


class NegativeToolArgumentTests(unittest.TestCase):
    def assert_invalid_pricing_arguments(self, arguments: dict[str, object]) -> None:
        call = ToolCall(
            call_id="call.pricing.invalid.v1",
            tool_id=PRICE_COMPARISON_TOOL.tool_id,
            arguments=arguments,
        )
        with self.assertRaises(ContractViolation) as caught:
            validate_tool_call(PRICE_COMPARISON_TOOL, call)
        self.assertEqual(caught.exception.error.code, "INVALID_TOOL_ARGUMENTS")

    def test_wrong_argument_type_is_rejected(self) -> None:
        self.assert_invalid_pricing_arguments(
            {
                "product_id": "RUNNER-001",
                "current_price": "120.00",
                "competitor_prices": [110.0],
            }
        )

    def test_missing_required_argument_is_rejected(self) -> None:
        self.assert_invalid_pricing_arguments(
            {"product_id": "RUNNER-001", "current_price": 120.0}
        )

    def test_unexpected_argument_is_rejected(self) -> None:
        self.assert_invalid_pricing_arguments(
            {
                "product_id": "RUNNER-001",
                "current_price": 120.0,
                "competitor_prices": [110.0],
                "unexpected": True,
            }
        )

    def test_negative_price_is_rejected(self) -> None:
        self.assert_invalid_pricing_arguments(
            {
                "product_id": "RUNNER-001",
                "current_price": -1.0,
                "competitor_prices": [110.0],
            }
        )

    def test_invalid_array_item_is_rejected(self) -> None:
        self.assert_invalid_pricing_arguments(
            {
                "product_id": "RUNNER-001",
                "current_price": 120.0,
                "competitor_prices": ["110.00"],
            }
        )

    def test_boolean_is_not_accepted_as_a_price(self) -> None:
        self.assert_invalid_pricing_arguments(
            {
                "product_id": "RUNNER-001",
                "current_price": True,
                "competitor_prices": [110.0],
            }
        )

    def test_out_of_range_education_rate_is_rejected(self) -> None:
        call = ToolCall(
            call_id="call.illinois-education.invalid.v1",
            tool_id=ATTENDANCE_COMPARISON_TOOL.tool_id,
            arguments={
                "district_id": "IL-DISTRICT-150",
                "school_year": 2025,
                "attendance_rate": 1.5,
                "benchmark_rate": 0.94,
            },
        )

        with self.assertRaises(ContractViolation) as caught:
            validate_tool_call(ATTENDANCE_COMPARISON_TOOL, call)

        self.assertEqual(caught.exception.error.code, "INVALID_TOOL_ARGUMENTS")


class ProvenanceAndClaimTests(unittest.TestCase):
    def setUp(self) -> None:
        self.run = PricingIntelligenceAdapter().execute(pricing_fixture_request())

    def test_missing_source_identifier_is_rejected(self) -> None:
        with self.assertRaises(ContractViolation) as caught:
            replace(self.run.evidence[0], source_id="")
        self.assertEqual(caught.exception.error.code, "MISSING_PROVENANCE")

    def test_missing_source_uri_is_rejected(self) -> None:
        with self.assertRaises(ContractViolation) as caught:
            replace(self.run.evidence[0], source_uri="")
        self.assertEqual(caught.exception.error.code, "MISSING_PROVENANCE")

    def test_missing_source_timestamp_is_rejected(self) -> None:
        with self.assertRaises(ContractViolation) as caught:
            replace(self.run.evidence[0], observed_at="2026-08-01T12:00:00")
        self.assertEqual(caught.exception.error.code, "MISSING_PROVENANCE")

    def test_unsupported_claim_type_is_rejected(self) -> None:
        unsupported = replace(self.run.claims[0], claim_type="education.attendance-benchmark-gap")

        with self.assertRaises(ContractViolation) as caught:
            validate_claim(unsupported, self.run.adapter, self.run.evidence)

        self.assertEqual(caught.exception.error.code, "UNSUPPORTED_CLAIM")

    def test_claim_without_supporting_evidence_is_rejected(self) -> None:
        with self.assertRaises(ContractViolation) as caught:
            replace(self.run.claims[0], evidence_ids=())
        self.assertEqual(caught.exception.error.code, "UNSUPPORTED_CLAIM")

    def test_claim_referencing_unknown_evidence_is_rejected(self) -> None:
        unsupported = replace(self.run.claims[0], evidence_ids=("evidence.unknown.v1",))

        with self.assertRaises(ContractViolation) as caught:
            validate_claim(unsupported, self.run.adapter, self.run.evidence)

        self.assertEqual(caught.exception.error.code, "UNSUPPORTED_CLAIM")

    def test_evidence_referencing_unknown_tool_call_is_rejected(self) -> None:
        untraceable = replace(self.run.evidence[0], tool_call_id="call.unknown.v1")

        with self.assertRaises(ContractViolation) as caught:
            replace(self.run, evidence=(untraceable,))

        self.assertEqual(caught.exception.error.code, "MISSING_PROVENANCE")

    def test_approval_gated_policy_requires_approval_identifier(self) -> None:
        with self.assertRaises(ContractViolation) as caught:
            PolicyDecision(
                decision_id="decision.approval.invalid.v1",
                action="publish.recommendation",
                outcome="require_approval",
                reason="A human must approve this action.",
            )
        self.assertEqual(caught.exception.error.code, "INVALID_POLICY_DECISION")


class FixtureAdapterTests(unittest.TestCase):
    def test_pricing_fixture_produces_a_supported_traceable_claim(self) -> None:
        run = PricingIntelligenceAdapter().execute(pricing_fixture_request())

        self.assertEqual(run.adapter.display_name, "Pricing Intelligence")
        self.assertEqual(run.tool_results[0].output["market_median"], 110.0)
        self.assertEqual(run.tool_results[0].output["difference"], 10.0)
        self.assertIn("$10.00 above", run.claims[0].statement)
        self.assertEqual(run.claims[0].evidence_ids, (run.evidence[0].evidence_id,))
        self.assertTrue(run.evidence[0].source_uri.startswith("fixture://"))

    def test_education_fixture_produces_a_supported_traceable_claim(self) -> None:
        run = IllinoisEducationAdapter().execute(education_fixture_request())

        self.assertEqual(run.adapter.display_name, "Illinois Education Analytics")
        self.assertEqual(run.tool_results[0].output["gap_percentage_points"], -3.0)
        self.assertIn("3.00 percentage points below", run.claims[0].statement)
        self.assertEqual(run.claims[0].evidence_ids, (run.evidence[0].evidence_id,))
        self.assertTrue(run.evidence[0].source_uri.startswith("fixture://"))

    def test_fixture_runs_have_stable_identifiers_and_serialization(self) -> None:
        adapters = (
            (PricingIntelligenceAdapter(), pricing_fixture_request),
            (IllinoisEducationAdapter(), education_fixture_request),
        )
        for adapter, request_factory in adapters:
            with self.subTest(adapter=adapter.metadata.adapter_id):
                first = adapter.execute(request_factory())
                second = adapter.execute(request_factory())
                self.assertEqual(first.to_json(), second.to_json())
                self.assertEqual(RunRecord.from_json(first.to_json()), first)

    def test_adapters_reject_requests_for_other_domains(self) -> None:
        with self.assertRaises(ContractViolation) as caught:
            PricingIntelligenceAdapter().execute(education_fixture_request())
        self.assertEqual(caught.exception.error.code, "INVALID_ADAPTER")


if __name__ == "__main__":
    unittest.main()
