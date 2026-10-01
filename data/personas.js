/* NIRMAAN Demo Personas
   Safe, masked identities for demonstration. No real PII.
*/

export const DEMO_PERSONAS = {
  user: {
    id: "u-aman",
    name: "Aman Sharma",
    name_hi: "अमन शर्मा",
    phone: "+91 98•••• ••27",
    role: "user",
    area: "Noida Sector 62",
    area_hi: "नोएडा सेक्टर 62",
    avatarInitials: "AS",
    verified: true,
    joinedOn: "2025-08-15"
  },
  kaarigar: {
    id: "k-ramesh",
    name: "Ramesh Yadav",
    name_hi: "रमेश यादव",
    phone: "+91 94•••• ••81",
    role: "kaarigar",
    trade: "mason",
    tradeRole: "Senior Raj Mistri",
    tradeRole_hi: "वरिष्ठ राज मिस्त्री",
    rate: 850,
    rateType: "day",
    area: "Noida Sector 62",
    area_hi: "नोएडा सेक्टर 62",
    avatarInitials: "RY",
    experience: 12,
    rating: 4.9,
    jobsCompleted: 142,
    verified: true,
    aadhaarVerified: true,
    joinedOn: "2024-11-10"
  }
};

export function getPersona(role = "user") {
  return DEMO_PERSONAS[role] || DEMO_PERSONAS.user;
}
