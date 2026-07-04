/**
 * Uploads every media file from public/ to Supabase Storage (site-assets/ prefix).
 * Run: node scripts/sync-public-to-supabase.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative, extname } from "path";

// Parse .env without dotenv dependency
try {
  const env = readFileSync(".env", "utf-8");
  for (const line of env.split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*"?([^"#\r\n]*)"?/);
    if (m) process.env[m[1]] ??= m[2].trim();
  }
} catch (_) {}

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const BUCKET = "product-images";
const PREFIX = "site-assets";
const PUBLIC_DIR = "./public";
const SKIP_DIRS = new Set(["uploads"]);
const MEDIA_EXTS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".mp4", ".mov", ".svg"]);

function mime(ext) {
  return { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
           ".gif": "image/gif", ".webp": "image/webp", ".mp4": "video/mp4",
           ".mov": "video/quicktime", ".svg": "image/svg+xml" }[ext.toLowerCase()]
    ?? "application/octet-stream";
}

function walkDir(dir, base = dir) {
  const out = [];
  for (const entry of readdirSync(dir).sort()) {
    if (entry.startsWith(".")) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (!SKIP_DIRS.has(entry)) out.push(...walkDir(full, base));
    } else if (MEDIA_EXTS.has(extname(entry).toLowerCase())) {
      out.push({ localPath: full, relPath: relative(base, full) });
    }
  }
  return out;
}

const files = walkDir(PUBLIC_DIR);
console.log(`\nFound ${files.length} media files in public/\n`);

const results = {};
for (const { localPath, relPath } of files) {
  const storagePath = `${PREFIX}/${relPath.replace(/\\/g, "/")}`;
  const buffer = readFileSync(localPath);
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: mime(extname(localPath)), upsert: true });
  if (error) {
    console.error(`  FAIL  ${storagePath}: ${error.message}`);
  } else {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    results[relPath] = data.publicUrl;
    console.log(`  OK    ${storagePath}`);
  }
}

console.log(`\n=== Done: ${Object.keys(results).length}/${files.length} uploaded ===\n`);
for (const [rel, url] of Object.entries(results)) {
  console.log(`  ${rel}  →  ${url}`);
}
