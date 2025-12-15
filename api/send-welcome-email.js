import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { to, name } = req.body || {};
    if (!to) return res.status(400).json({ error: "to is required" });

    // ⚠️ from 必须是你在 Resend 里“已验证域名”的邮箱
    // 如果你还没验证域名，先用 Resend 提供的测试 from（你 Resend 后台会提示）
    const from = "Insight Gate <support@insightgatenews.com>";

    const subject = "Welcome to Insight Gate";
    const html = `
      <div style="font-family:Inter,Arial,sans-serif; line-height:1.6;">
        <h2 style="margin:0 0 12px;">Welcome${name ? `, ${name}` : ""} 👋</h2>
        <p style="margin:0 0 12px;">
          Thanks for signing up for <b>Insight Gate</b>.
        </p>
        <p style="margin:0 0 12px;">
          You can now explore the site and access free resources.
        </p>
        <p style="margin:18px 0 0; color:#666; font-size:12px;">
          If you didn’t sign up, you can ignore this email.
        </p>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    if (error) {
      return res.status(500).json({ error: "Failed to send email", detail: error });
    }

    return res.status(200).json({ status: "ok", data });
  } catch (e) {
    return res.status(500).json({ error: "Server error", detail: String(e) });
  }
}
