import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Simple env loader
try {
  const envPath = path.resolve(".env");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*"(.*)"\s*$/) || line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
      if (match) {
        process.env[match[1]] = match[2].trim();
      }
    }
  }
} catch (e) {
  console.warn("Could not load .env:", e.message);
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const BUCKETS = [
  { id: "book-exports", name: "book-exports", public: false },
  { id: "photos", name: "photos", public: true },
  { id: "blog-images", name: "blog-images", public: true },
  { id: "media", name: "media", public: true },
  { id: "documents", name: "documents", public: false },
  { id: "covers", name: "covers", public: true },
  { id: "manuscripts", name: "manuscripts", public: false },
  { id: "exports", name: "exports", public: false },
  { id: "avatars", name: "avatars", public: true },
  { id: "support-attachments", name: "support-attachments", public: false },
];

async function run() {
  console.log("Applying storage buckets to Supabase Cloud:", supabaseUrl);
  for (const b of BUCKETS) {
    try {
      const { data: getB } = await supabase.storage.getBucket(b.id);
      if (getB) {
        console.log(`✓ Bucket '${b.id}' already exists.`);
      } else {
        const { error: createErr } = await supabase.storage.createBucket(b.id, {
          public: b.public,
        });
        if (createErr) {
          console.error(`✗ Error creating '${b.id}':`, createErr.message);
        } else {
          console.log(`✓ Bucket '${b.id}' created successfully!`);
        }
      }
    } catch (e) {
      console.error(`✗ Failed checking '${b.id}':`, e.message);
    }
  }
  console.log("All storage buckets synchronized!");
}

run();
