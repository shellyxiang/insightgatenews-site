import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PUBLIC_DOWNLOAD_ENABLED = String(process.env.PUBLIC_DOWNLOAD).toLowerCase() === "true";

async function verifyUser(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization || "";
  if (!authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error) return null;

  return data?.user ?? null;
}

async function requireMember(userId) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("membership, role")
    .eq("id", userId)
    .single();

  if (error || !data) return { ok: false, reason: "无法读取会员信息" };

  const ok = data.membership === "member" || data.role === "admin";
  return { ok, profile: data, reason: ok ? "" : "需要会员权限" };
}

export default async function handler(req, res) {
  // CORS（可选：如果你本地 127.0.0.1 调试会更顺）
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const bucket = process.env.SUPABASE_REPORTS_BUCKET;
    const { filename } = req.body || {};

    if (!bucket) return res.status(500).json({ error: "Bucket not configured" });
    if (!filename) return res.status(400).json({ error: "filename is required" });

    // ✅ 开关：PUBLIC_DOWNLOAD=true 时跳过登录/会员校验
    if (!PUBLIC_DOWNLOAD_ENABLED) {
      const user = await verifyUser(req);
      if (!user) return res.status(401).json({ error: "未登录（缺少或无效 token）" });

      const check = await requireMember(user.id);
      if (!check.ok) return res.status(403).json({ error: check.reason });
    }

    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(filename, 60 * 5);

    if (error || !data?.signedUrl) {
      return res.status(500).json({ error: "Failed to create signed URL", detail: String(error?.message || error) });
    }

    return res.status(200).json({ url: data.signedUrl });
  } catch (e) {
    return res.status(500).json({ error: "Server error", detail: String(e) });
  }
}
