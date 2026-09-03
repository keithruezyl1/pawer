/**
 * Real adapters for runIngest, plus `publish` (build dist/) and `release-manifest`.
 *
 *   npm run ingest            poll → parse → write data/ → push → issues → heartbeat
 *   tsx src/cli.ts publish    data/ + registry + release/version.json + assets/maps → dist/
 *   tsx src/cli.ts release-manifest <version> <versionCode> <tag>   writes release/version.json
 *
 * Secrets arrive by name from the workflow environment and are never written anywhere:
 *   FCM_SERVICE_ACCOUNT   service-account JSON (string)      → push
 *   GITHUB_TOKEN / GITHUB_REPOSITORY                          → issues
 */
import { appendFileSync, copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { barangays, lgus } from "@pawer/registry";
import { runIngest, type IngestDeps } from "./run";
import { buildTopicMessage, getAccessToken, sendTopicMessages, type ServiceAccount } from "./fcm";
import { runVerify } from "./verify";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const UA = "PAWER-ingest/0.1 (+https://github.com/keithruezyl1/pawer; polls one public RSS feed every 30 minutes)";

const abs = (p: string) => resolve(ROOT, p);
const readJson = <T>(p: string): T | null => (existsSync(abs(p)) ? (JSON.parse(readFileSync(abs(p), "utf8")) as T) : null);
const writeJson = (p: string, v: unknown) => { mkdirSync(dirname(abs(p)), { recursive: true }); writeFileSync(abs(p), JSON.stringify(v, null, 2) + "\n"); };
const log = (m: string) => console.log(`[pawer] ${m}`);

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html,application/xml,text/xml;q=0.9,*/*;q=0.8" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

function fcmPusher(): IngestDeps["push"] {
  const raw = process.env.FCM_SERVICE_ACCOUNT;
  if (!raw) {
    log("FCM_SERVICE_ACCOUNT not set — pushes skipped; outages stay un-notified until it is");
    return async () => false;
  }
  const sa = JSON.parse(raw) as ServiceAccount;
  let token: Promise<string> | null = null;
  return async (topic, ids) => {
    token ??= getAccessToken(sa);
    const r = await sendTopicMessages(sa.project_id, await token, [buildTopicMessage(topic, ids)]);
    if (r.failed.length) log(`FCM ${topic}: ${r.failed[0]!.status} ${r.failed[0]!.body.slice(0, 200)}`);
    return r.sent === 1;
  };
}

function github(): Pick<IngestDeps, "openIssue" | "listOpenIssueTitles"> {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;
  if (!token || !repo) {
    log("GITHUB_TOKEN/GITHUB_REPOSITORY not set — issue filing skipped");
    return { openIssue: async (i) => log(`would open issue: ${i.title}`), listOpenIssueTitles: async () => [] };
  }
  const headers = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "User-Agent": UA, "Content-Type": "application/json" };
  return {
    listOpenIssueTitles: async () => {
      const res = await fetch(`https://api.github.com/repos/${repo}/issues?state=open&labels=unknown-area&per_page=100`, { headers });
      if (!res.ok) { log(`issue list failed: ${res.status}`); return []; }
      return ((await res.json()) as Array<{ title: string }>).map((i) => i.title);
    },
    openIssue: async (issue) => {
      const res = await fetch(`https://api.github.com/repos/${repo}/issues`, { method: "POST", headers, body: JSON.stringify(issue) });
      if (!res.ok) log(`issue create failed: ${res.status} ${await res.text()}`);
    },
  };
}

function setOutput(name: string, value: string) {
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
}

async function ingest() {
  const result = await runIngest({ now: () => Date.now(), fetchText, readJson, writeJson, push: fcmPusher(), ...github(), log });
  log(JSON.stringify(result));
  setOutput("changed", String(result.changed));
  if (result.failedFetches.length === 0) return;
  // Fetch failures are not fatal (they retry next run) but must be visible in the run summary.
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Fetch failures\n${result.failedFetches.map((u) => `- ${u}`).join("\n")}\n`);
}

function publish() {
  const dist = abs("dist/v1");
  mkdirSync(dist, { recursive: true });
  writeFileSync(abs("dist/.nojekyll"), "");

  const adv = readJson("data/advisories.json") ?? { schema_version: 1, generated_at: new Date().toISOString(), source_attribution: "Visayan Electric Company", outages: [] };
  writeFileSync(resolve(dist, "advisories.json"), JSON.stringify(adv) + "\n");
  writeFileSync(resolve(dist, "registry.json"), JSON.stringify({ schema_version: 1, lgus, barangays }) + "\n");
  const version = readJson("release/version.json") ?? { latest_version: "0.0.0", latest_version_code: 0, min_schema_version: 1, download_url: "", sha256: {}, release_notes_url: "" };
  writeFileSync(resolve(dist, "version.json"), JSON.stringify(version) + "\n");

  const mapsSrc = abs("assets/maps");
  if (existsSync(mapsSrc)) {
    mkdirSync(resolve(dist, "maps"), { recursive: true });
    for (const f of readdirSync(mapsSrc).filter((f) => f.endsWith(".webp"))) copyFileSync(resolve(mapsSrc, f), resolve(dist, "maps", f));
  }

  writeFileSync(abs("dist/index.html"), landingHtml());
  log(`published dist/ (${(adv as { outages: unknown[] }).outages.length} outages)`);
}

function landingHtml(): string {
  return `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PAWER</title>
<style>body{font:16px/1.5 system-ui,Roboto,sans-serif;background:#F5F5F5;color:#212431;max-width:640px;margin:40px auto;padding:0 20px}h1{font-size:40px;font-weight:800;margin:0 0 8px}a.btn{display:inline-block;border:2px solid #212431;box-shadow:4px 4px 0 #212431;background:#EA5C1F;color:#212431;padding:12px 24px;font-weight:700;text-decoration:none;margin:16px 0}code{background:#D6D7D7;padding:2px 6px}small{color:#4F5D75}</style>
<h1>PAWER</h1><p>Scheduled power-interruption alerts for Visayan Electric's Metro Cebu franchise. Android APK, no accounts, no ads.</p>
<p id="dl"><a class="btn" href="#" data-dl>Download APK</a></p>
<p><small>Installing an APK requires allowing installation from unknown sources once. Verify the file against the SHA-256 shown on the release page.</small></p>
<p><small>PAWER reads Visayan Electric's public advisories and is not affiliated with Visayan Electric. It covers <em>scheduled</em> outages only and shows the published schedule, not the state of the grid.</small></p>
<script>fetch('v1/version.json').then(r=>r.json()).then(v=>{const a=document.querySelector('[data-dl]');if(v.download_url){a.href=v.download_url;a.textContent='Download APK v'+v.latest_version}else{a.textContent='No release yet';a.removeAttribute('href')}});</script>`;
}

function releaseManifest(version: string, code: string, tag: string) {
  const repo = process.env.GITHUB_REPOSITORY ?? "keithruezyl1/pawer";
  const base = `https://github.com/${repo}/releases/download/${tag}`;
  const sums = readJson<Record<string, string>>("release/sha256.json") ?? {};
  writeJson("release/version.json", {
    latest_version: version,
    latest_version_code: Number(code),
    min_schema_version: 1,
    download_url: `${base}/pawer-${version}-universal.apk`,
    download_urls: {
      "arm64-v8a": `${base}/pawer-${version}-arm64-v8a.apk`,
      "armeabi-v7a": `${base}/pawer-${version}-armeabi-v7a.apk`,
      universal: `${base}/pawer-${version}-universal.apk`,
    },
    sha256: sums,
    release_notes_url: `https://github.com/${repo}/releases/tag/${tag}`,
  });
  log(`release/version.json → ${version} (${code})`);
}

const [cmd, ...args] = process.argv.slice(2);
switch (cmd) {
  case "ingest": ingest().catch((e) => { console.error(e); process.exit(1); }); break;
  case "publish": publish(); break;
  case "release-manifest": releaseManifest(args[0]!, args[1]!, args[2]!); break;
  case "verify": runVerify(process.env).then((ok) => process.exit(ok ? 0 : 1)).catch((e) => { console.error(e); process.exit(1); }); break;
  default: console.error("usage: cli.ts <ingest|publish|release-manifest|verify>"); process.exit(2);
}
