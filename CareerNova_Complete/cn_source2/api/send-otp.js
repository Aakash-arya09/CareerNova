// api/send-otp.js — Vercel Serverless Function
// Runs in the cloud — replaces the local node src/server.js

import nodemailer from "nodemailer";

// Shared in-memory OTP store (persists across warm lambda instances)
const otpStore = globalThis.__otpStore ?? (globalThis.__otpStore = {});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER, // set in Vercel Dashboard → Environment Variables
    pass: process.env.GMAIL_PASS, // Gmail App Password (16 chars)
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
    <h2 style="color:#1F2937;font-size:20px;margin:0 0 8px">Hi ${name || "there"} ${String.fromCodePoint(0x1F44B)}</h2>
    <p style="color:#6B7280;font-size:15px;line-height:1.6;margin:0 0 28px">
      ${purpose === "signup"
        ? "Thanks for signing up! Use the OTP below to verify your email."
        : purpose === "verify"
        ? "Use the OTP below to verify your email address change."
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
    <p style="color:#9CA3AF;font-size:12px;margin:0">&copy; 2026 CareerNova</p>
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

  const existing = otpStore[email];
  if (existing && Date.now() < existing.expires && existing.sendCount >= 3) {
    return res.status(429).json({ success: false, error: "Too many OTP requests. Wait 10 minutes." });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[email] = {
    otp,
    expires: Date.now() + 10 * 60 * 1000,
    attempts: 0,
    sendCount: existing ? existing.sendCount + 1 : 1,
  };

  try {
    await transporter.sendMail({
      from: `"CareerNova" <${process.env.GMAIL_USER}>`,
      to: email,
      subject:
        purpose === "signup" ? "Verify your CareerNova account" :
        purpose === "verify" ? "Confirm your new email — CareerNova" :
        "Reset your CareerNova password",
      html: emailHtml(name, otp, purpose),
    });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("[OTP] Send failed:", err.message);
    return res.status(500).json({ success: false, error: "Failed to send email. Check GMAIL_USER and GMAIL_PASS in Vercel environment variables." });
  }
}
