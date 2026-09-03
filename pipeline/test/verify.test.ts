import { describe, expect, test } from "vitest";
import { checkGoogleServices, validateOnlyMessage } from "../src/verify";

describe("checkGoogleServices — the app config must match the service account's project and the app's package", () => {
  const good = { project_info: { project_id: "pawer-f69cb" }, client: [{ client_info: { android_client_info: { package_name: "ph.pawer.app" } } }] };
  test("passes when project and package match", () => {
    expect(checkGoogleServices(JSON.stringify(good), "pawer-f69cb", "ph.pawer.app")).toEqual({ ok: true, problems: [] });
  });
  test("reports a project mismatch", () => {
    const r = checkGoogleServices(JSON.stringify({ ...good, project_info: { project_id: "other" } }), "pawer-f69cb", "ph.pawer.app");
    expect(r.ok).toBe(false);
    expect(r.problems[0]).toMatch(/project_id "other".*"pawer-f69cb"/);
  });
  test("reports a missing android client for the package", () => {
    const r = checkGoogleServices(JSON.stringify({ ...good, client: [] }), "pawer-f69cb", "ph.pawer.app");
    expect(r.problems[0]).toMatch(/ph\.pawer\.app/);
  });
  test("reports unparseable input instead of throwing", () => {
    expect(checkGoogleServices("not json", "p", "a").ok).toBe(false);
  });
});

describe("validateOnlyMessage — a real FCM send that delivers nothing", () => {
  test("wraps a topic message with validate_only", () => {
    const m = validateOnlyMessage("veco.v1.cebu-city.lahug");
    expect(m.validate_only).toBe(true);
    expect(m.message.topic).toBe("veco.v1.cebu-city.lahug");
    expect(m.message.data.type).toBe("verify");
  });
});
