"""Versioned, domain-neutral contracts for independent Agent Labs adapters."""

from __future__ import annotations

import json
import re
import types
from dataclasses import dataclass, fields
from datetime import datetime
from typing import Any, ClassVar, Mapping, Protocol, get_args, get_origin, get_type_hints, runtime_checkable
from urllib.parse import urlparse

SCHEMA_VERSION = "1.0.0"
_ID_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:-]*$")
_VERSION_PATTERN = re.compile(r"^\d+\.\d+\.\d+$")


@dataclass(frozen=True, kw_only=True)
class Contract:
    """A JSON-serializable contract with an explicit, immutable schema envelope."""

    SCHEMA_ID: ClassVar[str]
    SCHEMA_VERSION: ClassVar[str] = SCHEMA_VERSION

    def to_dict(self) -> dict[str, Any]:
        payload = {
            "schema_id": self.SCHEMA_ID,
            "schema_version": self.SCHEMA_VERSION,
        }
        payload.update({field.name: _encode(getattr(self, field.name)) for field in fields(self)})
        return payload

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), sort_keys=True, separators=(",", ":"))

    @classmethod
    def from_dict(cls, payload: Mapping[str, Any]) -> Contract:
        if not isinstance(payload, Mapping):
            raise _violation("INVALID_PAYLOAD", "A contract payload must be a mapping.")
        if payload.get("schema_id") != cls.SCHEMA_ID:
            raise _violation(
                "INVALID_SCHEMA_ID",
                f"Expected schema {cls.SCHEMA_ID!r}.",
                {"received": payload.get("schema_id")},
            )
        if payload.get("schema_version") != cls.SCHEMA_VERSION:
            raise _violation(
                "INCOMPATIBLE_SCHEMA_VERSION",
                f"Schema {cls.SCHEMA_ID!r} supports only version {cls.SCHEMA_VERSION}.",
                {"received": payload.get("schema_version")},
            )

        field_names = {field.name for field in fields(cls)}
        actual_names = set(payload) - {"schema_id", "schema_version"}
        unknown = actual_names - field_names
        if unknown:
            raise _violation(
                "INVALID_PAYLOAD",
                "Contract payload contains unknown fields.",
                {"fields": sorted(unknown)},
            )

        annotations = get_type_hints(cls)
        try:
            decoded = {
                field.name: _decode(payload[field.name], annotations[field.name])
                for field in fields(cls)
                if field.name in payload
            }
            return cls(**decoded)
        except ContractViolation:
            raise
        except (KeyError, TypeError, ValueError) as error:
            raise _violation("INVALID_PAYLOAD", str(error)) from error

    @classmethod
    def from_json(cls, payload: str) -> Contract:
        try:
            decoded = json.loads(payload)
        except (TypeError, ValueError) as error:
            raise _violation("INVALID_PAYLOAD", "Contract JSON is invalid.") from error
        return cls.from_dict(decoded)


@dataclass(frozen=True, kw_only=True)
class StructuredError(Contract):
    SCHEMA_ID: ClassVar[str] = "dataunlocked.agent-labs.structured-error"

    error_id: str
    code: str
    message: str
    details: dict[str, Any] | None = None
    retryable: bool = False

    def __post_init__(self) -> None:
        if not isinstance(self.error_id, str) or not _ID_PATTERN.fullmatch(self.error_id):
            raise ValueError("error_id must be a stable, nonempty identifier.")
        if not isinstance(self.code, str) or not self.code:
            raise ValueError("code must be a nonempty string.")
        if not isinstance(self.message, str) or not self.message:
            raise ValueError("message must be a nonempty string.")


class ContractViolation(ValueError):
    """A validation failure that always exposes a serializable structured error."""

    def __init__(self, error: StructuredError) -> None:
        self.error = error
        super().__init__(error.message)


def _violation(
    code: str,
    message: str,
    details: dict[str, Any] | None = None,
) -> ContractViolation:
    return ContractViolation(
        StructuredError(
            error_id=f"error.{code.lower()}",
            code=code,
            message=message,
            details=details,
        )
    )


def _require_id(value: str, field_name: str) -> None:
    if not isinstance(value, str) or not _ID_PATTERN.fullmatch(value):
        raise _violation(
            "INVALID_IDENTIFIER",
            f"{field_name} must be a stable, nonempty identifier.",
            {"field": field_name},
        )


def _require_text(value: str, field_name: str) -> None:
    if not isinstance(value, str) or not value.strip():
        raise _violation("INVALID_PAYLOAD", f"{field_name} must be nonempty.")


def _encode(value: Any) -> Any:
    if isinstance(value, Contract):
        return value.to_dict()
    if isinstance(value, (tuple, list)):
        return [_encode(item) for item in value]
    if isinstance(value, dict):
        return {key: _encode(item) for key, item in value.items()}
    return value


def _decode(value: Any, annotation: Any) -> Any:
    origin = get_origin(annotation)
    if origin is types.UnionType:
        if value is None and type(None) in get_args(annotation):
            return None
        for option in get_args(annotation):
            if option is not type(None):
                return _decode(value, option)
    if origin is tuple:
        if not isinstance(value, list):
            raise TypeError("Tuple contract fields must be serialized as JSON arrays.")
        item_type = get_args(annotation)[0]
        return tuple(_decode(item, item_type) for item in value)
    if origin is dict:
        if not isinstance(value, dict):
            raise TypeError("Dictionary contract fields must be JSON objects.")
        return value
    if isinstance(annotation, type) and issubclass(annotation, Contract):
        return annotation.from_dict(value)
    return value


@dataclass(frozen=True, kw_only=True)
class AdapterMetadata(Contract):
    SCHEMA_ID: ClassVar[str] = "dataunlocked.agent-labs.adapter-metadata"

    adapter_id: str
    adapter_version: str
    display_name: str
    supported_claim_types: tuple[str, ...]

    def __post_init__(self) -> None:
        _require_id(self.adapter_id, "adapter_id")
        if not isinstance(self.adapter_version, str) or not _VERSION_PATTERN.fullmatch(self.adapter_version):
            raise _violation("INVALID_VERSION", "adapter_version must use semantic versioning.")
        _require_text(self.display_name, "display_name")
        if not self.supported_claim_types:
            raise _violation("INVALID_PAYLOAD", "An adapter must support at least one claim type.")
        for claim_type in self.supported_claim_types:
            _require_id(claim_type, "claim_type")


@dataclass(frozen=True, kw_only=True)
class Request(Contract):
    SCHEMA_ID: ClassVar[str] = "dataunlocked.agent-labs.request"

    request_id: str
    adapter_id: str
    question: str
    arguments: dict[str, Any]

    def __post_init__(self) -> None:
        _require_id(self.request_id, "request_id")
        _require_id(self.adapter_id, "adapter_id")
        _require_text(self.question, "question")
        if not isinstance(self.arguments, dict):
            raise _violation("INVALID_PAYLOAD", "arguments must be an object.")


@dataclass(frozen=True, kw_only=True)
class ToolDescriptor(Contract):
    SCHEMA_ID: ClassVar[str] = "dataunlocked.agent-labs.tool-descriptor"

    tool_id: str
    tool_version: str
    description: str
    input_schema: dict[str, Any]

    def __post_init__(self) -> None:
        _require_id(self.tool_id, "tool_id")
        if not isinstance(self.tool_version, str) or not _VERSION_PATTERN.fullmatch(self.tool_version):
            raise _violation("INVALID_VERSION", "tool_version must use semantic versioning.")
        _require_text(self.description, "description")
        if not isinstance(self.input_schema, dict) or self.input_schema.get("type") != "object":
            raise _violation("INVALID_PAYLOAD", "input_schema must describe a JSON object.")


@dataclass(frozen=True, kw_only=True)
class ToolCall(Contract):
    SCHEMA_ID: ClassVar[str] = "dataunlocked.agent-labs.tool-call"

    call_id: str
    tool_id: str
    arguments: dict[str, Any]

    def __post_init__(self) -> None:
        _require_id(self.call_id, "call_id")
        _require_id(self.tool_id, "tool_id")
        if not isinstance(self.arguments, dict):
            raise _violation("INVALID_TOOL_ARGUMENTS", "Tool arguments must be an object.")


@dataclass(frozen=True, kw_only=True)
class ToolResult(Contract):
    SCHEMA_ID: ClassVar[str] = "dataunlocked.agent-labs.tool-result"

    result_id: str
    call_id: str
    output: dict[str, Any]
    error: StructuredError | None = None

    def __post_init__(self) -> None:
        _require_id(self.result_id, "result_id")
        _require_id(self.call_id, "call_id")
        if not isinstance(self.output, dict):
            raise _violation("INVALID_PAYLOAD", "Tool output must be an object.")


@dataclass(frozen=True, kw_only=True)
class Evidence(Contract):
    SCHEMA_ID: ClassVar[str] = "dataunlocked.agent-labs.evidence"

    evidence_id: str
    source_id: str
    source_uri: str
    observed_at: str
    content: dict[str, Any]
    tool_call_id: str

    def __post_init__(self) -> None:
        _require_id(self.evidence_id, "evidence_id")
        _require_id(self.tool_call_id, "tool_call_id")
        if not isinstance(self.source_id, str) or not _ID_PATTERN.fullmatch(self.source_id):
            raise _violation("MISSING_PROVENANCE", "Evidence requires a stable source_id.")
        if not isinstance(self.source_uri, str) or not urlparse(self.source_uri).scheme:
            raise _violation("MISSING_PROVENANCE", "Evidence requires a source_uri with a scheme.")
        try:
            observed_at = datetime.fromisoformat(self.observed_at)
        except (TypeError, ValueError) as error:
            raise _violation("MISSING_PROVENANCE", "Evidence requires an ISO 8601 observed_at.") from error
        if observed_at.tzinfo is None:
            raise _violation("MISSING_PROVENANCE", "Evidence observed_at must include a timezone.")
        if not isinstance(self.content, dict) or not self.content:
            raise _violation("INVALID_PAYLOAD", "Evidence content must be a nonempty object.")


@dataclass(frozen=True, kw_only=True)
class Claim(Contract):
    SCHEMA_ID: ClassVar[str] = "dataunlocked.agent-labs.claim"

    claim_id: str
    claim_type: str
    statement: str
    evidence_ids: tuple[str, ...]
    confidence: float

    def __post_init__(self) -> None:
        _require_id(self.claim_id, "claim_id")
        _require_id(self.claim_type, "claim_type")
        _require_text(self.statement, "statement")
        if not self.evidence_ids:
            raise _violation("UNSUPPORTED_CLAIM", "Claims must cite at least one evidence record.")
        for evidence_id in self.evidence_ids:
            _require_id(evidence_id, "evidence_id")
        if isinstance(self.confidence, bool) or not isinstance(self.confidence, (int, float)):
            raise _violation("INVALID_PAYLOAD", "confidence must be a number between zero and one.")
        if not 0 <= self.confidence <= 1:
            raise _violation("INVALID_PAYLOAD", "confidence must be between zero and one.")


@dataclass(frozen=True, kw_only=True)
class ApprovalRequest(Contract):
    SCHEMA_ID: ClassVar[str] = "dataunlocked.agent-labs.approval-request"

    approval_id: str
    run_id: str
    action: str
    reason: str
    status: str = "pending"

    def __post_init__(self) -> None:
        _require_id(self.approval_id, "approval_id")
        _require_id(self.run_id, "run_id")
        _require_text(self.action, "action")
        _require_text(self.reason, "reason")
        if self.status not in {"pending", "approved", "denied"}:
            raise _violation("INVALID_POLICY_DECISION", "Approval status is not supported.")


@dataclass(frozen=True, kw_only=True)
class PolicyDecision(Contract):
    SCHEMA_ID: ClassVar[str] = "dataunlocked.agent-labs.policy-decision"

    decision_id: str
    action: str
    outcome: str
    reason: str
    approval_id: str | None = None

    def __post_init__(self) -> None:
        _require_id(self.decision_id, "decision_id")
        _require_text(self.action, "action")
        _require_text(self.reason, "reason")
        if self.outcome not in {"allow", "deny", "require_approval"}:
            raise _violation("INVALID_POLICY_DECISION", "Policy outcome is not supported.")
        if self.outcome == "require_approval" and self.approval_id is None:
            raise _violation("INVALID_POLICY_DECISION", "Approval-gated actions need an approval_id.")
        if self.approval_id is not None:
            _require_id(self.approval_id, "approval_id")


@dataclass(frozen=True, kw_only=True)
class RunEvent(Contract):
    SCHEMA_ID: ClassVar[str] = "dataunlocked.agent-labs.run-event"

    event_id: str
    run_id: str
    event_type: str
    occurred_at: str
    details: dict[str, Any]

    def __post_init__(self) -> None:
        _require_id(self.event_id, "event_id")
        _require_id(self.run_id, "run_id")
        _require_id(self.event_type, "event_type")
        try:
            occurred_at = datetime.fromisoformat(self.occurred_at)
        except (TypeError, ValueError) as error:
            raise _violation("INVALID_PAYLOAD", "occurred_at must be an ISO 8601 timestamp.") from error
        if occurred_at.tzinfo is None:
            raise _violation("INVALID_PAYLOAD", "occurred_at must include a timezone.")
        if not isinstance(self.details, dict):
            raise _violation("INVALID_PAYLOAD", "Event details must be an object.")


def validate_tool_call(descriptor: ToolDescriptor, call: ToolCall) -> None:
    """Validate the small JSON Schema subset needed for adapter tool contracts."""

    if call.tool_id != descriptor.tool_id:
        raise _violation(
            "INVALID_TOOL_ARGUMENTS",
            "The tool call does not match the descriptor.",
            {"expected_tool_id": descriptor.tool_id, "received_tool_id": call.tool_id},
        )

    schema = descriptor.input_schema
    properties = schema.get("properties", {})
    required = set(schema.get("required", ()))
    missing = required - set(call.arguments)
    if missing:
        raise _violation(
            "INVALID_TOOL_ARGUMENTS",
            "Required tool arguments are missing.",
            {"fields": sorted(missing)},
        )

    if schema.get("additionalProperties", True) is False:
        unexpected = set(call.arguments) - set(properties)
        if unexpected:
            raise _violation(
                "INVALID_TOOL_ARGUMENTS",
                "Tool arguments contain unexpected fields.",
                {"fields": sorted(unexpected)},
            )

    for name, value in call.arguments.items():
        if name in properties:
            _validate_argument(value, properties[name], name)


def _validate_argument(value: Any, schema: Mapping[str, Any], path: str) -> None:
    expected = schema.get("type")
    checks = {
        "string": lambda item: isinstance(item, str),
        "number": lambda item: isinstance(item, (int, float)) and not isinstance(item, bool),
        "integer": lambda item: isinstance(item, int) and not isinstance(item, bool),
        "boolean": lambda item: isinstance(item, bool),
        "array": lambda item: isinstance(item, list),
        "object": lambda item: isinstance(item, dict),
    }
    if expected in checks and not checks[expected](value):
        raise _violation(
            "INVALID_TOOL_ARGUMENTS",
            f"Tool argument {path!r} must have type {expected!r}.",
            {"field": path, "expected_type": expected},
        )
    if "enum" in schema and value not in schema["enum"]:
        raise _violation("INVALID_TOOL_ARGUMENTS", f"Tool argument {path!r} is not supported.")
    if "minimum" in schema and value < schema["minimum"]:
        raise _violation("INVALID_TOOL_ARGUMENTS", f"Tool argument {path!r} is below its minimum.")
    if "maximum" in schema and value > schema["maximum"]:
        raise _violation("INVALID_TOOL_ARGUMENTS", f"Tool argument {path!r} exceeds its maximum.")
    if expected == "array":
        if len(value) < schema.get("minItems", 0):
            raise _violation("INVALID_TOOL_ARGUMENTS", f"Tool argument {path!r} has too few items.")
        for index, item in enumerate(value):
            _validate_argument(item, schema.get("items", {}), f"{path}[{index}]")


def validate_claim(
    claim: Claim,
    adapter: AdapterMetadata,
    evidence: tuple[Evidence, ...],
) -> None:
    """Require a supported claim type and resolvable evidence provenance."""

    if claim.claim_type not in adapter.supported_claim_types:
        raise _violation(
            "UNSUPPORTED_CLAIM",
            "The adapter does not support this claim type.",
            {"claim_type": claim.claim_type, "adapter_id": adapter.adapter_id},
        )
    known_evidence = {item.evidence_id for item in evidence}
    missing = set(claim.evidence_ids) - known_evidence
    if missing:
        raise _violation(
            "UNSUPPORTED_CLAIM",
            "The claim references evidence that is unavailable.",
            {"evidence_ids": sorted(missing)},
        )


@dataclass(frozen=True, kw_only=True)
class RunRecord(Contract):
    SCHEMA_ID: ClassVar[str] = "dataunlocked.agent-labs.run-record"

    run_id: str
    adapter: AdapterMetadata
    request: Request
    tool_calls: tuple[ToolCall, ...] = ()
    tool_results: tuple[ToolResult, ...] = ()
    evidence: tuple[Evidence, ...] = ()
    claims: tuple[Claim, ...] = ()
    events: tuple[RunEvent, ...] = ()
    approvals: tuple[ApprovalRequest, ...] = ()
    policy_decisions: tuple[PolicyDecision, ...] = ()
    errors: tuple[StructuredError, ...] = ()

    def __post_init__(self) -> None:
        _require_id(self.run_id, "run_id")
        if self.request.adapter_id != self.adapter.adapter_id:
            raise _violation("INVALID_PAYLOAD", "The request and adapter identifiers must match.")

        call_ids = {call.call_id for call in self.tool_calls}
        for result in self.tool_results:
            if result.call_id not in call_ids:
                raise _violation("INVALID_PAYLOAD", "Tool results must reference a known tool call.")
        for item in self.evidence:
            if item.tool_call_id not in call_ids:
                raise _violation("MISSING_PROVENANCE", "Evidence must reference a known tool call.")
        for claim in self.claims:
            validate_claim(claim, self.adapter, self.evidence)
        for event in self.events:
            if event.run_id != self.run_id:
                raise _violation("INVALID_PAYLOAD", "Events must reference the current run.")
        approval_ids = {approval.approval_id for approval in self.approvals}
        for approval in self.approvals:
            if approval.run_id != self.run_id:
                raise _violation("INVALID_PAYLOAD", "Approvals must reference the current run.")
        for decision in self.policy_decisions:
            if decision.approval_id is not None and decision.approval_id not in approval_ids:
                raise _violation("INVALID_POLICY_DECISION", "Policy decisions must reference known approvals.")


@runtime_checkable
class Adapter(Protocol):
    """Minimal, domain-neutral interface implemented by each adapter."""

    metadata: AdapterMetadata
    tools: tuple[ToolDescriptor, ...]

    def execute(self, request: Request) -> RunRecord:
        """Validate the request and return a fully traceable run record."""
