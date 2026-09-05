// api/verify-otp.js — Vercel Serverless Function

const otpStore = globalThis.__otpStore ?? (globalThis.__otpStore = {});

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ valid: false, reason: "method_not_allowed" });

  const { email, otp } = req.body ?? {};
  const record = otpStore[email];

  if (!record)                         return res.json({ valid: false, reason: "not_found" });
  if (Date.now() > record.expires) { delete otpStore[email]; return res.json({ valid: false, reason: "expired" }); }
  if (record.attempts >= 5)            return res.json({ valid: false, reason: "too_many" });

  if (record.otp !== otp) {
    record.attempts++;
    return res.json({ valid: false, reason: "wrong", attemptsLeft: 5 - record.attempts });
  }

  delete otpStore[email];
  return res.json({ valid: true });
}
