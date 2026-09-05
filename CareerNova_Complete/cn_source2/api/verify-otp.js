// api/verify-otp.js — Vercel Serverless Function
// Stateless: validates the signed token returned by send-otp.
// No shared memory or database needed.

import { createHmac } from "crypto";

const SECRET = process.env.OTP_SECRET || "careernova-otp-secret-key-2026";

function verifyToken(token) {
  try {
    const [payload, sig] = (token || "").split(".");
    if (!payload || !sig) return { ok: false, reason: "invalid" };
    const expected = createHmac("sha256", SECRET).update(payload).digest("base64url");
    if (sig !== expected) return { ok: false, reason: "tampered" };
    const { email, otp, exp } = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (Date.now() > exp) return { ok: false, reason: "expired" };
    return { ok: true, email, otp };
  } catch {
    return { ok: false, reason: "invalid" };
  }
}

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ valid: false, reason: "method_not_allowed" });

  const { token, otp } = req.body ?? {};

  if (!token) return res.json({ valid: false, reason: "not_found" });

  const result = verifyToken(token);
  if (!result.ok) return res.json({ valid: false, reason: result.reason });

  // Check the OTP the user typed matches the one in the token
  if (result.otp !== otp) {
    return res.json({ valid: false, reason: "wrong" });
  }

  return res.json({ valid: true });
}
