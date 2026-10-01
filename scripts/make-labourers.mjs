// Script to generate data/labourers.generated.js with 300 realistic Delhi-NCR labourers
import fs from "fs";
import path from "path";

const FIRST_NAMES = [
  "Ramesh", "Suresh", "Mukesh", "Rajesh", "Dharmendra", "Santosh", "Manoj", "Pramod",
  "Vinod", "Ashok", "Dinesh", "Sanjay", "Mahesh", "Sunil", "Anil", "Kamlesh", "Jitendra",
  "Surendra", "Harish", "Gopal", "Mohan", "Radhey", "Shyam", "Kishore", "Deepak",
  "Pappu", "Bablu", "Raju", "Vikram", "Shivaji", "Brijesh", "Akhilesh", "Rakesh"
];

const LAST_NAMES = [
  "Yadav", "Kumar", "Sharma", "Verma", "Mistri", "Singh", "Paswan", "Chaudhary",
  "Prasad", "Gupta", "Mandal", "Pandey", "Rawat", "Kushwaha", "Nishad", "Sahani"
];

const TRADES_INFO = [
  { id: "mason", label: "Raj Mistri", baseRate: 850, skills: ["Brickwork", "Plastering", "Foundation", "Lintel Casting", "Waterproofing"] },
  { id: "painter", label: "Wall Painter", baseRate: 750, skills: ["Interior Painting", "Exterior Emulsion", "Putty Finish", "Texture Finish", "Waterproofing"] },
  { id: "electrician", label: "Electrician", baseRate: 900, skills: ["Concealed Wiring", "DB Board Setup", "Inverter Wiring", "Earthing", "Lighting"] },
  { id: "plumber", label: "Plumber", baseRate: 850, skills: ["CPVC Piping", "Sanitary Fitting", "Water Tank Installation", "Pump Repair", "Leakage Fixing"] },
  { id: "carpenter", label: "Carpenter", baseRate: 950, skills: ["Door Frames", "Modular Kitchen", "Shuttering Work", "Wardrobe", "Wood Polish"] },
  { id: "welder", label: "Welder / Fabrication", baseRate: 800, skills: ["Gate Fabrication", "Grill Welding", "Shed Roofing", "Iron Stairs", "ARC Welding"] },
  { id: "tile", label: "Tile Mistri", baseRate: 900, skills: ["Floor Tiles", "Bathroom Tiles", "Granite Kitchen Counter", "Marble Polish", "Grouting"] },
  { id: "labour", label: "Beldar / Helper", baseRate: 500, skills: ["Material Shifting", "Mortar Mixing", "Curing", "Debris Clearance", "Earth Excavation"] }
];

const LOCALITIES = [
  { city: "Noida", sector: "Sector 62", lat: 28.6280, lng: 77.3649 },
  { city: "Noida", sector: "Sector 18", lat: 28.5708, lng: 77.3260 },
  { city: "Noida", sector: "Sector 76", lat: 28.5740, lng: 77.3820 },
  { city: "Noida", sector: "Sector 137", lat: 28.5080, lng: 77.4080 },
  { city: "Noida", sector: "Sector 50", lat: 28.5830, lng: 77.3620 },
  { city: "Noida", sector: "Sector 150", lat: 28.4350, lng: 77.4980 },
  { city: "Greater Noida", sector: "Pari Chowk", lat: 28.4680, lng: 77.5110 },
  { city: "Greater Noida", sector: "Knowledge Park III", lat: 28.4720, lng: 77.4890 },
  { city: "Greater Noida", sector: "Gaur City", lat: 28.6090, lng: 77.4280 },
  { city: "Ghaziabad", sector: "Indirapuram", lat: 28.6430, lng: 77.3710 },
  { city: "Ghaziabad", sector: "Vaishali", lat: 28.6480, lng: 77.3390 },
  { city: "Ghaziabad", sector: "Raj Nagar Extension", lat: 28.7050, lng: 77.4320 },
  { city: "Delhi", sector: "Mayur Vihar Phase 1", lat: 28.6070, lng: 77.2960 },
  { city: "Delhi", sector: "Lajpat Nagar", lat: 28.5700, lng: 77.2400 },
  { city: "Delhi", sector: "Rohini Sector 11", lat: 28.7210, lng: 77.1180 },
  { city: "Gurugram", sector: "Sector 29", lat: 28.4680, lng: 77.0620 },
  { city: "Gurugram", sector: "Sector 56", lat: 28.4280, lng: 77.1020 },
  { city: "Gurugram", sector: "Sohna Road", lat: 28.4120, lng: 77.0410 }
];

const labourers = [];

for (let i = 1; i <= 300; i++) {
  const fName = FIRST_NAMES[(i * 7) % FIRST_NAMES.length];
  const lName = LAST_NAMES[(i * 11) % LAST_NAMES.length];
  const name = `${fName} ${lName}`;
  const tradeInfo = TRADES_INFO[i % TRADES_INFO.length];
  const loc = LOCALITIES[(i * 13) % LOCALITIES.length];

  // Slight jitter for coordinates
  const latOffset = ((i % 17) - 8) * 0.003;
  const lngOffset = ((i % 19) - 9) * 0.003;
  const lat = Math.round((loc.lat + latOffset) * 10000) / 10000;
  const lng = Math.round((loc.lng + lngOffset) * 10000) / 10000;

  const exp = 2 + (i % 22);
  const rate = tradeInfo.baseRate + ((i % 5) - 2) * 50;
  const rating = Math.round((4.3 + ((i % 7) * 0.1)) * 10) / 10;
  const ratingCount = 8 + ((i * 13) % 180);
  const jobsCompleted = Math.round(ratingCount * (1.2 + (i % 3) * 0.2));
  const id = `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`;
  const maskedPhone = `+91 98•••• ••${String(10 + (i % 90)).padStart(2, "0")}`;

  labourers.push({
    id,
    name,
    phone: maskedPhone,
    trade: tradeInfo.id,
    trade_label: tradeInfo.label,
    headline: `${exp} yrs exp · ${tradeInfo.label}`,
    experience_years: exp,
    rate,
    rate_type: "day",
    skills: tradeInfo.skills.slice(0, 3 + (i % 3)),
    languages: (i % 3 === 0) ? ["Hindi", "Bhojpuri"] : (i % 4 === 0) ? ["Hindi", "English"] : ["Hindi"],
    bio: `${exp} years of dedicated experience in residential and commercial building construction across NCR. Reliable workmanship and verified skill.`,
    radius_km: 10 + (i % 3) * 5,
    rating_avg: Math.min(5.0, rating),
    rating_count: ratingCount,
    jobs_completed: jobsCompleted,
    verified: i % 3 !== 0,
    aadhaar_verified: i % 4 !== 0,
    availability: i % 7 === 0 ? "Busy" : "Available",
    lat,
    lng,
    locality: `${loc.city} ${loc.sector}`,
    is_seed: true
  });
}

const outContent = `/* NIRMAAN Seed Data: 300 Verified Delhi-NCR Labourers */
export const SEED_LABOURERS = ${JSON.stringify(labourers, null, 2)};
`;

fs.writeFileSync(path.resolve("data/labourers.generated.js"), outContent);
console.log(`Generated data/labourers.generated.js with ${labourers.length} records.`);
