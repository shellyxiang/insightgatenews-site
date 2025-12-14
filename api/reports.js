import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { data, error } = await supabaseAdmin
      .from("reports")
      .select("id, title, report_date, category, size_bytes, file_key, created_at, is_active")
      .eq("is_active", true)
      .order("report_date", { ascending: false });

    if (error) return res.status(500).json({ error: "Failed to fetch reports", detail: error.message });
    return res.status(200).json(data ?? []);
  } catch (e) {
    return res.status(500).json({ error: "Server error", detail: String(e) });
  }
}
