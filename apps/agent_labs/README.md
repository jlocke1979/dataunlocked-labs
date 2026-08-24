# Agent Labs — AL-001

Agent Labs is an independent, domain-neutral contract package with two synthetic
fixture adapters. All implementation, fixture data, and tests live inside this
directory. Nothing imports or depends on MSDS coursework or submission files.

## Layout

- `core/contracts.py`: versioned contracts, adapter interface, policy decisions,
  structured errors, provenance checks, claim checks, and argument validation.
- `adapters/pricing.py`: deterministic Pricing Intelligence fixture adapter.
- `adapters/illinois_education.py`: deterministic Illinois Education Analytics
  fixture adapter.
- `fixtures/*.json`: explicitly synthetic, stable-ID example requests and data.
- `tests/`: serialization, fixture, validation, and dependency-boundary tests.

The core depends only on the Python standard library. Adapters depend on the
core; the core never imports adapters. Every serialized contract contains an
explicit schema identifier and schema version (`1.0.0`). Schema changes are
rejected unless explicitly supported.

Run all tests from the repository root:

```sh
python -m unittest discover -s apps/agent_labs/tests -v
```

The product and technical blueprint is not yet present at
`docs/product-technical-blueprint.md` and still needs to be added separately.
