import { sdk } from "@/services/sdk";
import {
  identity,
  ownRequest,
  written,
  validDevice,
  validRequest,
  grantsFor,
  selectGrant,
} from "@/services/access";

export function browserId() {
  const user = identity();
  if (!user?.id) throw new Error("Sign in first.");
  const key = "openrepertory-website-browser:" + user.id;
  let value = localStorage.getItem(key);
  if (!validDevice(value)) {
    value = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    localStorage.setItem(key, value);
  }
  return value;
}

function assertAccount(expected) {
  if (identity()?.id !== expected.id) {
    throw new Error("Your account changed. Refresh and sign in again.");
  }
}

export async function websiteStatus() {
  const user = identity();
  if (!user?.id) throw new Error("Sign in first.");
  const device = browserId();
  const request = await ownRequest(device);
  assertAccount(user);
  if (!request) return { status: "not-requested" };
  if (!validRequest(request) || request.platform_c !== "Website") {
    throw new Error("This is not a valid website request.");
  }
  const grant = selectGrant(await grantsFor(request), request);
  assertAccount(user);
  return { status: grant?.status_c || "pending" };
}

export async function requestWebsiteAccess() {
  const user = identity();
  if (!user?.id) throw new Error("Sign in first.");
  const device = browserId();
  const existing = await ownRequest(device);
  assertAccount(user);
  if (existing) {
    if (!validRequest(existing) || existing.platform_c !== "Website") {
      throw new Error("This browser identifier belongs to another access type.");
    }
    return existing;
  }
  return written(await sdk.table("device_requests_c").create({
    Name: "Website · " + user.name + " · " + device.slice(0, 8),
    account_id_c: user.id,
    email_c: user.email,
    device_id_c: device,
    platform_c: "Website",
  }));
}
