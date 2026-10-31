"""Run: python3 -m unittest discover -s intelligence-fusion/tests"""
import importlib.util
from pathlib import Path
import unittest

path = Path(__file__).resolve().parents[1] / "server.py"
spec = importlib.util.spec_from_file_location("fusion_demo", path)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class DatasetTests(unittest.TestCase):
    def test_demo_is_valid(self):
        self.assertTrue(module.validate_dataset(module.ENTITIES, module.EVENTS))

    def test_unknown_subject_rejected(self):
        bad = [{"id": "e", "timestamp": "2026-01-01T00:00:00Z",
                "source": "test", "subjects": ["missing"]}]
        with self.assertRaises(ValueError):
            module.validate_dataset(module.ENTITIES, bad)

    def test_duplicate_entity_rejected(self):
        with self.assertRaises(ValueError):
            module.validate_dataset(module.ENTITIES + [module.ENTITIES[0]], [])

if __name__ == "__main__":
    unittest.main()
