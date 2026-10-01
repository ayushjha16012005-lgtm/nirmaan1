// Script to generate supabase/migrations/005_seed.sql from data/labourers.generated.js
import fs from "fs";
import path from "path";
import { SEED_LABOURERS } from "../data/labourers.generated.js";
import { MOCK_GOVT_SCHEMES, MOCK_SAMACHAR } from "../data/mock.js";

function sqlEscape(str) {
  if (str === null || str === undefined) return "null";
  return "'" + String(str).replace(/'/g, "''") + "'";
}

function arrayToSql(arr) {
  if (!arr || !arr.length) return "'{}'";
  const escaped = arr.map(item => `"${String(item).replace(/"/g, '\\"')}"`).join(",");
  return `'{${escaped}}'`;
}

let sql = `-- ============================================================================
-- NIRMAAN MIGRATION 005: SEED DATA (300 LABOURERS & WELFARE CONTENT)
-- ============================================================================
-- Note on Seed Authentication:
-- Seed workers have is_seed = true and use deterministic UUIDs in profiles and
-- worker_profiles so they do not require fake entries in auth.users.
-- Real workers who register via SMS OTP will have their authentic auth.uid()
-- inserted alongside them seamlessly.
-- ============================================================================

`;

// 1. Insert seed profiles in batches
sql += `-- 1. Seed Profiles (300 Labourers)\n`;
sql += `insert into public.profiles (id, full_name, phone, active_role, city, sector, lat, lng, is_seed, is_admin)\nvalues\n`;

const profileValues = SEED_LABOURERS.map(l => {
  const parts = l.locality.split(" ");
  const city = parts[0] || "Noida";
  const sector = parts.slice(1).join(" ") || "Sector 62";
  return `  (${sqlEscape(l.id)}, ${sqlEscape(l.name)}, ${sqlEscape(l.phone)}, 'kaarigar', ${sqlEscape(city)}, ${sqlEscape(sector)}, ${l.lat}, ${l.lng}, true, false)`;
});

sql += profileValues.join(",\n") + `\non conflict (id) do nothing;\n\n`;

// 2. Insert seed worker_profiles in batches
sql += `-- 2. Seed Worker Profiles (Trades, rates, skills, ratings)\n`;
sql += `insert into public.worker_profiles (\n  id, trade, trade_label, headline, experience_years, rate, rate_type, skills, languages, bio, radius_km, rating_avg, rating_count, jobs_completed, verified, aadhaar_verified, availability, lat, lng, locality, is_seed\n)\nvalues\n`;

const workerValues = SEED_LABOURERS.map(l => {
  return `  (${sqlEscape(l.id)}, ${sqlEscape(l.trade)}, ${sqlEscape(l.trade_label)}, ${sqlEscape(l.headline)}, ${l.experience_years}, ${l.rate}, ${sqlEscape(l.rate_type)}, ${arrayToSql(l.skills)}, ${arrayToSql(l.languages)}, ${sqlEscape(l.bio)}, ${l.radius_km}, ${l.rating_avg}, ${l.rating_count}, ${l.jobs_completed}, ${l.verified}, ${l.aadhaar_verified}, ${sqlEscape(l.availability)}, ${l.lat}, ${l.lng}, ${sqlEscape(l.locality)}, true)`;
});

sql += workerValues.join(",\n") + `\non conflict (id) do nothing;\n\n`;

// 3. Genuine Welfare Schemes & News Content
sql += `-- 3. Genuine Welfare Schemes & Samachar Content\n`;
sql += `insert into public.content (id, type, title_en, title_hi, desc_en, desc_hi, badge, link, tag, published_at)\nvalues\n`;

const contentItems = [
  ...MOCK_GOVT_SCHEMES.map(s => ({
    id: s.id,
    type: "scheme",
    title_en: s.title_en,
    title_hi: s.title_hi,
    desc_en: s.desc_en,
    desc_hi: s.desc_hi,
    badge: s.badge,
    link: s.link,
    tag: "Welfare",
    published_at: "2026-09-01"
  })),
  ...MOCK_SAMACHAR.map(n => ({
    id: n.id,
    type: "news",
    title_en: n.title_en,
    title_hi: n.title_hi,
    desc_en: n.title_en,
    desc_hi: n.title_hi,
    badge: n.tag,
    link: "#",
    tag: n.tag,
    published_at: n.date || "2026-09-30"
  }))
];

const contentValues = contentItems.map(c => {
  return `  (${sqlEscape(c.id)}, ${sqlEscape(c.type)}, ${sqlEscape(c.title_en)}, ${sqlEscape(c.title_hi)}, ${sqlEscape(c.desc_en)}, ${sqlEscape(c.desc_hi)}, ${sqlEscape(c.badge)}, ${sqlEscape(c.link)}, ${sqlEscape(c.tag)}, ${sqlEscape(c.published_at)})`;
});

sql += contentValues.join(",\n") + `\non conflict (id) do update set\n  title_en = excluded.title_en,\n  title_hi = excluded.title_hi,\n  desc_en = excluded.desc_en,\n  desc_hi = excluded.desc_hi,\n  badge = excluded.badge,\n  link = excluded.link;\n`;

fs.writeFileSync(path.resolve("supabase/migrations/005_seed.sql"), sql);
console.log("Generated supabase/migrations/005_seed.sql successfully.");
