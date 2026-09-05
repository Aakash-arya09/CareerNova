// ─── CareerNova OTP Server ────────────────────────────────────────────────────
// Node.js + Express + Nodemailer
// Run: node src/server.js   (in a SEPARATE terminal while npm run dev runs in another)

import express from "express";
import nodemailer from "nodemailer";
import cors from "cors";

const app = express();
app.use(cors({ origin: /^http:\/\/localhost:\d+$/ })); // Allow any localhost port
app.use(express.json());

// ─── Configure your Gmail ─────────────────────────────────────────────────────
// STEP: Go to myaccount.google.com → Security → App Passwords → generate one
// Paste it below (NOT your normal Gmail password)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "aakashkumararya0@gmail.com", // ← replace with your Gmail
    pass: "birj ywfs njwg iovl", // ← replace with Gmail App Password (16 chars)
  },
});

// ─── In-memory OTP store ──────────────────────────────────────────────────────
// { "user@email.com": { otp: "123456", expires: 1234567890, attempts: 0 } }
const otpStore = {};

// ─── Helper: beautiful HTML email ─────────────────────────────────────────────
const otpEmailHtml = (name, otp, purpose) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:Inter,Arial,sans-serif">
  <div style="max-width:480px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
    <div style="background:linear-gradient(135deg,#151B3D,#7C3AED);padding:32px;text-align:center">
      <h1 style="color:white;margin:0;font-size:24px;font-weight:800">CareerNova</h1>
      <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px">Find Work That Moves Your Career Forward</p>
    </div>
    <div style="padding:36px">
      <h2 style="color:#1F2937;font-size:20px;margin:0 0 8px">Hi ${name || "there"} 👋</h2>
      <p style="color:#6B7280;font-size:15px;line-height:1.6;margin:0 0 28px">
        ${
          purpose === "signup"
            ? "Thanks for signing up! Use the OTP below to verify your email address."
            : purpose === "verify"
            ? "We received a request to verify your email address. Use the OTP below to confirm it."
            : "We received a request to reset your password. Use the OTP below."
        }
      </p>
      <div style="background:#F5F3FF;border:2px dashed #7C3AED;border-radius:12px;padding:28px;text-align:center;margin-bottom:28px">
        <p style="color:#6B7280;font-size:13px;margin:0 0 8px;font-weight:600;letter-spacing:1px">YOUR ONE-TIME PASSWORD</p>
        <div style="font-size:42px;font-weight:800;letter-spacing:12px;color:#151B3D">${otp}</div>
        <p style="color:#9CA3AF;font-size:12px;margin:10px 0 0">Valid for <b>10 minutes</b> · Do not share this with anyone</p>
      </div>
      <p style="color:#9CA3AF;font-size:13px;line-height:1.6;margin:0">
        If you didn't request this, you can safely ignore this email.<br/>
        Your account remains secure.
      </p>
    </div>
    <div style="background:#F8FAFC;padding:20px;text-align:center;border-top:1px solid #E5E7EB">
      <p style="color:#9CA3AF;font-size:12px;margin:0">© 2026 CareerNova · All rights reserved</p>
    </div>
  </div>
</body>
</html>`;

// ─── POST /send-otp ───────────────────────────────────────────────────────────
// Body: { email, name, purpose }   purpose = "signup" | "reset"
app.post("/send-otp", async (req, res) => {
  const { email, name, purpose = "signup" } = req.body;
  if (!email || !email.includes("@")) {
    return res.status(400).json({ success: false, error: "Invalid email" });
  }

  // Rate limit: max 3 sends per email per 10 minutes
  const existing = otpStore[email];
  if (existing && Date.now() < existing.expires && existing.sendCount >= 3) {
    return res.status(429).json({
      success: false,
      error: "Too many OTP requests. Wait 10 minutes.",
    });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[email] = {
    otp,
    expires: Date.now() + 10 * 60 * 1000, // 10 minutes
    attempts: 0,
    sendCount: existing ? existing.sendCount + 1 : 1,
    name,
    purpose,
  };

  try {
    await transporter.sendMail({
      from: `"CareerNova" <${process.env.GMAIL_USER || "YOUR_GMAIL@gmail.com"}>`,
      to: email,
      subject:
        purpose === "signup"
          ? "Verify your CareerNova account"
          : purpose === "verify"
          ? "Verify your CareerNova email address"
          : "Reset your CareerNova password",
      html: otpEmailHtml(name, otp, purpose),
    });
    console.log(`[OTP] Sent to ${email} (${purpose})`);
    res.json({ success: true });
  } catch (err) {
    console.error("[OTP] Email send failed:", err.message);
    res.status(500).json({
      success: false,
      error: "Failed to send email. Check server config.",
    });
  }
});

// ─── POST /verify-otp ─────────────────────────────────────────────────────────
// Body: { email, otp }
app.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  const record = otpStore[email];

  if (!record) return res.json({ valid: false, reason: "not_found" });
  if (Date.now() > record.expires) {
    delete otpStore[email];
    return res.json({ valid: false, reason: "expired" });
  }
  if (record.attempts >= 5)
    return res.json({ valid: false, reason: "too_many" });

  if (record.otp !== otp) {
    record.attempts++;
    return res.json({
      valid: false,
      reason: "wrong",
      attemptsLeft: 5 - record.attempts,
    });
  }

  delete otpStore[email]; // OTP used — delete it
  console.log(`[OTP] Verified for ${email}`);
  res.json({ valid: true });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(
    `\n✅ CareerNova OTP server running on http://localhost:${PORT}\n`,
  ),
);
