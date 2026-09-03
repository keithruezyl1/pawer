/**
 * Exercise each secret for real, without side effects:
 *   FCM_SERVICE_ACCOUNT   mint an access token, then a validate_only send (nothing is delivered)
 *   MAPTILER_KEY          fetch one 100x100 static image with the restricted User-Agent
 *   GOOGLE_SERVICES_JSON  parse; project must match the service account; an Android client must exist
 *                         for the app's package
 * Presence is not correctness — a wrong file uploads fine. This is what a green run proves.
 */
import { buildJwt, getAccessToken, type ServiceAccount } from "./fcm";
import { MAPS_UA } from "./maps/ua";

export interface CheckResult { ok: boolean; problems: string[] }

export function checkGoogleServices(json: string, saProjectId: string, packageName: string): CheckResult {
  const problems: string[] = [];
  let g: { project_info?: { project_id?: string }; client?: Array<{ client_info?: { android_client_info?: { package_name?: string } } }> };
  try {
    g = JSON.parse(json);
  } catch {
    return { ok: false, problems: ["GOOGLE_SERVICES_JSON is not valid JSON"] };
  }
  const pid = g.project_info?.project_id;
  if (pid !== saProjectId) problems.push(`GOOGLE_SERVICES_JSON project_id "${pid}" does not match the service account's "${saProjectId}"`);
  const pkgs = (g.client ?? []).map((c) => c.client_info?.android_client_info?.package_name).filter(Boolean);
  if (!pkgs.includes(packageName)) problems.push(`GOOGLE_SERVICES_JSON has no Android client for ${packageName} (found: ${pkgs.join(", ") || "none"})`);
  return { ok: problems.length === 0, problems };
}

export function validateOnlyMessage(topic: string) {
  return {
    validate_only: true,
    message: { topic, data: { type: "verify" }, android: { priority: "normal" as const } },
  };
}

export interface VerifyEnv {
  FCM_SERVICE_ACCOUNT?: string;
  MAPTILER_KEY?: string;
  GOOGLE_SERVICES_JSON?: string;
}

export async function runVerify(env: VerifyEnv, fetchImpl: typeof fetch = fetch, log: (s: string) => void = console.log): Promise<boolean> {
  let allOk = true;
  const report = (name: string, ok: boolean, detail: string) => {
    log(`${ok ? "PASS" : "FAIL"}  ${name}: ${detail}`);
    if (!ok) allOk = false;
  };

  // --- FCM ---
  let sa: ServiceAccount | null = null;
  if (!env.FCM_SERVICE_ACCOUNT) {
    report("FCM_SERVICE_ACCOUNT", false, "not set");
  } else {
    try {
      sa = JSON.parse(env.FCM_SERVICE_ACCOUNT) as ServiceAccount;
      if (!sa.private_key || !sa.client_email || !sa.project_id || !sa.token_uri) throw new Error("missing private_key / client_email / project_id / token_uri");
      buildJwt(sa, Math.floor(Date.now() / 1000)); // throws if the key is malformed
      const token = await getAccessToken(sa, fetchImpl);
      const res = await fetchImpl(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(validateOnlyMessage("veco.v1.cebu-city.lahug")),
      });
      report("FCM_SERVICE_ACCOUNT", res.ok, res.ok ? `token minted; validate_only send accepted for project ${sa.project_id}` : `validate_only send → HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
    } catch (e) {
      report("FCM_SERVICE_ACCOUNT", false, (e as Error).message);
    }
  }

  // --- MapTiler ---
  if (!env.MAPTILER_KEY) {
    report("MAPTILER_KEY", false, "not set");
  } else {
    try {
      const url = `https://api.maptiler.com/maps/streets-v2/static/123.8996,10.3322,15/100x100.webp?key=${encodeURIComponent(env.MAPTILER_KEY)}`;
      const res = await fetchImpl(url, { headers: { "User-Agent": MAPS_UA } });
      const type = res.headers.get("content-type") ?? "";
      report("MAPTILER_KEY", res.ok && type.startsWith("image/"), res.ok ? `static image fetched (${type}) with UA "${MAPS_UA.split(" ")[0]}"` : `HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
    } catch (e) {
      report("MAPTILER_KEY", false, (e as Error).message);
    }
  }

  // --- google-services.json ---
  if (!env.GOOGLE_SERVICES_JSON) {
    report("GOOGLE_SERVICES_JSON", false, "not set");
  } else {
    const r = checkGoogleServices(env.GOOGLE_SERVICES_JSON, sa?.project_id ?? "(unknown — FCM check failed)", "ph.pawer.app");
    report("GOOGLE_SERVICES_JSON", r.ok, r.ok ? "project and Android package match" : r.problems.join("; "));
  }

  return allOk;
}
