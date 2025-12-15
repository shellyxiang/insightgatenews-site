import { Resend } from "resend";

export default async function handler(req, res) {
  console.log("send-welcome-email start", { method: req.method });

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("env check", {
      hasKey: !!process.env.RESEND_API_KEY,
    });

    const resend = new Resend(process.env.RESEND_API_KEY);

    const { to, name } = req.body || {};
    console.log("payload", { to, name });

    if (!to) return res.status(400).json({ error: "to is required" });

    const from = "Insight Gate <support@insightgatenews.com>";
    console.log("from =", from);

    const subject = "Welcome to Insight Gate";
    const html = `<div>Welcome${name ? `, ${name}` : ""} 👋</div>`;

    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    console.log("resend result", { data, error });

    if (error) {
      return res.status(500).json({ error: "Failed to send email", detail: error });
    }

    return res.status(200).json({ status: "ok", data });
  } catch (e) {
    console.error("send-welcome-email crash", e);
    return res.status(500).json({ error: "Server error", detail: String(e) });
  }
}
