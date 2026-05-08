import type { NewUser } from "../../schema/users";

// Fixed UUIDs for demo accounts (stable across re-seeds)
export const DEMO_RENTER_ID = "d0000000-0000-4000-8000-000000000001";
export const DEMO_HOST_ID = "d0000000-0000-4000-8000-000000000002";
export const DEMO_ADMIN_ID = "d0000000-0000-4000-8000-000000000003";
export const DEMO_FLEET_ID = "d0000000-0000-4000-8000-000000000004";
export const DEMO_RENTER_IN3_ID = "d0000000-0000-4000-8000-000000000005";
export const DEMO_RENTER_IN4_ID = "d0000000-0000-4000-8000-000000000006";

// Fixed UUIDs for additional hosts
export const HOST_MUMBAI_ID = "a0000000-0000-4000-8000-000000000001";
export const HOST_DELHI_ID = "a0000000-0000-4000-8000-000000000002";
export const HOST_HYDERABAD_ID = "a0000000-0000-4000-8000-000000000003";
export const HOST_BLR2_ID = "a0000000-0000-4000-8000-00000000000b";
export const HOST_BLR3_ID = "a0000000-0000-4000-8000-00000000000c";
export const HOST_MUM2_ID = "a0000000-0000-4000-8000-00000000000d";
export const HOST_DEL2_ID = "a0000000-0000-4000-8000-00000000000e";
export const HOST_CHENNAI_ID = "a0000000-0000-4000-8000-00000000000f";
export const HOST_PUNE_ID = "a0000000-0000-4000-8000-000000000010";
export const HOST_JAIPUR_ID = "a0000000-0000-4000-8000-000000000011";
export const HOST_KOCHI_ID = "a0000000-0000-4000-8000-000000000012";
export const HOST_KOLKATA_ID = "a0000000-0000-4000-8000-000000000013";
export const HOST_AHMEDABAD_ID = "a0000000-0000-4000-8000-000000000014";
export const HOST_GOA_ID = "a0000000-0000-4000-8000-000000000015";
export const HOST_LUCKNOW_ID = "a0000000-0000-4000-8000-000000000016";
export const HOST_CHANDIGARH_ID = "a0000000-0000-4000-8000-000000000017";
export const HOST_COIMBATORE_ID = "a0000000-0000-4000-8000-000000000018";

// Additional renter IDs for bookings
export const RENTER_IN1_ID = "b0000000-0000-4000-8000-000000000001";
export const RENTER_IN2_ID = "b0000000-0000-4000-8000-000000000002";
export const RENTER_IN3_ID = "b0000000-0000-4000-8000-000000000003";
export const RENTER_IN4_ID = "b0000000-0000-4000-8000-000000000004";

export const seedUsers: NewUser[] = [
  // ── Demo Accounts ─────────────────────────────────────────────
  {
    id: DEMO_RENTER_ID,
    email: "renter@demo.vroom.app",
    phone: "+919876543210",
    name: "Arjun Mehta",
    avatarUrl: "https://api.dicebear.com/8.x/avataaars/svg?seed=arjun",
    role: "renter",
    trustScore: "0.85",
    status: "active",
    emailVerified: true,
    phoneVerified: true,
    documents: [
      { type: "driving_license", number: "KA05-20200012345", verified: true },
      { type: "aadhaar", number: "XXXX-XXXX-1234", verified: true },
    ],
  },
  {
    id: DEMO_HOST_ID,
    email: "host@demo.vroom.app",
    phone: "+919876543211",
    name: "Priya Sharma",
    avatarUrl: "https://api.dicebear.com/8.x/avataaars/svg?seed=priya",
    role: "host",
    trustScore: "0.92",
    status: "active",
    emailVerified: true,
    phoneVerified: true,
    documents: [
      { type: "driving_license", number: "KA01-20190098765", verified: true },
      { type: "pan", number: "ABCPS1234H", verified: true },
    ],
  },
  {
    id: DEMO_ADMIN_ID,
    email: "admin@demo.vroom.app",
    phone: "+919876543212",
    name: "Vikram Singh",
    avatarUrl: "https://api.dicebear.com/8.x/avataaars/svg?seed=vikram",
    role: "admin",
    trustScore: "1.00",
    status: "active",
    emailVerified: true,
    phoneVerified: true,
    documents: [],
  },
  {
    id: DEMO_FLEET_ID,
    email: "fleet@demo.vroom.app",
    phone: "+919876543213",
    name: "GoFleet Rentals",
    avatarUrl: "https://api.dicebear.com/8.x/avataaars/svg?seed=gofleet",
    role: "host",
    trustScore: "0.95",
    status: "active",
    emailVerified: true,
    phoneVerified: true,
    documents: [
      { type: "gst", number: "29ABCDE1234F1Z5", verified: true },
      { type: "company_registration", number: "U60200KA2023PTC123456", verified: true },
    ],
  },
  // ── Additional Hosts ──────────────────────────────────────────
  {
    id: HOST_MUMBAI_ID,
    email: "rahul.patel@gmail.com",
    phone: "+919822001001",
    name: "Rahul Patel",
    avatarUrl: "https://api.dicebear.com/8.x/avataaars/svg?seed=rahul",
    role: "host",
    trustScore: "0.88",
    status: "active",
    emailVerified: true,
    phoneVerified: true,
    documents: [
      { type: "driving_license", number: "MH02-20180034567", verified: true },
    ],
  },
  {
    id: HOST_DELHI_ID,
    email: "neha.gupta@gmail.com",
    phone: "+919810002002",
    name: "Neha Gupta",
    avatarUrl: "https://api.dicebear.com/8.x/avataaars/svg?seed=neha",
    role: "host",
    trustScore: "0.82",
    status: "active",
    emailVerified: true,
    phoneVerified: true,
    documents: [
      { type: "driving_license", number: "DL01-20200056789", verified: true },
    ],
  },
  {
    id: HOST_HYDERABAD_ID,
    email: "srinivas.reddy@gmail.com",
    phone: "+919848003003",
    name: "Srinivas Reddy",
    avatarUrl: "https://api.dicebear.com/8.x/avataaars/svg?seed=srinivas",
    role: "host",
    trustScore: "0.90",
    status: "active",
    emailVerified: true,
    phoneVerified: true,
    documents: [
      { type: "driving_license", number: "TS07-20190078901", verified: true },
    ],
  },
  {
    id: HOST_BLR2_ID,
    email: "kavitha.r@gmail.com",
    phone: "+919845007001",
    name: "Kavitha Raghavan",
    avatarUrl: "https://api.dicebear.com/8.x/avataaars/svg?seed=kavitha",
    role: "host",
    trustScore: "0.83",
    status: "active",
    emailVerified: true,
    phoneVerified: true,
    documents: [
      { type: "driving_license", number: "KA03-20210011111", verified: true },
    ],
  },
  {
    id: HOST_BLR3_ID,
    email: "deepak.n@gmail.com",
    phone: "+919845008001",
    name: "Deepak Nair",
    avatarUrl: "https://api.dicebear.com/8.x/avataaars/svg?seed=deepak",
    role: "host",
    trustScore: "0.79",
    status: "active",
    emailVerified: true,
    phoneVerified: true,
    documents: [
      { type: "driving_license", number: "KA02-20220022222", verified: true },
    ],
  },
  {
    id: HOST_MUM2_ID,
    email: "anita.shah@gmail.com",
    phone: "+919822009001",
    name: "Anita Shah",
    avatarUrl: "https://api.dicebear.com/8.x/avataaars/svg?seed=anita",
    role: "host",
    trustScore: "0.86",
    status: "active",
    emailVerified: true,
    phoneVerified: true,
    documents: [
      { type: "driving_license", number: "MH04-20190033333", verified: true },
    ],
  },
  {
    id: HOST_DEL2_ID,
    email: "arun.kapoor@gmail.com",
    phone: "+919810010001",
    name: "Arun Kapoor",
    avatarUrl: "https://api.dicebear.com/8.x/avataaars/svg?seed=arun",
    role: "host",
    trustScore: "0.77",
    status: "active",
    emailVerified: true,
    phoneVerified: true,
    documents: [
      { type: "driving_license", number: "DL05-20200044444", verified: true },
    ],
  },

  // ── Additional Renters (for booking diversity) ────────────────
  {
    id: RENTER_IN1_ID,
    email: "pooja.iyer@gmail.com",
    phone: "+919876101010",
    name: "Pooja Iyer",
    avatarUrl: "https://api.dicebear.com/8.x/avataaars/svg?seed=pooja",
    role: "renter",
    trustScore: "0.72",
    status: "active",
    emailVerified: true,
    phoneVerified: true,
    documents: [
      { type: "driving_license", number: "KA04-20210099999", verified: true },
    ],
  },
  {
    id: RENTER_IN2_ID,
    email: "karthik.m@gmail.com",
    phone: "+919876202020",
    name: "Karthik Murthy",
    avatarUrl: "https://api.dicebear.com/8.x/avataaars/svg?seed=karthik",
    role: "renter",
    trustScore: "0.68",
    status: "active",
    emailVerified: true,
    phoneVerified: false,
    documents: [
      { type: "driving_license", number: "MH01-20200088888", verified: true },
    ],
  },
  // ── New City Hosts ──────────────────────────────────────────
  {
    id: HOST_CHENNAI_ID,
    email: "ramesh.s@gmail.com",
    phone: "+919841005001",
    name: "Ramesh Subramanian",
    avatarUrl: "https://api.dicebear.com/8.x/avataaars/svg?seed=ramesh",
    role: "host",
    trustScore: "0.88",
    status: "active",
    emailVerified: true,
    phoneVerified: true,
    documents: [
      { type: "driving_license", number: "TN01-20190045678", verified: true },
    ],
  },
  {
    id: HOST_PUNE_ID,
    email: "manish.deshmukh@gmail.com",
    phone: "+919822006001",
    name: "Manish Deshmukh",
    avatarUrl: "https://api.dicebear.com/8.x/avataaars/svg?seed=manish",
    role: "host",
    trustScore: "0.85",
    status: "active",
    emailVerified: true,
    phoneVerified: true,
    documents: [
      { type: "driving_license", number: "MH12-20200056789", verified: true },
    ],
  },
  {
    id: HOST_JAIPUR_ID,
    email: "rajat.meena@gmail.com",
    phone: "+919829007001",
    name: "Rajat Meena",
    avatarUrl: "https://api.dicebear.com/8.x/avataaars/svg?seed=rajat",
    role: "host",
    trustScore: "0.83",
    status: "active",
    emailVerified: true,
    phoneVerified: true,
    documents: [
      { type: "driving_license", number: "RJ14-20210067890", verified: true },
    ],
  },
  {
    id: HOST_KOCHI_ID,
    email: "suresh.nair@gmail.com",
    phone: "+919847008001",
    name: "Suresh Nair",
    avatarUrl: "https://api.dicebear.com/8.x/avataaars/svg?seed=suresh",
    role: "host",
    trustScore: "0.87",
    status: "active",
    emailVerified: true,
    phoneVerified: true,
    documents: [
      { type: "driving_license", number: "KL07-20190078901", verified: true },
    ],
  },
  {
    id: HOST_KOLKATA_ID,
    email: "arnab.chatterjee@gmail.com",
    phone: "+919830009001",
    name: "Arnab Chatterjee",
    avatarUrl: "https://api.dicebear.com/8.x/avataaars/svg?seed=arnab",
    role: "host",
    trustScore: "0.82",
    status: "active",
    emailVerified: true,
    phoneVerified: true,
    documents: [
      { type: "driving_license", number: "WB06-20200089012", verified: true },
    ],
  },
  {
    id: HOST_AHMEDABAD_ID,
    email: "hitesh.shah@gmail.com",
    phone: "+919825010001",
    name: "Hitesh Shah",
    avatarUrl: "https://api.dicebear.com/8.x/avataaars/svg?seed=hitesh",
    role: "host",
    trustScore: "0.86",
    status: "active",
    emailVerified: true,
    phoneVerified: true,
    documents: [
      { type: "driving_license", number: "GJ01-20210090123", verified: true },
    ],
  },
  {
    id: HOST_GOA_ID,
    email: "rohan.naik@gmail.com",
    phone: "+919850011001",
    name: "Rohan Naik",
    avatarUrl: "https://api.dicebear.com/8.x/avataaars/svg?seed=rohan",
    role: "host",
    trustScore: "0.89",
    status: "active",
    emailVerified: true,
    phoneVerified: true,
    documents: [
      { type: "driving_license", number: "GA01-20200001234", verified: true },
    ],
  },
  {
    id: HOST_LUCKNOW_ID,
    email: "vivek.mishra@gmail.com",
    phone: "+919839012001",
    name: "Vivek Mishra",
    avatarUrl: "https://api.dicebear.com/8.x/avataaars/svg?seed=vivek",
    role: "host",
    trustScore: "0.80",
    status: "active",
    emailVerified: true,
    phoneVerified: true,
    documents: [
      { type: "driving_license", number: "UP32-20210012345", verified: true },
    ],
  },
  {
    id: HOST_CHANDIGARH_ID,
    email: "gurpreet.singh@gmail.com",
    phone: "+919815013001",
    name: "Gurpreet Singh",
    avatarUrl: "https://api.dicebear.com/8.x/avataaars/svg?seed=gurpreet",
    role: "host",
    trustScore: "0.84",
    status: "active",
    emailVerified: true,
    phoneVerified: true,
    documents: [
      { type: "driving_license", number: "CH01-20200023456", verified: true },
    ],
  },
  {
    id: HOST_COIMBATORE_ID,
    email: "shankar.raman@gmail.com",
    phone: "+919843014001",
    name: "Shankar Raman",
    avatarUrl: "https://api.dicebear.com/8.x/avataaars/svg?seed=shankar",
    role: "host",
    trustScore: "0.81",
    status: "active",
    emailVerified: true,
    phoneVerified: true,
    documents: [
      { type: "driving_license", number: "TN38-20210034567", verified: true },
    ],
  },
];
