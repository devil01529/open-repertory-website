import importlib.util
import unittest
from pathlib import Path
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("connection", Path(__file__).parents[1] / "scripts/check_cloudflare_connection.py")
connection = importlib.util.module_from_spec(spec)
spec.loader.exec_module(connection)


class ConnectionTests(unittest.TestCase):
    def test_only_unambiguous_account_selected(self):
        one, two = "a" * 32, "b" * 32
        self.assertEqual(connection.select_account([{"id": one}]), one)
        with self.assertRaises(RuntimeError):
            connection.select_account([{"id": one}, {"id": two}])
        self.assertEqual(connection.select_account([{"id": one}, {"id": two}], two), two)
        with self.assertRaises(RuntimeError):
            connection.select_account([{"id": one}], two)

    def test_missing_secret_does_not_make_requests(self):
        with patch.dict(connection.os.environ, {}, clear=True), patch.object(connection, "request") as request:
            with self.assertRaises(RuntimeError):
                connection.main()
            request.assert_not_called()

    def test_valid_flow_is_read_only(self):
        account = "a" * 32
        with patch.dict(connection.os.environ, {"CLOUDFLARE_API_TOKEN": "synthetic-test-only"}, clear=True), patch.object(connection, "request", side_effect=[{"status": "active"}, [{"id": account}], [], []]) as request, patch("builtins.print"):
            connection.main()
            self.assertEqual([call.args[0] for call in request.call_args_list], [
                "/user/tokens/verify", "/accounts?per_page=50",
                f"/accounts/{account}/workers/scripts", f"/accounts/{account}/d1/database?per_page=1",
            ])


if __name__ == "__main__":
    unittest.main()
