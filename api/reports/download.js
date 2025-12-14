import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyUser(req) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length).trim();
  const { data } = await supabaseAdmin.auth.getUser(token);
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

function normalizeFilename(filename, bucket) {
  let key = String(filename || "").trim();
  if (!key) return "";

  // 去掉开头的 /
  key = key.replace(/^\/+/, "");

  // 兼容你现在表里 file_key 可能是 "reports/xxx.pdf"
  // 如果 bucket 也是 "reports"，那真实 object key 应该是 "xxx.pdf"
  if (bucket && key.startsWith(bucket + "/")) {
    key = key.slice(bucket.length + 1);
  }
  return key;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const bucket = process.env.SUPABASE_REPORTS_BUCKET;
    const publicDownload = String(process.env.PUBLIC_DOWNLOAD || "").toLowerCase() === "true";

    if (!bucket) return res.status(500).json({ error: "SUPABASE_REPORTS_BUCKET not configured" });

    // ✅ 临时开放：PUBLIC_DOWNLOAD=true 时不校验登录/会员
    if (!publicDownload) {
      const user = await verifyUser(req);
      if (!user) return res.status(401).json({ error: "未登录（缺少或无效 token）" });

      const check = await requireMember(user.id);
      if (!check.ok) return res.status(403).json({ error: check.reason });
    }

    const { filename } = req.body || {};
    const key = normalizeFilename(filename, bucket);
    if (!key) return res.status(400).json({ error: "filename is required" });

    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(key, 60 * 5);

    if (error) {
      return res.status(500).json({
        error: "Failed to create signed URL",
        detail: error.message || String(error),
        bucket,
        key,
      });
    }

    return res.status(200).json({ url: data.signedUrl });
  } catch (e) {
    return res.status(500).json({ error: "Server error", detail: String(e) });
  }
}
