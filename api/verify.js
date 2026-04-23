// api/verify.js  —  BP-Multi trial + unlock (no Google Sheets)
// Vercel ENV required:
//   UNLOCK_CODE   = รหัสปลดล็อคสำหรับลูกค้า (เปลี่ยนได้)
//   ADMIN_PASS    = รหัสผ่าน Admin Panel
//   TRIAL_SECRET  = สตริงลับสำหรับ HMAC (สุ่มได้เอง เช่น bp-multi-secret-2025)

const crypto = require("crypto");

const TRIAL_DAYS   = 60;
const UNLOCK_CODE  = process.env.UNLOCK_CODE  || "bpmulti2025";
const ADMIN_PASS   = process.env.ADMIN_PASS   || "admin1234";
const TRIAL_SECRET = process.env.TRIAL_SECRET || "bp-multi-secret-2025";

// สร้าง HMAC token สำหรับ trial
function makeToken(deviceId, startDate) {
  const payload = `${deviceId}:${startDate}`;
  const sig = crypto.createHmac("sha256", TRIAL_SECRET).update(payload).digest("hex");
  const data = Buffer.from(JSON.stringify({ deviceId, startDate })).toString("base64url");
  return `${data}.${sig}`;
}

// ตรวจสอบ token
function verifyToken(token) {
  try {
    const [dataPart, sig] = token.split(".");
    if (!dataPart || !sig) return { ok: false, tampered: true };
    const { deviceId, startDate } = JSON.parse(Buffer.from(dataPart, "base64url").toString());
    const expectedSig = crypto.createHmac("sha256", TRIAL_SECRET).update(`${deviceId}:${startDate}`).digest("hex");
    if (sig !== expectedSig) return { ok: false, tampered: true };
    const daysUsed = Math.floor((Date.now() - new Date(startDate)) / 86400000);
    const daysLeft = Math.max(0, TRIAL_DAYS - daysUsed);
    return { ok: true, deviceId, startDate, daysUsed, daysLeft, expired: daysLeft === 0 };
  } catch {
    return { ok: false, tampered: true };
  }
}

module.exports = async (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }

  const { type, code, deviceId, token } = body || {};

  // ── ลงทะเบียน trial ──────────────────────────
  if (type === "trial_register") {
    if (!deviceId) return res.json({ ok: false, error: "Missing deviceId" });
    const startDate = new Date().toISOString();
    const tok = makeToken(deviceId, startDate);
    return res.json({ ok: true, token: tok, daysLeft: TRIAL_DAYS, daysUsed: 0, expired: false });
  }

  // ── ตรวจสอบ trial token ───────────────────────
  if (type === "trial_check") {
    if (!deviceId || !token) return res.json({ ok: false, error: "Missing params" });
    const result = verifyToken(token);
    if (!result.ok) return res.json({ ok: false, tampered: result.tampered, expired: true, daysLeft: 0 });
    if (result.deviceId !== deviceId) return res.json({ ok: false, tampered: true, expired: true, daysLeft: 0 });
    return res.json({ ok: true, daysLeft: result.daysLeft, daysUsed: result.daysUsed, expired: result.expired });
  }

  // ── ปลดล็อค Full Version ──────────────────────
  if (type === "unlock") {
    // Support comma-separated list of codes
    const validCodes = UNLOCK_CODE.split(",").map(c => c.trim().toLowerCase());
    const ok = validCodes.includes((code || "").trim().toLowerCase());
    return res.json({ ok });
  }

  // ── Admin login ───────────────────────────────
  if (type === "admin") {
    return res.json({ ok: (code || "").trim() === ADMIN_PASS });
  }

  return res.status(400).json({ ok: false, error: "Unknown type" });
};
