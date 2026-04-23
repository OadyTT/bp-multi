// api/notify.js  —  แจ้ง Admin เมื่อลูกค้าโอนเงิน
// Vercel ENV optional:
//   LINE_CHANNEL_TOKEN  = LINE Messaging API token (ถ้าต้องการแจ้ง LINE)
//   ADMIN_LINE_USER_ID  = LINE User ID ของ admin
//   (ถ้าไม่มี ENV จะ log เฉยๆ ไม่ error)

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }

  const { phone, lineId, adminLine, timestamp } = body || {};

  const msg = `💰 BP-Multi แจ้งชำระเงิน\n📞 ${phone || "-"}\nLINE: ${lineId || "-"}\n🕐 ${timestamp || new Date().toLocaleString("th-TH")}`;
  console.log("[notify]", msg);

  // ── ส่ง LINE Message (ถ้ามี ENV) ─────────────
  const lineToken  = process.env.LINE_CHANNEL_TOKEN;
  const lineUserId = process.env.ADMIN_LINE_USER_ID;

  if (lineToken && lineUserId) {
    try {
      await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${lineToken}` },
        body: JSON.stringify({ to: lineUserId, messages: [{ type: "text", text: msg }] }),
      });
    } catch (e) {
      console.error("[notify] LINE error:", e.message);
    }
  }

  return res.json({ ok: true });
};
