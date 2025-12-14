import { createClient } from "@supabase/supabase-js";
import path from "path";

export const config = {
  api: { bodyParser: false }, // 关键：我们自己解析 multipart
};

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

async function requireAdmin(userId) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  if (error || !data) return { ok: false, reason: "无法读取角色" };
  return { ok: data.role === "admin", reason: data.role === "admin" ? "" : "需要管理员权限" };
}

// 极简 multipart 解析（只支持单文件 field=file）
async function readMultipartFile(req) {
  const contentType = req.headers["content-type"] || "";
  const match = contentType.match(/boundary=(.+)$/);
  if (!match) throw new Error("Missing multipart boundary");
  const boundary = match[1];

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const buffer = Buffer.concat(chunks);

  const boundaryBuf = Buffer.from(`--${boundary}`);
  const parts = buffer.toString("binary").split(boundaryBuf.toString("binary"));

  for (const p of parts) {
    if (!p.includes('name="file"')) continue;
    const idx = p.indexOf("\r\n\r\n");
    if (idx < 0) continue;

    const head = p.slice(0, idx);
    const bodyBinary = p.slice(idx + 4);

    const filenameMatch = head.match(/filename="([^"]+)"/);
    const filename = filenameMatch?.[1] || `upload_${Date.now()}.pdf`;

    // 去掉尾部 \r\n--
    const cleaned = bodyBinary.replace(/\r\n--$/, "").replace(/\r\n$/, "");
    const fileBuffer = Buffer.from(cleaned, "binary");

    return { filename, buffer: fileBuffer, mimetype: "application/pdf", size: fileBuffer.length };
  }

  throw new Error("No file field found");
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const user = await verifyUser(req);
    if (!user) return res.status(401).json({ error: "未登录（缺少或无效 token）" });

    const admin = await requireAdmin(user.id);
    if (!admin.ok) return res.status(403).json({ error: admin.reason });

    const bucket = process.env.SUPABASE_REPORTS_BUCKET;
    if (!bucket) return res.status(500).json({ error: "Bucket not configured" });

    const file = await readMultipartFile(req);

    const originalName = file.filename;
    const today = new Date().toISOString().slice(0, 10);
    const safeName = originalName.replace(/\s+/g, "_");
    const fileKey = `reports/${today}_${Date.now()}_${safeName}`;

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(fileKey, file.buffer, { contentType: file.mimetype, upsert: false });

    if (uploadError) return res.status(500).json({ error: "Failed to upload file to storage" });

    const title = path.basename(originalName, path.extname(originalName));
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("reports")
      .insert({
        title,
        report_date: today,
        category: "default",
        size_bytes: file.size,
        file_key: fileKey,
        is_active: true,
      })
      .select()
      .single();

    if (insertError) return res.status(500).json({ error: "Failed to insert report record" });

    return res.status(200).json({ status: "ok", report: inserted, storagePath: uploadData?.path || fileKey });
  } catch (e) {
    return res.status(500).json({ error: "Server error", detail: String(e) });
  }
}
