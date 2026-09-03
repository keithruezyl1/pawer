import { describe, expect, test } from "vitest";
import { createVerify, generateKeyPairSync } from "node:crypto";
import { buildJwt, buildTopicMessage, getAccessToken, sendTopicMessages, type ServiceAccount } from "../src/fcm";

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const sa: ServiceAccount = {
  project_id: "pawer-test",
  client_email: "ingest@pawer-test.iam.gserviceaccount.com",
  private_key: privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
  token_uri: "https://oauth2.googleapis.com/token",
};

const b64 = (s: string) => JSON.parse(Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));

describe("buildJwt — RS256 service-account assertion, no SDK", () => {
  const jwt = buildJwt(sa, 1_760_000_000);
  const [h, p, sig] = jwt.split(".");

  test("header is RS256 JWT", () => {
    expect(b64(h!)).toEqual({ alg: "RS256", typ: "JWT" });
  });

  test("claims target the FCM scope and expire in one hour", () => {
    expect(b64(p!)).toEqual({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: sa.token_uri,
      iat: 1_760_000_000,
      exp: 1_760_003_600,
    });
  });

  test("signature verifies against the service account's public key", () => {
    const v = createVerify("RSA-SHA256");
    v.update(`${h}.${p}`);
    expect(v.verify(publicKey, Buffer.from(sig!.replace(/-/g, "+").replace(/_/g, "/"), "base64"))).toBe(true);
  });
});

describe("getAccessToken — exchanges the assertion at token_uri", () => {
  test("posts the JWT and returns the access token", async () => {
    const calls: Array<{ url: string; body: string }> = [];
    const fetchImpl = async (url: string, init: { body: string }) => {
      calls.push({ url, body: init.body });
      return new Response(JSON.stringify({ access_token: "ya29.test", expires_in: 3599 }), { status: 200 });
    };
    const tok = await getAccessToken(sa, fetchImpl as unknown as typeof fetch, 1_760_000_000);
    expect(tok).toBe("ya29.test");
    expect(calls[0]!.url).toBe(sa.token_uri);
    expect(calls[0]!.body).toContain("grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer");
    expect(calls[0]!.body).toContain("assertion=");
  });

  test("throws with the response body on non-200", async () => {
    const fetchImpl = async () => new Response("invalid_grant", { status: 400 });
    await expect(getAccessToken(sa, fetchImpl as unknown as typeof fetch, 0)).rejects.toThrow(/400.*invalid_grant/);
  });
});

describe("buildTopicMessage — data-only, high priority, one-day TTL (ARCH §7.3)", () => {
  test("shape", () => {
    expect(buildTopicMessage("veco.v1.cebu-city.lahug", ["a3f1", "b7d2"])).toEqual({
      message: {
        topic: "veco.v1.cebu-city.lahug",
        data: { type: "new_advisory", outage_ids: "a3f1,b7d2", schema_version: "1" },
        android: { priority: "high", ttl: "86400s" },
      },
    });
  });

  test("never carries a notification payload — the device de-duplicates and posts one itself", () => {
    expect(buildTopicMessage("t", ["x"]).message).not.toHaveProperty("notification");
  });
});

describe("sendTopicMessages — one POST per topic to the v1 endpoint", () => {
  test("posts each message with the bearer token; reports successes and failures", async () => {
    const calls: Array<{ url: string; auth: string | null; body: unknown }> = [];
    const fetchImpl = async (url: string, init: { headers: Record<string, string>; body: string }) => {
      calls.push({ url, auth: init.headers.Authorization ?? null, body: JSON.parse(init.body) });
      return new Response(url.includes("fail") ? "boom" : "{}", { status: url.includes("fail") ? 500 : 200 });
    };
    const msgs = [buildTopicMessage("veco.v1.cebu-city.lahug", ["a"]), buildTopicMessage("veco.v1.liloan.tabla", ["a"])];
    const r = await sendTopicMessages("pawer-test", "ya29.test", msgs, fetchImpl as unknown as typeof fetch);
    expect(calls).toHaveLength(2);
    expect(calls[0]!.url).toBe("https://fcm.googleapis.com/v1/projects/pawer-test/messages:send");
    expect(calls[0]!.auth).toBe("Bearer ya29.test");
    expect(r.sent).toBe(2);
    expect(r.failed).toEqual([]);
  });

  test("a failed topic does not abort the rest", async () => {
    let n = 0;
    const fetchImpl = async () => new Response(n++ === 0 ? "boom" : "{}", { status: n === 1 ? 500 : 200 });
    const msgs = [buildTopicMessage("t1", ["a"]), buildTopicMessage("t2", ["a"])];
    const r = await sendTopicMessages("p", "tok", msgs, fetchImpl as unknown as typeof fetch);
    expect(r.sent).toBe(1);
    expect(r.failed).toEqual([{ topic: "t1", status: 500, body: "boom" }]);
  });
});
