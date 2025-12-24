import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // 1) 只允许 Supabase 调用：用一个你自己设的 secret
  const secret = req.headers["x-hook-secret"];
  if (!secret || secret !== process.env.SUPABASE_HOOK_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const body = req.body || {};

  // 2) 取 email（兼容不同 payload）
  const email = body?.user?.email || body?.record?.email || body?.email;
  if (!email) return res.status(400).json({ error: "No email in payload" });

  // 3) 取 name（可选）
  const name =
    body?.user?.user_metadata?.name ||
    body?.user?.user_metadata?.full_name ||
    body?.record?.raw_user_meta_data?.name ||
    "";

  try {
    const from = "Insight Gate <support@insightgatenews.com>";
    const subject = "Welcome to Insight Gate";

    const html = `
      <div style="font-family:Inter,Arial,sans-serif; line-height:1.6;">
        <h2 style="margin:0 0 12px;">Welcome${name ? `, ${name}` : ""} 👋</h2>
        <p style="margin:0 0 12px;">Thanks for signing up for <b>Insight Gate</b>.</p>
        <p style="margin:0 0 12px;">You can now explore the site and access free resources.</p>
        <p style="margin:18px 0 0; color:#666; font-size:12px;">If you didn’t sign up, you can ignore this email.</p>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from,
      to: email,
      subject,
      html,
    });

    if (error) return res.status(500).json({ error: "Failed to send email", detail: error });

    return res.status(200).json({ status: "ok", data });
  } catch (e) {
    return res.status(500).json({ error: "Server error", detail: String(e?.message || e) });
  }
}
