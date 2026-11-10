"""Read-only Cloudflare credential check. Never print credentials or API bodies."""
import json
import os
import re
import sys
import urllib.error
import urllib.request

API = "https://api.cloudflare.com/client/v4"


def request(path, token):
    req = urllib.request.Request(
        API + path,
        headers={"Authorization": "Bearer " + token, "Accept": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            body = json.load(response)
    except urllib.error.HTTPError as error:
        raise RuntimeError(f"Cloudflare returned HTTP {error.code}; check the token's permissions and account scope.") from None
    except (urllib.error.URLError, ValueError):
        raise RuntimeError("Cloudflare connection failed; retry or check service availability.") from None
    if body.get("success") is not True:
        raise RuntimeError("Cloudflare rejected the request; check token status and permissions.")
    return body.get("result")


def select_account(accounts, configured=None):
    ids = [a.get("id") for a in accounts if re.fullmatch(r"[0-9a-f]{32}", a.get("id", ""))]
    if configured:
        if configured not in ids:
            raise RuntimeError("Configured Cloudflare account is not accessible to this token.")
        return configured
    if len(ids) != 1:
        raise RuntimeError("Scope the token to exactly one Cloudflare account, or set CLOUDFLARE_ACCOUNT_ID as a repository variable.")
    return ids[0]


def main():
    token = os.environ.get("CLOUDFLARE_API_TOKEN", "").strip()
    if not token:
        raise RuntimeError("Add the CLOUDFLARE_API_TOKEN repository secret using the one-time connection guide.")
    verified = request("/user/tokens/verify", token)
    if not isinstance(verified, dict) or verified.get("status") != "active":
        raise RuntimeError("The Cloudflare API token is not active.")
    account = select_account(request("/accounts?per_page=50", token), os.environ.get("CLOUDFLARE_ACCOUNT_ID") or None)
    request(f"/accounts/{account}/workers/scripts", token)
    request(f"/accounts/{account}/d1/database?per_page=1", token)
    print("PASS: active token; one intended account; Workers and D1 are readable.")
    print("This read-only check did not create services, change billing or deploy the website.")
    print("Write permissions and runtime free-tier compatibility still require deployment validation.")


if __name__ == "__main__":
    try:
        main()
    except RuntimeError as error:
        print("Connection not ready: " + str(error), file=sys.stderr)
        sys.exit(1)
