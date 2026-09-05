// api/send-otp.js — Vercel Serverless Function
// Stateless: OTP is stored in a signed token returned to the client.
// No shared memory or database needed between lambda instances.

import nodemailer from "nodemailer";
import { createHmac, randomBytes } from "crypto";

const SECRET = process.env.OTP_SECRET || "careernova-otp-secret-key-2026";

// ── Sign a token: base64( JSON({email,otp,exp}) ) + "." + HMAC ───────────────
function signToken(email, otp) {
  const exp = Date.now() + 10 * 60 * 1000; // 10 minutes
  const payload = Buffer.from(JSON.stringify({ email, otp, exp })).toString("base64url");
  const sig = createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

// ── Verify token: returns { ok, email, otp, reason } ─────────────────────────
export function verifyToken(token) {
  try {
    const [payload, sig] = token.split(".");
    const expected = createHmac("sha256", SECRET).update(payload).digest("base64url");
    if (sig !== expected) return { ok: false, reason: "tampered" };
    const { email, otp, exp } = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (Date.now() > exp) return { ok: false, reason: "expired" };
    return { ok: true, email, otp };
  } catch {
    return { ok: false, reason: "invalid" };
  }
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

const emailHtml = (name, otp, purpose) => `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F8FAFC;font-family:Inter,Arial,sans-serif">
<div style="max-width:480px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
  <div style="background:linear-gradient(135deg,#151B3D,#7C3AED);padding:32px;text-align:center">
    <h1 style="color:white;margin:0;font-size:24px;font-weight:800">CareerNova</h1>
    <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px">Find Work That Moves Your Career Forward</p>
  </div>
  <div style="padding:36px">
    <h2 style="color:#1F2937;font-size:20px;margin:0 0 8px">Hi ${name || "there"} 👋</h2>
    <p style="color:#6B7280;font-size:15px;line-height:1.6;margin:0 0 28px">
      ${purpose === "signup"
        ? "Thanks for signing up! Use the OTP below to verify your email address."
        : purpose === "verify"
        ? "Use the OTP below to confirm your email address change."
        : "We received a request to reset your password. Use the OTP below."}
    </p>
    <div style="background:#F5F3FF;border:2px dashed #7C3AED;border-radius:12px;padding:28px;text-align:center;margin-bottom:28px">
      <p style="color:#6B7280;font-size:13px;margin:0 0 8px;font-weight:600;letter-spacing:1px">YOUR ONE-TIME PASSWORD</p>
      <div style="font-size:42px;font-weight:800;letter-spacing:12px;color:#151B3D">${otp}</div>
      <p style="color:#9CA3AF;font-size:12px;margin:10px 0 0">Valid for <b>10 minutes</b> &middot; Do not share this</p>
    </div>
    <p style="color:#9CA3AF;font-size:13px;line-height:1.6;margin:0">If you did not request this, ignore this email.</p>
  </div>
  <div style="background:#F8FAFC;padding:20px;text-align:center;border-top:1px solid #E5E7EB">
    <p style="color:#9CA3AF;font-size:12px;margin:0">&copy; 2026 CareerNova &middot; All rights reserved</p>
  </div>
</div></body></html>`;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ success: false, error: "Method not allowed" });

  const { email, name, purpose = "signup" } = req.body ?? {};
  if (!email || !email.includes("@")) {
    return res.status(400).json({ success: false, error: "Invalid email address." });
  }

  // Generate OTP + signed token
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const token = signToken(email, otp);

  try {
    await transporter.sendMail({
      from: `"CareerNova" <${process.env.GMAIL_USER}>`,
      to: email,
      subject:
        purpose === "signup"  ? "Verify your CareerNova account" :
        purpose === "verify"  ? "Confirm your new email — CareerNova" :
                                "Reset your CareerNova password",
      html: emailHtml(name, otp, purpose),
    });

    // Return the signed token to the client — it holds the OTP securely
    return res.status(200).json({ success: true, token });
  } catch (err) {
    console.error("[OTP] Send failed:", err.message);
    return res.status(500).json({
      success: false,
      error: "Failed to send email. Check GMAIL_USER and GMAIL_PASS in Vercel environment variables.",
    });
  }
}
