"""Ensure notifications contain only public URLs and failures remain visible."""
import importlib.util
import json
import unittest
import urllib.error
import urllib.parse
from pathlib import Path
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('submit_search', Path(__file__).parents[1] / 'scripts/submit_search.py')
submission = importlib.util.module_from_spec(spec)
spec.loader.exec_module(submission)


class NotificationTest(unittest.TestCase):
    def test_public_only_and_both_services_notified(self):
        with patch.object(submission, 'fetch', return_value=(202, '', {})) as fetch:
            results = submission.notify('https://example.test', 'public-proof')
        self.assertTrue(all(r['accepted'] for r in results))
        self.assertEqual(len(fetch.call_args_list), 2)
        index, hub = fetch.call_args_list
        self.assertEqual(json.loads(index.args[1])['urlList'], ['https://example.test/'])
        self.assertEqual(urllib.parse.parse_qs(hub.args[1].decode()), {
            'hub.mode': ['publish'], 'hub.url': ['https://example.test/updates.atom']})

    def test_failure_does_not_skip_second_service_or_claim_success(self):
        with patch.object(submission, 'fetch', side_effect=[urllib.error.URLError('test failure'), (204, '', {})]):
            results = submission.notify('https://example.test', 'public-proof')
        self.assertFalse(results[0]['accepted'])
        self.assertTrue(results[1]['accepted'])


if __name__ == '__main__':
    unittest.main()
