"""Prove core contracts have no adapter or coursework import dependencies."""

from __future__ import annotations

import ast
import json
import subprocess
import sys
import unittest
from pathlib import Path


class DependencyBoundaryTests(unittest.TestCase):
    def test_core_source_does_not_import_adapters_or_coursework(self) -> None:
        core_directory = Path(__file__).resolve().parent.parent / "core"

        for source_path in sorted(core_directory.glob("*.py")):
            tree = ast.parse(source_path.read_text(encoding="utf-8"))
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    imported = [alias.name for alias in node.names]
                elif isinstance(node, ast.ImportFrom):
                    imported = [node.module or ""]
                else:
                    continue

                for module in imported:
                    with self.subTest(file=source_path.name, module=module):
                        self.assertNotIn("adapters", module)
                        self.assertNotIn("northwestern", module)
                        self.assertNotIn("msds", module.lower())

    def test_importing_core_does_not_load_either_adapter(self) -> None:
        project_root = Path(__file__).resolve().parents[3]
        program = (
            "import json, sys; "
            "import apps.agent_labs.core; "
            "print(json.dumps(sorted(name for name in sys.modules "
            "if name.startswith('apps.agent_labs.adapters'))))"
        )
        completed = subprocess.run(
            [sys.executable, "-c", program],
            cwd=project_root,
            capture_output=True,
            text=True,
            check=True,
        )

        self.assertEqual(json.loads(completed.stdout), [])


if __name__ == "__main__":
    unittest.main()
