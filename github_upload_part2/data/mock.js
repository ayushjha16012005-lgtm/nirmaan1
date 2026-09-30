/* NIRMAAN Mock Database for Demo Mode */

export const MOCK_KAARIGARS = [
  {
    id: "k-ramesh",
    name: "Ramesh Yadav",
    name_hi: "रमेश यादव",
    trade: "mason",
    role: "Senior Raj Mistri",
    role_hi: "सीनियर राज मिस्त्री",
    experience: 12,
    location: "Noida Sector 62",
    lat: 28.6280,
    lng: 77.3649,
    distance_km: 2.1,
    rate: 850,
    rateType: "day",
    oldRate: 1100,
    rating: 4.9,
    reviewsCount: 143,
    avatar: "👨‍🔧",
    photoUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&auto=format&fit=crop&q=80",
    verified: true,
    aadhaarVerified: true,
    skills: ["Brickwork", "Plastering", "Tiling", "Waterproofing", "Beam Casting"],
    bio: "12 years experience in residential building construction in NCR. Timely work, zero middleman.",
    gallery: [
      "https://images.unsplash.com/photo-1541888946425-d0fbb180f5f6?w=400&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&auto=format&fit=crop&q=80"
    ],
    availability: "Available"
  },
  {
    id: "k-sita",
    name: "Sita Sharma",
    name_hi: "सीता शर्मा",
    trade: "painter",
    role: "Professional Painter",
    role_hi: "प्रोफेशनल पेंटर",
    experience: 8,
    location: "Noida Sector 18",
    lat: 28.5708,
    lng: 77.3260,
    distance_km: 3.4,
    rate: 700,
    rateType: "day",
    oldRate: 950,
    rating: 4.8,
    reviewsCount: 92,
    avatar: "👩‍🎨",
    photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
    verified: true,
    aadhaarVerified: true,
    skills: ["Wall Painting", "Texture Finish", "Wall Putty", "Wood Polish"],
    bio: "Specialist in interior texture painting and dampness-resistant putty work.",
    gallery: [
      "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&auto=format&fit=crop&q=80"
    ],
    availability: "Available"
  },
  {
    id: "k-vikram",
    name: "Vikram Singh",
    name_hi: "विक्रम सिंह",
    trade: "electrician",
    role: "Licensed Electrician",
    role_hi: "लाइसेंस्ड इलेक्ट्रीशियन",
    experience: 10,
    location: "Greater Noida West",
    lat: 28.5950,
    lng: 77.4350,
    distance_km: 4.8,
    rate: 120,
    rateType: "hour",
    oldRate: 180,
    rating: 4.7,
    reviewsCount: 115,
    avatar: "⚡",
    photoUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&auto=format&fit=crop&q=80",
    verified: true,
    aadhaarVerified: true,
    skills: ["Concealed Wiring", "DB Board Setup", "Inverter Fitting", "Short Circuit Repair"],
    bio: "Industrial and home electrical wiring expert with safety certification.",
    gallery: [],
    availability: "Available"
  },
  {
    id: "k-sunil",
    name: "Sunil Verma",
    name_hi: "सुनील वर्मा",
    trade: "plumber",
    role: "Senior Plumber",
    role_hi: "सीनियर प्लंबर",
    experience: 15,
    location: "Noida Sector 63",
    lat: 28.6250,
    lng: 77.3800,
    distance_km: 1.8,
    rate: 100,
    rateType: "hour",
    oldRate: 150,
    rating: 4.9,
    reviewsCount: 210,
    avatar: "🔧",
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    verified: true,
    aadhaarVerified: true,
    skills: ["CPVC Pipe Fitting", "Sanitary Install", "Leakage Detection", "Motor Installation"],
    bio: "Expert plumbing for multi-story residential and commercial spaces.",
    gallery: [],
    availability: "Available"
  },
  {
    id: "k-rahul",
    name: "Rahul Mistri",
    name_hi: "राहुल मिस्त्री",
    trade: "carpenter",
    role: "Modern Carpenter",
    role_hi: "मॉडर्न बढ़ई",
    experience: 6,
    location: "Noida Sector 76",
    lat: 28.5720,
    lng: 77.3850,
    distance_km: 3.9,
    rate: 800,
    rateType: "day",
    oldRate: 1050,
    rating: 4.6,
    reviewsCount: 48,
    avatar: "🪚",
    photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
    verified: false,
    aadhaarVerified: false,
    skills: ["Modular Kitchen", "Wardrobes", "Door Fitting", "Sunmica Pasting"],
    bio: "Modern woodwork and furniture fabrication.",
    gallery: [],
    availability: "Available"
  }
];

export const MOCK_GOVT_SCHEMES = [
  {
    id: "s-eshram",
    title_en: "e-Shram Accident Insurance (₹2 Lakh)",
    title_hi: "ई-श्रम दुर्घटना बीमा (₹2 लाख सुरक्षा)",
    desc_en: "Free accidental death and permanent disability coverage of ₹2,00,000 for registered construction workers.",
    desc_hi: "पंजीकृत निर्माण श्रमिकों के लिए ₹2,00,000 का निःशुल्क दुर्घटना बीमा एवं पेंशन सहायता।",
    badge: "Government of India",
    link: "https://eshram.gov.in"
  },
  {
    id: "s-bocw",
    title_en: "BOCW Tool-kit Grant (₹15,000)",
    title_hi: "BOCW टूल-किट अनुदान (₹15,000 सहायता)",
    desc_en: "Financial assistance to purchase modern tools for Masons, Electricians, Plumbers, and Carpenters.",
    desc_hi: "मिस्त्री, इलेक्ट्रीशियन, प्लंबर व बढ़ई को आधुनिक औजार खरीदने के लिए ₹15,000 की प्रत्यक्ष सहायता।",
    badge: "State Welfare Board",
    link: "https://bocw.gov.in"
  },
  {
    id: "s-pmawas",
    title_en: "PM Awas Yojana Subsidy",
    title_hi: "प्रधानमंत्री आवास योजना (₹1.20 लाख सहायता)",
    desc_en: "Direct financial grant for rural and semi-urban workers to construct pucca houses.",
    desc_hi: "पक्का मकान बनाने के लिए सरकार द्वारा ₹1,20,000 से ₹2,50,000 तक का प्रत्यक्ष अनुदान।",
    badge: "MoHUA",
    link: "https://pmaymis.gov.in"
  },
  {
    id: "s-ayushman",
    title_en: "Ayushman Bharat PM-JAY (₹5 Lakh Free Treatment)",
    title_hi: "आयुष्मान भारत योजना (₹5 लाख तक मुफ़्त इलाज)",
    desc_en: "Cashless health coverage up to ₹5 Lakh per year for the entire worker family at empanelled hospitals.",
    desc_hi: "पूरे परिवार के लिए देश के किसी भी अस्पताल में ₹5 लाख तक का कैशलेस मुफ़्त इलाज।",
    badge: "NHA Health",
    link: "https://pmjay.gov.in"
  }
];

export const MOCK_SAMACHAR = [
  {
    id: "n-1",
    title_en: "UP Government hikes minimum daily wage for Raj Mistri to ₹850",
    title_hi: "उत्तर प्रदेश सरकार ने कुशल मिस्त्री की न्यूनतम दैनिक मजदूरी बढ़ाई",
    date: "Today, 10:30 AM",
    tag: "Wages"
  },
  {
    id: "n-2",
    title_en: "Nirmaan Escrow Vault crosses ₹5 Crore in direct instant worker payouts",
    title_hi: "निर्माण एस्क्रो वॉल्ट ने ₹5 करोड़ का सीधा मज़दूर भुगतान पूरा किया",
    date: "Yesterday",
    tag: "Milestone"
  },
  {
    id: "n-3",
    title_en: "Free health checkup camp for Karigars in Noida Sector 62 this Sunday",
    title_hi: "इस रविवार नोएडा सेक्टर 62 में निर्माण कारीगरों के लिए मुफ़्त स्वास्थ्य शिविर",
    date: "28 Sep",
    tag: "Welfare"
  }
];

export const MOCK_PROJECTS = [
  {
    id: "proj-101",
    title: "Dream Villa — 2400 sq.ft Construction",
    location: "Noida Sector 62",
    status: "in_progress",
    progressPct: 65,
    resources: {
      cement_bags: { used: 240, total: 350 },
      bricks: { used: 18000, total: 25000 },
      sand_tons: { used: 14, total: 20 },
      steel_kg: { used: 3200, total: 4000 }
    },
    labour_mix: [
      { trade: "Senior Mistri", count: 2, rate: 850 },
      { trade: "Labour Helper", count: 4, rate: 500 }
    ],
    timeline: [
      { step: "Foundation & Plinth", done: true },
      { step: "Ground Floor Brickwork", done: true },
      { step: "Slab Casting", done: true },
      { step: "Plastering & Electrical Wiring", done: false },
      { step: "Tiling & Painting", done: false }
    ]
  }
];
