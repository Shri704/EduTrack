import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import logger from "./logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..", "..");
const repoRoot = path.resolve(backendRoot, "..");
const BREVO_SMTP_URL = "https://api.brevo.com/v3/smtp/email";

function loadEmailEnvFromDisk() {
  dotenv.config({ path: path.join(backendRoot, ".env"), override: true });
  dotenv.config({ path: path.join(repoRoot, ".env"), override: false });
}

/** Supports `you@domain.com` or `Display Name <you@domain.com>` (verified sender). */
function parseVerifiedFrom(raw) {
  const s = String(raw || "").trim();
  if (!s) return { email: "", name: "" };
  const m = s.match(/^(.+?)\s*<([^>]+)>$/);
  if (m) {
    const name = m[1].replace(/^["']|["']$/g, "").trim();
    return { email: m[2].trim(), name };
  }
  return { email: s, name: "" };
}

function getBrevoCredentials() {
  loadEmailEnvFromDisk();
  const apiKey = String(process.env.BREVO_API_KEY || "").trim();
  const rawFrom = String(
    process.env.BREVO_FROM_EMAIL || process.env.EMAIL_FROM || ""
  ).trim();
  const nameFromEnv = String(process.env.BREVO_FROM_NAME || "").trim();
  const parsed = parseVerifiedFrom(rawFrom);
  const email = parsed.email;
  const name = nameFromEnv || parsed.name || "EduTrack";
  const from = email ? { email, name } : null;
  return { apiKey, from };
}

function normalizeToRecipients(addresses) {
  const list = Array.isArray(addresses) ? addresses : [addresses];
  return list.map((addr) => {
    const raw =
      typeof addr === "string"
        ? addr
        : addr && typeof addr === "object"
          ? addr.email
          : "";
    const email = String(raw || "").trim();
    if (!email) {
      throw new Error("Invalid email recipient: empty address");
    }
    return { email };
  });
}

function brevoErrorMessage(status, data) {
  const m = data?.message;
  if (Array.isArray(m)) return m.map((x) => String(x)).join("; ");
  if (m != null && typeof m === "object") {
    try {
      return JSON.stringify(m);
    } catch {
      return String(m);
    }
  }
  if (typeof m === "string" && m.trim()) return m;
  if (data?.error != null) return String(data.error);
  return `Brevo request failed (HTTP ${status})`;
}

export const sendEmail = async ({
  to,
  subject,
  html,
  text,
  transactional = false
}) => {
  const { apiKey, from } = getBrevoCredentials();

  if (!apiKey) {
    const err = new Error(
      "Email is not configured: set BREVO_API_KEY in backend/.env (Brevo → SMTP & API → API keys)."
    );
    logger.error(err.message);
    throw err;
  }

  if (!from?.email) {
    const err = new Error(
      "Email is not configured: set BREVO_FROM_EMAIL (or EMAIL_FROM) to a verified Brevo sender."
    );
    logger.error(err.message);
    throw err;
  }

  const toRecipients = normalizeToRecipients(to);
  const toLog = toRecipients.map((r) => r.email).join(", ");
  const bodyText =
    text != null && String(text).trim() !== ""
      ? text
      : String(html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  const payload = {
    sender: { name: from.name, email: from.email },
    to: toRecipients,
    replyTo: { email: from.email, name: from.name },
    subject,
    htmlContent: html,
    textContent: bodyText || undefined
  };
  if (transactional) {
    payload.tags = ["transactional", "auth-otp"];
  }

  try {
    const res = await fetch(BREVO_SMTP_URL, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": apiKey
      },
      body: JSON.stringify(payload)
    });

    const rawText = await res.text();
    let data = {};
    if (rawText) {
      try {
        data = JSON.parse(rawText);
      } catch {
        data = { raw: rawText };
      }
    }

    if (!res.ok) {
      const rawMsg = brevoErrorMessage(res.status, data);
      logger.error(`Brevo error (${res.status}): ${rawMsg}`);
      let msg = rawMsg;
      if (res.status === 401) {
        msg = `${rawMsg} — Check BREVO_API_KEY in backend/.env.`;
      } else if (res.status === 400) {
        msg = `${rawMsg} — Ensure BREVO_FROM_EMAIL is validated under Brevo → Senders & IP.`;
      }
      const err = new Error(msg);
      err.statusCode = res.status >= 400 && res.status < 600 ? res.status : 502;
      throw err;
    }

    const messageId = data?.messageId != null ? String(data.messageId) : "";
    logger.info(
      `Brevo email accepted (${res.status}) from=${from.email} to=${toLog}` +
        (messageId ? ` [message-id: ${messageId}]` : "") +
        " — confirm delivery in Brevo → Statistics → Email if needed."
    );
    return { statusCode: res.status, body: data };
  } catch (error) {
    if (error.statusCode) throw error;
    logger.error(`Brevo send failed: ${error.message}`);
    const wrapped = new Error(
      error.message || "Could not reach Brevo API. Check network and BREVO_API_KEY."
    );
    wrapped.statusCode = 502;
    throw wrapped;
  }
};

export const sendLowAttendanceAlert = async (
  student,
  attendancePercent
) => {
  const subject = "⚠️ Low Attendance Alert – EduTrack";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">EduTrack</h1>
        <p style="color: rgba(255,255,255,0.8);">Student Performance Platform</p>
      </div>
      <div style="padding: 30px; background: #f9f9f9;">
        <h2 style="color: #e53e3e;">⚠️ Low Attendance Alert</h2>
        <p>Dear <strong>${student.firstName} ${student.lastName}</strong>,</p>
        <p>Your current attendance is <strong style="color: #e53e3e;">${attendancePercent.toFixed(1)}%</strong>, which is below the minimum required <strong>75%</strong>.</p>
        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
          <strong>Action Required:</strong> Please attend classes regularly to avoid academic penalties.
        </div>
        <p>If you have any concerns, please contact your teacher or administration.</p>
      </div>
      <div style="background: #667eea; padding: 15px; text-align: center;">
        <p style="color: white; margin: 0;">© 2024 EduTrack · Student Performance Platform</p>
      </div>
    </div>
  `;
  return sendEmail({ to: student.email, subject, html });
};

export const sendLowMarksAlert = async (
  student,
  subjectName,
  marks,
  totalMarks
) => {
  const emailSubject = "⚠️ Low Performance Alert – EduTrack";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">EduTrack</h1>
        <p style="color: rgba(255,255,255,0.8);">Student Performance Platform</p>
      </div>
      <div style="padding: 30px; background: #f9f9f9;">
        <h2 style="color: #e53e3e;">⚠️ Low Performance Alert</h2>
        <p>Dear <strong>${student.firstName} ${student.lastName}</strong>,</p>
        <p>You scored <strong style="color: #e53e3e;">${marks}/${totalMarks}</strong> in <strong>${subjectName}</strong>, which is below the passing threshold.</p>
        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
          <strong>Action Required:</strong> Please review the subject material and seek additional help if needed.
        </div>
      </div>
      <div style="background: #667eea; padding: 15px; text-align: center;">
        <p style="color: white; margin: 0;">© 2024 EduTrack · Student Performance Platform</p>
      </div>
    </div>
  `;
  return sendEmail({ to: student.email, subject: emailSubject, html });
};
