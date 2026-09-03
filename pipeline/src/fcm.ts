/**
 * Firebase Cloud Messaging HTTP v1 without the Admin SDK: a service-account JWT signed with
 * node:crypto, exchanged for an access token, then one POST per topic. Data-only messages at
 * high priority so the device de-duplicates and posts a single notification (ARCH §7.3).
 */
import { createSign } from "node:crypto";

export interface ServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
  token_uri: string;
}

const SCOPE = "https://www.googleapis.com/auth/firebase.messaging";

const b64url = (input: string | Buffer) =>
  Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export function buildJwt(sa: ServiceAccount, nowSec: number): string {
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(JSON.stringify({ iss: sa.client_email, scope: SCOPE, aud: sa.token_uri, iat: nowSec, exp: nowSec + 3600 }));
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  return `${header}.${claims}.${b64url(signer.sign(sa.private_key))}`;
}

export async function getAccessToken(sa: ServiceAccount, fetchImpl: typeof fetch = fetch, nowSec = Math.floor(Date.now() / 1000)): Promise<string> {
  const body = new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: buildJwt(sa, nowSec) }).toString();
  const res = await fetchImpl(sa.token_uri, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
  if (!res.ok) throw new Error(`FCM token request failed: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

export interface TopicMessage {
  message: {
    topic: string;
    data: { type: "new_advisory"; outage_ids: string; schema_version: "1" };
    android: { priority: "high"; ttl: "86400s" };
  };
}

export function buildTopicMessage(topic: string, outageIds: readonly string[]): TopicMessage {
  return {
    message: {
      topic,
      data: { type: "new_advisory", outage_ids: outageIds.join(","), schema_version: "1" },
      android: { priority: "high", ttl: "86400s" },
    },
  };
}

export interface SendResult {
  sent: number;
  failed: Array<{ topic: string; status: number; body: string }>;
}

export async function sendTopicMessages(projectId: string, accessToken: string, messages: readonly TopicMessage[], fetchImpl: typeof fetch = fetch): Promise<SendResult> {
  const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
  const result: SendResult = { sent: 0, failed: [] };
  for (const m of messages) {
    const res = await fetchImpl(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(m),
    });
    if (res.ok) result.sent++;
    else result.failed.push({ topic: m.message.topic, status: res.status, body: await res.text() });
  }
  return result;
}
