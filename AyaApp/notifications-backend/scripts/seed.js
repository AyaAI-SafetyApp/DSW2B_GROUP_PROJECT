// scripts/seed.js
import { supabase } from "../lib/supabase.js";

const ROWS = [
  {
    time_range: "00:00–06:00",
    hour_start: 0,
    hour_end: 6,
    awareness: "Break-ins, night theft",
    tip: "Lock everything and avoid late-night movement.",
    icon: "moon",
  },
  {
    time_range: "06:00–12:00",
    hour_start: 6,
    hour_end: 12,
    awareness: "Phone snatching, muggings",
    tip: "Stay alert on commute; keep valuables hidden.",
    icon: "sunny-outline",
  },
  {
    time_range: "12:00–18:00",
    hour_start: 12,
    hour_end: 18,
    awareness: "Burglaries, car theft",
    tip: "Lock your home and car; don't leave items visible.",
    icon: "partly-sunny",
  },
  {
    time_range: "18:00–24:00",
    hour_start: 18,
    hour_end: 24,
    awareness: "Hijackings, robberies",
    tip: "Stay alert when driving; avoid dark, quiet areas.",
    icon: "moon-outline",
  },
];

async function seed() {
  try {
    for (const row of ROWS) {
      const { data, error } = await supabase
        .from("time_based_safety_tips")
        .upsert(row, { onConflict: "time_range" })
        .select();

      if (error) {
        console.error("Upsert error for", row.time_range, error);
      } else {
        console.log("Upserted:", row.time_range);
      }
    }
    console.log("Seeding complete.");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

seed();