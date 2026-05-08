import type { NewVehicle } from "../../schema/vehicles";
import {
  DEMO_HOST_ID,
  DEMO_FLEET_ID,
  HOST_MUMBAI_ID,
  HOST_DELHI_ID,
  HOST_HYDERABAD_ID,
  HOST_BLR2_ID,
  HOST_BLR3_ID,
  HOST_MUM2_ID,
  HOST_DEL2_ID,
  HOST_CHENNAI_ID,
  HOST_PUNE_ID,
  HOST_JAIPUR_ID,
  HOST_KOCHI_ID,
  HOST_KOLKATA_ID,
  HOST_AHMEDABAD_ID,
  HOST_GOA_ID,
  HOST_LUCKNOW_ID,
  HOST_CHANDIGARH_ID,
  HOST_COIMBATORE_ID,
} from "./users";

// ── Bangalore Neighborhoods ────────────────────────────────────────

const BANGALORE_NEIGHBORHOODS = [
  { area: "Koramangala 5th Block", lat: "12.9352", lng: "77.6245" },
  { area: "Indiranagar", lat: "12.9784", lng: "77.6408" },
  { area: "HSR Layout", lat: "12.9121", lng: "77.6446" },
  { area: "Whitefield", lat: "12.9698", lng: "77.7500" },
  { area: "Jayanagar 4th Block", lat: "12.9250", lng: "77.5897" },
  { area: "JP Nagar", lat: "12.9077", lng: "77.5850" },
  { area: "Electronic City", lat: "12.8450", lng: "77.6600" },
  { area: "Marathahalli", lat: "12.9570", lng: "77.7010" },
  { area: "BTM Layout", lat: "12.9160", lng: "77.6150" },
  { area: "Hebbal", lat: "13.0350", lng: "77.5970" },
  { area: "Yelahanka", lat: "13.1000", lng: "77.5960" },
  { area: "Banashankari", lat: "12.9250", lng: "77.5450" },
  { area: "Rajajinagar", lat: "12.9600", lng: "77.5550" },
  { area: "Malleshwaram", lat: "12.9960", lng: "77.5700" },
  { area: "Basavanagudi", lat: "12.9420", lng: "77.5740" },
  { area: "Sadashivanagar", lat: "12.9920", lng: "77.5800" },
  { area: "MG Road", lat: "12.9750", lng: "77.6070" },
  { area: "Frazer Town", lat: "12.9950", lng: "77.6150" },
  { area: "Banaswadi", lat: "13.0100", lng: "77.6390" },
  { area: "Kalyan Nagar", lat: "13.0250", lng: "77.6410" },
  { area: "Hennur", lat: "13.0440", lng: "77.6370" },
  { area: "Vijayanagar", lat: "12.9710", lng: "77.5320" },
  { area: "Nagarbhavi", lat: "12.9600", lng: "77.5100" },
  { area: "Yeshwanthpur", lat: "13.0230", lng: "77.5450" },
  { area: "Majestic", lat: "12.9770", lng: "77.5720" },
  { area: "KR Puram", lat: "13.0000", lng: "77.7000" },
  { area: "Sarjapur Road", lat: "12.9050", lng: "77.6800" },
  { area: "Bellandur", lat: "12.9260", lng: "77.6760" },
  { area: "Bannerghatta Road", lat: "12.8920", lng: "77.5980" },
  { area: "Domlur", lat: "12.9600", lng: "77.6370" },
  { area: "Ulsoor", lat: "12.9810", lng: "77.6210" },
  { area: "Richmond Town", lat: "12.9630", lng: "77.6000" },
  { area: "Shivajinagar", lat: "12.9856", lng: "77.6044" },
  { area: "Sanjaynagar", lat: "13.0100", lng: "77.5720" },
  { area: "RT Nagar", lat: "13.0200", lng: "77.5970" },
  { area: "Peenya", lat: "13.0280", lng: "77.5200" },
  { area: "Kengeri", lat: "12.9070", lng: "77.4820" },
  { area: "Bommanahalli", lat: "12.9020", lng: "77.6180" },
  { area: "Kadugodi", lat: "12.9900", lng: "77.7580" },
  { area: "Hoodi", lat: "12.9880", lng: "77.7150" },
];

let _neighborhoodIdx = 0;
function getNeighborhood() {
  const n = BANGALORE_NEIGHBORHOODS[_neighborhoodIdx % BANGALORE_NEIGHBORHOODS.length]!;
  _neighborhoodIdx++;
  // Add small random offset to avoid exact same coordinates
  const latOffset = ((_neighborhoodIdx * 7) % 50 - 25) / 10000;
  const lngOffset = ((_neighborhoodIdx * 13) % 50 - 25) / 10000;
  return {
    area: n.area,
    lat: (parseFloat(n.lat) + latOffset).toFixed(7),
    lng: (parseFloat(n.lng) + lngOffset).toFixed(7),
  };
}

// ── Vehicle UUID constants ──────────────────────────────────────────

// Bangalore (city code 0001)
export const V_BLR_SWIFT = "e1000000-0001-4000-8000-000000000001";
export const V_BLR_CRETA = "e1000000-0001-4000-8000-000000000002";
export const V_BLR_SCORPIO = "e1000000-0001-4000-8000-000000000003";
export const V_BLR_NEXON_EV = "e1000000-0001-4000-8000-000000000004";
export const V_BLR_CITY = "e1000000-0001-4000-8000-000000000005";
export const V_BLR_INNOVA = "e1000000-0001-4000-8000-000000000006";
export const V_BLR_SELTOS = "e1000000-0001-4000-8000-000000000007";
export const V_BLR_ALTROZ = "e1000000-0001-4000-8000-000000000008";
export const V_BLR_FORTUNER = "e1000000-0001-4000-8000-000000000009";
export const V_BLR_TIAGO = "e1000000-0001-4000-8000-00000000000a";

// Mumbai (0002)
export const V_MUM_BALENO = "e1000000-0002-4000-8000-000000000001";
export const V_MUM_I20 = "e1000000-0002-4000-8000-000000000002";
export const V_MUM_HARRIER = "e1000000-0002-4000-8000-000000000003";
export const V_MUM_HECTOR = "e1000000-0002-4000-8000-000000000004";
export const V_MUM_GLANZA = "e1000000-0002-4000-8000-000000000005";
export const V_MUM_VERNA = "e1000000-0002-4000-8000-000000000006";
export const V_MUM_ERTIGA = "e1000000-0002-4000-8000-000000000007";
export const V_MUM_XUV700 = "e1000000-0002-4000-8000-000000000008";

// Delhi NCR (0003)
export const V_DEL_DZIRE = "e1000000-0003-4000-8000-000000000001";
export const V_DEL_VENUE = "e1000000-0003-4000-8000-000000000002";
export const V_DEL_FORTUNER = "e1000000-0003-4000-8000-000000000003";
export const V_DEL_SONET = "e1000000-0003-4000-8000-000000000004";
export const V_DEL_VERNA = "e1000000-0003-4000-8000-000000000005";
export const V_DEL_POLO = "e1000000-0003-4000-8000-000000000006";
export const V_DEL_SAFARI = "e1000000-0003-4000-8000-000000000007";
export const V_DEL_CRETA = "e1000000-0003-4000-8000-000000000008";

// Hyderabad (0004)
export const V_HYD_AMAZE = "e1000000-0004-4000-8000-000000000001";
export const V_HYD_XUV700 = "e1000000-0004-4000-8000-000000000002";
export const V_HYD_TIAGO_EV = "e1000000-0004-4000-8000-000000000003";
export const V_HYD_KIGER = "e1000000-0004-4000-8000-000000000004";
export const V_HYD_PUNCH = "e1000000-0004-4000-8000-000000000005";
export const V_HYD_INNOVA = "e1000000-0004-4000-8000-000000000006";
export const V_HYD_SWIFT = "e1000000-0004-4000-8000-000000000007";

// Chennai (0005)
export const V_CHN_SWIFT = "e1000000-0005-4000-8000-000000000001";
export const V_CHN_CRETA = "e1000000-0005-4000-8000-000000000002";
export const V_CHN_INNOVA = "e1000000-0005-4000-8000-000000000003";
export const V_CHN_CITY = "e1000000-0005-4000-8000-000000000004";
export const V_CHN_ALTROZ = "e1000000-0005-4000-8000-000000000005";
export const V_CHN_NEXON = "e1000000-0005-4000-8000-000000000006";

// Pune (0006)
export const V_PUN_BALENO = "e1000000-0006-4000-8000-000000000001";
export const V_PUN_CRETA = "e1000000-0006-4000-8000-000000000002";
export const V_PUN_DZIRE = "e1000000-0006-4000-8000-000000000003";
export const V_PUN_HECTOR = "e1000000-0006-4000-8000-000000000004";
export const V_PUN_I20 = "e1000000-0006-4000-8000-000000000005";
export const V_PUN_BREZZA = "e1000000-0006-4000-8000-000000000006";

// Jaipur (0007)
export const V_JAI_SWIFT = "e1000000-0007-4000-8000-000000000001";
export const V_JAI_SCORPIO = "e1000000-0007-4000-8000-000000000002";
export const V_JAI_ERTIGA = "e1000000-0007-4000-8000-000000000003";
export const V_JAI_DZIRE = "e1000000-0007-4000-8000-000000000004";
export const V_JAI_INNOVA = "e1000000-0007-4000-8000-000000000005";

// Kochi (0008)
export const V_KOC_SWIFT = "e1000000-0008-4000-8000-000000000001";
export const V_KOC_CRETA = "e1000000-0008-4000-8000-000000000002";
export const V_KOC_INNOVA = "e1000000-0008-4000-8000-000000000003";
export const V_KOC_I20 = "e1000000-0008-4000-8000-000000000004";
export const V_KOC_NEXON = "e1000000-0008-4000-8000-000000000005";

// Kolkata (0009)
export const V_KOL_BALENO = "e1000000-0009-4000-8000-000000000001";
export const V_KOL_CRETA = "e1000000-0009-4000-8000-000000000002";
export const V_KOL_DZIRE = "e1000000-0009-4000-8000-000000000003";
export const V_KOL_INNOVA = "e1000000-0009-4000-8000-000000000004";
export const V_KOL_SELTOS = "e1000000-0009-4000-8000-000000000005";

// Ahmedabad (000a)
export const V_AHM_SWIFT = "e1000000-000a-4000-8000-000000000001";
export const V_AHM_HARRIER = "e1000000-000a-4000-8000-000000000002";
export const V_AHM_ERTIGA = "e1000000-000a-4000-8000-000000000003";
export const V_AHM_NEXON = "e1000000-000a-4000-8000-000000000004";
export const V_AHM_CITY = "e1000000-000a-4000-8000-000000000005";

// Goa (000b)
export const V_GOA_SWIFT = "e1000000-000b-4000-8000-000000000001";
export const V_GOA_CRETA = "e1000000-000b-4000-8000-000000000002";
export const V_GOA_THAR = "e1000000-000b-4000-8000-000000000003";
export const V_GOA_ALTROZ = "e1000000-000b-4000-8000-000000000004";
export const V_GOA_ERTIGA = "e1000000-000b-4000-8000-000000000005";

// Lucknow (000c)
export const V_LKO_SWIFT = "e1000000-000c-4000-8000-000000000001";
export const V_LKO_CRETA = "e1000000-000c-4000-8000-000000000002";
export const V_LKO_DZIRE = "e1000000-000c-4000-8000-000000000003";
export const V_LKO_INNOVA = "e1000000-000c-4000-8000-000000000004";

// Chandigarh (000d)
export const V_CHD_SELTOS = "e1000000-000d-4000-8000-000000000001";
export const V_CHD_CRETA = "e1000000-000d-4000-8000-000000000002";
export const V_CHD_SWIFT = "e1000000-000d-4000-8000-000000000003";
export const V_CHD_FORTUNER = "e1000000-000d-4000-8000-000000000004";

// Coimbatore (000e)
export const V_CBE_SWIFT = "e1000000-000e-4000-8000-000000000001";
export const V_CBE_CRETA = "e1000000-000e-4000-8000-000000000002";
export const V_CBE_INNOVA = "e1000000-000e-4000-8000-000000000003";

// Mysore (000f)
export const V_MYS_SWIFT = "e1000000-000f-4000-8000-000000000001";
export const V_MYS_CRETA = "e1000000-000f-4000-8000-000000000002";
export const V_MYS_ERTIGA = "e1000000-000f-4000-8000-000000000003";

// Gurgaon (0010)
export const V_GGN_CRETA = "e1000000-0010-4000-8000-000000000001";
export const V_GGN_FORTUNER = "e1000000-0010-4000-8000-000000000002";
export const V_GGN_I20 = "e1000000-0010-4000-8000-000000000003";

// Noida (0011)
export const V_NOI_SWIFT = "e1000000-0011-4000-8000-000000000001";
export const V_NOI_SELTOS = "e1000000-0011-4000-8000-000000000002";
export const V_NOI_VERNA = "e1000000-0011-4000-8000-000000000003";

// Udaipur (0012)
export const V_UDR_SWIFT = "e1000000-0012-4000-8000-000000000001";
export const V_UDR_SCORPIO = "e1000000-0012-4000-8000-000000000002";

// Surat (0013)
export const V_SUR_BALENO = "e1000000-0013-4000-8000-000000000001";
export const V_SUR_CRETA = "e1000000-0013-4000-8000-000000000002";

// Varanasi (0014)
export const V_VAR_DZIRE = "e1000000-0014-4000-8000-000000000001";
export const V_VAR_ERTIGA = "e1000000-0014-4000-8000-000000000002";

// Trivandrum (0015)
export const V_TVM_SWIFT = "e1000000-0015-4000-8000-000000000001";
export const V_TVM_CRETA = "e1000000-0015-4000-8000-000000000002";

// Warangal (0016)
export const V_WGL_SWIFT = "e1000000-0016-4000-8000-000000000001";

// Hubli (0017)
export const V_HBL_SWIFT = "e1000000-0017-4000-8000-000000000001";
export const V_HBL_INNOVA = "e1000000-0017-4000-8000-000000000002";

// Mangalore (0018)
export const V_MNG_SWIFT = "e1000000-0018-4000-8000-000000000001";
export const V_MNG_CRETA = "e1000000-0018-4000-8000-000000000002";

// Nashik (0019)
export const V_NSK_BALENO = "e1000000-0019-4000-8000-000000000001";
export const V_NSK_BREZZA = "e1000000-0019-4000-8000-000000000002";

// Nagpur (001a)
export const V_NGP_SWIFT = "e1000000-001a-4000-8000-000000000001";
export const V_NGP_CRETA = "e1000000-001a-4000-8000-000000000002";

// Madurai (001b)
export const V_MDU_SWIFT = "e1000000-001b-4000-8000-000000000001";
export const V_MDU_INNOVA = "e1000000-001b-4000-8000-000000000002";

// Bhopal (001c)
export const V_BPL_SWIFT = "e1000000-001c-4000-8000-000000000001";
export const V_BPL_CRETA = "e1000000-001c-4000-8000-000000000002";

// Indore (001d)
export const V_IDR_BALENO = "e1000000-001d-4000-8000-000000000001";
export const V_IDR_BREZZA = "e1000000-001d-4000-8000-000000000002";

// Amritsar (001e)
export const V_AMR_SWIFT = "e1000000-001e-4000-8000-000000000001";
export const V_AMR_INNOVA = "e1000000-001e-4000-8000-000000000002";

// Siliguri (001f)
export const V_SLG_SWIFT = "e1000000-001f-4000-8000-000000000001";

// Vadodara (0020)
export const V_VDR_BALENO = "e1000000-0020-4000-8000-000000000001";
export const V_VDR_CRETA = "e1000000-0020-4000-8000-000000000002";

// Agra (0021)
export const V_AGR_DZIRE = "e1000000-0021-4000-8000-000000000001";
export const V_AGR_ERTIGA = "e1000000-0021-4000-8000-000000000002";

// Jodhpur (0022)
export const V_JDH_SCORPIO = "e1000000-0022-4000-8000-000000000001";
export const V_JDH_SWIFT = "e1000000-0022-4000-8000-000000000002";

// Aurangabad (0023)
export const V_AUR_SWIFT = "e1000000-0023-4000-8000-000000000001";

// New vehicles — Bangalore (0001)
export const V_BLR_BMW320 = "e1000000-0001-4000-8000-00000000000b";
export const V_BLR_PUNCH = "e1000000-0001-4000-8000-00000000000c";
export const V_BLR_ZS_EV = "e1000000-0001-4000-8000-00000000000d";

// New vehicles — Mumbai (0002)
export const V_MUM_MERC_C = "e1000000-0002-4000-8000-000000000009";
export const V_MUM_PUNCH = "e1000000-0002-4000-8000-00000000000a";
export const V_MUM_SONET = "e1000000-0002-4000-8000-00000000000b";
export const V_MUM_ZS_EV = "e1000000-0002-4000-8000-00000000000c";

// New vehicles — Delhi (0003)
export const V_DEL_BMW320 = "e1000000-0003-4000-8000-000000000009";
export const V_DEL_PUNCH = "e1000000-0003-4000-8000-00000000000a";
export const V_DEL_FRONX = "e1000000-0003-4000-8000-00000000000b";
export const V_DEL_ATTO3 = "e1000000-0003-4000-8000-00000000000c";

// New vehicles — Hyderabad (0004)
export const V_HYD_CAMRY = "e1000000-0004-4000-8000-000000000008";
export const V_HYD_SONET = "e1000000-0004-4000-8000-000000000009";
export const V_HYD_GRAND_VITARA = "e1000000-0004-4000-8000-00000000000a";

// New vehicles — Chennai (0005)
export const V_CHN_PUNCH = "e1000000-0005-4000-8000-000000000007";
export const V_CHN_SELTOS = "e1000000-0005-4000-8000-000000000008";
export const V_CHN_HECTOR = "e1000000-0005-4000-8000-000000000009";
export const V_CHN_C3 = "e1000000-0005-4000-8000-00000000000a";

// New vehicles — Pune (0006)
export const V_PUN_PUNCH = "e1000000-0006-4000-8000-000000000007";
export const V_PUN_EV6 = "e1000000-0006-4000-8000-000000000008";
export const V_PUN_HYRYDER = "e1000000-0006-4000-8000-000000000009";

// New vehicles — Jaipur (0007)
export const V_JAI_PUNCH = "e1000000-0007-4000-8000-000000000006";
export const V_JAI_VENUE = "e1000000-0007-4000-8000-000000000007";
export const V_JAI_HECTOR = "e1000000-0007-4000-8000-000000000008";

// New vehicles — Kochi (0008)
export const V_KOC_PUNCH = "e1000000-0008-4000-8000-000000000006";
export const V_KOC_GRAND_VITARA = "e1000000-0008-4000-8000-000000000007";
export const V_KOC_C3 = "e1000000-0008-4000-8000-000000000008";

// New vehicles — Kolkata (0009)
export const V_KOL_PUNCH = "e1000000-0009-4000-8000-000000000006";
export const V_KOL_HECTOR = "e1000000-0009-4000-8000-000000000007";
export const V_KOL_SONET = "e1000000-0009-4000-8000-000000000008";

// New vehicles — Ahmedabad (000a)
export const V_AHM_PUNCH = "e1000000-000a-4000-8000-000000000006";
export const V_AHM_SELTOS = "e1000000-000a-4000-8000-000000000007";
export const V_AHM_TUCSON = "e1000000-000a-4000-8000-000000000008";

// New vehicles — Goa (000b)
export const V_GOA_PUNCH = "e1000000-000b-4000-8000-000000000006";
export const V_GOA_ZS_EV = "e1000000-000b-4000-8000-000000000007";
export const V_GOA_SONET = "e1000000-000b-4000-8000-000000000008";

// New vehicles — Lucknow (000c)
export const V_LKO_PUNCH = "e1000000-000c-4000-8000-000000000005";
export const V_LKO_SONET = "e1000000-000c-4000-8000-000000000006";

// New vehicles — Chandigarh (000d)
export const V_CHD_PUNCH = "e1000000-000d-4000-8000-000000000005";
export const V_CHD_HECTOR = "e1000000-000d-4000-8000-000000000006";

// New vehicles — Coimbatore (000e)
export const V_CBE_PUNCH = "e1000000-000e-4000-8000-000000000004";
export const V_CBE_VENUE = "e1000000-000e-4000-8000-000000000005";

// New vehicles — Mysore (000f)
export const V_MYS_PUNCH = "e1000000-000f-4000-8000-000000000004";
export const V_MYS_SONET = "e1000000-000f-4000-8000-000000000005";

// New vehicles — Gurgaon (0010)
export const V_GGN_PUNCH = "e1000000-0010-4000-8000-000000000004";
export const V_GGN_SELTOS = "e1000000-0010-4000-8000-000000000005";
export const V_GGN_FRONX = "e1000000-0010-4000-8000-000000000006";

// New vehicles — Noida (0011)
export const V_NOI_PUNCH = "e1000000-0011-4000-8000-000000000004";
export const V_NOI_HECTOR = "e1000000-0011-4000-8000-000000000005";
export const V_NOI_VENUE = "e1000000-0011-4000-8000-000000000006";

// New vehicles — Udaipur (0012)
export const V_UDR_PUNCH = "e1000000-0012-4000-8000-000000000003";
export const V_UDR_BREZZA = "e1000000-0012-4000-8000-000000000004";
export const V_UDR_VENUE = "e1000000-0012-4000-8000-000000000005";

// New vehicles — Surat (0013)
export const V_SUR_PUNCH = "e1000000-0013-4000-8000-000000000003";
export const V_SUR_SONET = "e1000000-0013-4000-8000-000000000004";
export const V_SUR_VENUE = "e1000000-0013-4000-8000-000000000005";

// New vehicles — Varanasi (0014)
export const V_VAR_PUNCH = "e1000000-0014-4000-8000-000000000003";
export const V_VAR_I20 = "e1000000-0014-4000-8000-000000000004";
export const V_VAR_CRETA = "e1000000-0014-4000-8000-000000000005";

// New vehicles — Trivandrum (0015)
export const V_TVM_PUNCH = "e1000000-0015-4000-8000-000000000003";
export const V_TVM_SONET = "e1000000-0015-4000-8000-000000000004";
export const V_TVM_ERTIGA = "e1000000-0015-4000-8000-000000000005";

// New vehicles — Warangal (0016)
export const V_WGL_PUNCH = "e1000000-0016-4000-8000-000000000002";
export const V_WGL_CRETA = "e1000000-0016-4000-8000-000000000003";
export const V_WGL_BREZZA = "e1000000-0016-4000-8000-000000000004";
export const V_WGL_SONET = "e1000000-0016-4000-8000-000000000005";

// New vehicles — Hubli (0017)
export const V_HBL_PUNCH = "e1000000-0017-4000-8000-000000000003";
export const V_HBL_BREZZA = "e1000000-0017-4000-8000-000000000004";
export const V_HBL_VENUE = "e1000000-0017-4000-8000-000000000005";

// New vehicles — Mangalore (0018)
export const V_MNG_PUNCH = "e1000000-0018-4000-8000-000000000003";
export const V_MNG_SONET = "e1000000-0018-4000-8000-000000000004";
export const V_MNG_ERTIGA = "e1000000-0018-4000-8000-000000000005";

// New vehicles — Nashik (0019)
export const V_NSK_PUNCH = "e1000000-0019-4000-8000-000000000003";
export const V_NSK_VENUE = "e1000000-0019-4000-8000-000000000004";
export const V_NSK_SONET = "e1000000-0019-4000-8000-000000000005";

// New vehicles — Nagpur (001a)
export const V_NGP_PUNCH = "e1000000-001a-4000-8000-000000000003";
export const V_NGP_I20 = "e1000000-001a-4000-8000-000000000004";
export const V_NGP_BREZZA = "e1000000-001a-4000-8000-000000000005";

// New vehicles — Madurai (001b)
export const V_MDU_PUNCH = "e1000000-001b-4000-8000-000000000003";
export const V_MDU_VENUE = "e1000000-001b-4000-8000-000000000004";
export const V_MDU_BREZZA = "e1000000-001b-4000-8000-000000000005";

// New vehicles — Bhopal (001c)
export const V_BPL_PUNCH = "e1000000-001c-4000-8000-000000000003";
export const V_BPL_I20 = "e1000000-001c-4000-8000-000000000004";
export const V_BPL_ERTIGA = "e1000000-001c-4000-8000-000000000005";

// New vehicles — Indore (001d)
export const V_IDR_PUNCH = "e1000000-001d-4000-8000-000000000003";
export const V_IDR_VENUE = "e1000000-001d-4000-8000-000000000004";
export const V_IDR_SONET = "e1000000-001d-4000-8000-000000000005";

// New vehicles — Amritsar (001e)
export const V_AMR_PUNCH = "e1000000-001e-4000-8000-000000000003";
export const V_AMR_I20 = "e1000000-001e-4000-8000-000000000004";
export const V_AMR_SONET = "e1000000-001e-4000-8000-000000000005";

// New vehicles — Siliguri (001f)
export const V_SLG_PUNCH = "e1000000-001f-4000-8000-000000000002";
export const V_SLG_CRETA = "e1000000-001f-4000-8000-000000000003";
export const V_SLG_BREZZA = "e1000000-001f-4000-8000-000000000004";
export const V_SLG_SONET = "e1000000-001f-4000-8000-000000000005";

// New vehicles — Vadodara (0020)
export const V_VDR_PUNCH = "e1000000-0020-4000-8000-000000000003";
export const V_VDR_SONET = "e1000000-0020-4000-8000-000000000004";
export const V_VDR_VENUE = "e1000000-0020-4000-8000-000000000005";

// New vehicles — Agra (0021)
export const V_AGR_PUNCH = "e1000000-0021-4000-8000-000000000003";
export const V_AGR_I20 = "e1000000-0021-4000-8000-000000000004";
export const V_AGR_SONET = "e1000000-0021-4000-8000-000000000005";

// New vehicles — Jodhpur (0022)
export const V_JDH_PUNCH = "e1000000-0022-4000-8000-000000000003";
export const V_JDH_VENUE = "e1000000-0022-4000-8000-000000000004";
export const V_JDH_BREZZA = "e1000000-0022-4000-8000-000000000005";

// New vehicles — Aurangabad (0023)
export const V_AUR_PUNCH = "e1000000-0023-4000-8000-000000000002";
export const V_AUR_CRETA = "e1000000-0023-4000-8000-000000000003";
export const V_AUR_BREZZA = "e1000000-0023-4000-8000-000000000004";
export const V_AUR_SONET = "e1000000-0023-4000-8000-000000000005";

// Fleet vehicles (spread across cities)
export const V_FLEET_ERTIGA = "e1000000-00f0-4000-8000-000000000001";
export const V_FLEET_CITY_MUM = "e1000000-00f0-4000-8000-000000000002";
export const V_FLEET_XUV300 = "e1000000-00f0-4000-8000-000000000003";
export const V_FLEET_SWIFT_DEL = "e1000000-00f0-4000-8000-000000000004";
export const V_FLEET_BREZZA = "e1000000-00f0-4000-8000-000000000005";
export const V_FLEET_CRETA_HYD = "e1000000-00f0-4000-8000-000000000006";

// ── Photo URLs ──────────────────────────────────────────────────────
// Multiple unique photos per vehicle type for variety

const PHOTO_POOL = {
  hatchback: [
    "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800",
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800",
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800",
    "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800",
    "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800",
    "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800",
    "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800",
    "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800",
  ],
  sedan: [
    "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800",
    "https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800",
    "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=800",
    "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800",
    "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800",
    "https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800",
    "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800",
    "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800",
  ],
  suv: [
    "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800",
    "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800",
    "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=800",
    "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800",
    "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800",
    "https://images.unsplash.com/photo-1612825173281-9a193378527e?w=800",
    "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800",
    "https://images.unsplash.com/photo-1542362567-b07e54358753?w=800",
    "https://images.unsplash.com/photo-1616422285623-13ff0162193c?w=800",
    "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=800",
  ],
  luxury: [
    "https://images.unsplash.com/photo-1563720223185-11003d516935?w=800",
    "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=800",
    "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800",
    "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800",
    "https://images.unsplash.com/photo-1614200179396-2bdb77ebf81b?w=800",
  ],
  ev: [
    "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800",
    "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800",
    "https://images.unsplash.com/photo-1704340142770-b52988e5b6eb?w=800",
    "https://images.unsplash.com/photo-1615829386703-e2bb66a7cb7d?w=800",
  ],
  mpv: [
    "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800",
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800",
    "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800",
    "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800",
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800",
    "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800",
  ],
};

// Interior / detail shots shared across vehicles as secondary photos
const INTERIOR_SHOTS = [
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800",
  "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800",
  "https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800",
  "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=800",
  "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800",
  "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=800",
];

let _photoCounter = 0;

function getPhotos(type: string): Array<{ url: string; position: number; isPrimary?: boolean }> {
  const pool = PHOTO_POOL[type as keyof typeof PHOTO_POOL] ?? PHOTO_POOL.sedan;
  const primary = pool[_photoCounter % pool.length]!;
  const interior = INTERIOR_SHOTS[_photoCounter % INTERIOR_SHOTS.length]!;
  const secondary = pool[(_photoCounter + 3) % pool.length]!;
  _photoCounter++;
  return [
    { url: primary, position: 0, isPrimary: true },
    { url: interior, position: 1 },
    { url: secondary, position: 2 },
  ];
}

// ── Helper ──────────────────────────────────────────────────────────

function v(
  overrides: Partial<NewVehicle> & Pick<NewVehicle, "id" | "hostId" | "make" | "model" | "year" | "vehicleType" | "fuelType" | "transmission" | "seats" | "registrationNumber" | "latitude" | "longitude" | "city" | "baseDailyRate">
): NewVehicle {
  const hood = getNeighborhood();
  return {
    country: "IN",
    currency: "INR",
    timezone: "Asia/Kolkata",
    status: "listed",
    instantBooking: true,
    weeklyDiscountPct: 10,
    monthlyDiscountPct: 20,
    photos: getPhotos(overrides.vehicleType),
    features: [],
    rules: { mileageLimit: 300, noSmoking: true, noPets: false, extraMileageCharge: 1000 },
    ...overrides,
    // Override city/location to Bangalore
    city: "Bangalore",
    address: `${hood.area}, Bangalore`,
    latitude: hood.lat,
    longitude: hood.lng,
  } as NewVehicle;
}

// ── Seed Data ───────────────────────────────────────────────────────

export const seedVehicles: NewVehicle[] = [
  // ═══════════════════════════════════════════════════════════════
  // BANGALORE
  // ═══════════════════════════════════════════════════════════════
  v({
    id: V_BLR_SWIFT, hostId: DEMO_HOST_ID,
    make: "Maruti Suzuki", model: "Swift", year: 2023, variant: "ZXi AMT",
    vehicleType: "hatchback", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Pearl Arctic White", registrationNumber: "KA01AB1234",
    latitude: "12.9352000", longitude: "77.6245000",
    address: "4th Cross, Koramangala 5th Block, Bangalore", city: "Bangalore",
    baseDailyRate: 80000, weekendRate: 95000, minPrice: 65000,
    features: ["apple_carplay", "android_auto", "rear_camera", "cruise_control", "push_start"],
    ratingAvg: "4.5", tripCount: 47, reviewCount: 38,
  }),
  v({
    id: V_BLR_CRETA, hostId: DEMO_HOST_ID,
    make: "Hyundai", model: "Creta", year: 2024, variant: "SX(O) Turbo DCT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Titan Grey", registrationNumber: "KA01CD5678",
    latitude: "12.9784000", longitude: "77.6408000",
    address: "12th Main, Indiranagar, Bangalore", city: "Bangalore",
    baseDailyRate: 180000, weekendRate: 210000, minPrice: 150000,
    features: ["sunroof", "ventilated_seats", "360_camera", "adas", "wireless_charging", "bose_audio"],
    ratingAvg: "4.7", tripCount: 62, reviewCount: 51,
  }),
  v({
    id: V_BLR_SCORPIO, hostId: DEMO_HOST_ID,
    make: "Mahindra", model: "Scorpio N", year: 2024, variant: "Z8L AT",
    vehicleType: "suv", fuelType: "diesel", transmission: "automatic", seats: 7,
    color: "Deep Forest Green", registrationNumber: "KA01EF9012",
    latitude: "12.9121000", longitude: "77.6446000",
    address: "HSR Layout Sector 2, Bangalore", city: "Bangalore",
    baseDailyRate: 220000, weekendRate: 260000, minPrice: 180000,
    features: ["4wd", "terrain_modes", "sunroof", "apple_carplay", "android_auto"],
    ratingAvg: "4.6", tripCount: 35, reviewCount: 28, instantBooking: false,
  }),
  v({
    id: V_BLR_NEXON_EV, hostId: DEMO_HOST_ID,
    make: "Tata", model: "Nexon EV", year: 2024, variant: "Max LR Empowered+",
    vehicleType: "ev", fuelType: "electric", transmission: "automatic", seats: 5,
    color: "Pristine White", registrationNumber: "KA01GH3456",
    latitude: "12.9698000", longitude: "77.7500000",
    address: "ITPL Main Road, Whitefield, Bangalore", city: "Bangalore",
    baseDailyRate: 160000, weekendRate: 190000, minPrice: 130000,
    features: ["ev", "fast_charging", "connected_car", "sunroof", "air_purifier"],
    ratingAvg: "4.8", tripCount: 28, reviewCount: 22,
  }),
  v({
    id: V_BLR_CITY, hostId: DEMO_HOST_ID,
    make: "Honda", model: "City", year: 2023, variant: "ZX CVT",
    vehicleType: "sedan", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Platinum White Pearl", registrationNumber: "KA01IJ7890",
    latitude: "12.9250000", longitude: "77.5897000",
    address: "Jayanagar 4th Block, Bangalore", city: "Bangalore",
    baseDailyRate: 150000, weekendRate: 175000, minPrice: 120000,
    features: ["sunroof", "lane_watch_camera", "apple_carplay", "android_auto"],
    ratingAvg: "4.4", tripCount: 55, reviewCount: 43,
  }),
  v({
    id: V_BLR_INNOVA, hostId: HOST_BLR2_ID,
    make: "Toyota", model: "Innova Crysta", year: 2023, variant: "GX AT",
    vehicleType: "mpv", fuelType: "diesel", transmission: "automatic", seats: 7,
    color: "Super White", registrationNumber: "KA01KL2345",
    latitude: "12.9716000", longitude: "77.5946000",
    address: "Malleshwaram 15th Cross, Bangalore", city: "Bangalore",
    baseDailyRate: 250000, weekendRate: 300000, minPrice: 200000,
    features: ["captain_seats", "rear_ac", "apple_carplay", "cruise_control"],
    ratingAvg: "4.6", tripCount: 72, reviewCount: 58, instantBooking: false,
  }),
  v({
    id: V_BLR_SELTOS, hostId: HOST_BLR3_ID,
    make: "Kia", model: "Seltos", year: 2024, variant: "HTX+ IVT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Gravity Grey", registrationNumber: "KA03MN6789",
    latitude: "12.9500000", longitude: "77.5700000",
    address: "Basavanagudi, Bull Temple Road, Bangalore", city: "Bangalore",
    baseDailyRate: 170000, weekendRate: 200000, minPrice: 140000,
    features: ["sunroof", "ventilated_seats", "360_camera", "bose_audio"],
    ratingAvg: "4.5", tripCount: 41, reviewCount: 33,
  }),
  v({
    id: V_BLR_ALTROZ, hostId: HOST_BLR3_ID,
    make: "Tata", model: "Altroz", year: 2023, variant: "XZ+ DCA",
    vehicleType: "hatchback", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Opera Blue", registrationNumber: "KA02OP1234",
    latitude: "12.9600000", longitude: "77.6100000",
    address: "Richmond Road, Bangalore", city: "Bangalore",
    baseDailyRate: 70000, weekendRate: 85000, minPrice: 55000,
    features: ["apple_carplay", "android_auto", "rear_camera", "projector_headlamps"],
    ratingAvg: "4.3", tripCount: 33, reviewCount: 25,
  }),
  v({
    id: V_BLR_FORTUNER, hostId: HOST_BLR2_ID,
    make: "Toyota", model: "Fortuner", year: 2024, variant: "Legender AT 4x4",
    vehicleType: "luxury", fuelType: "diesel", transmission: "automatic", seats: 7,
    color: "Phantom Brown", registrationNumber: "KA01QR5678",
    latitude: "12.9800000", longitude: "77.6200000",
    address: "MG Road, Bangalore", city: "Bangalore",
    baseDailyRate: 450000, weekendRate: 520000, minPrice: 380000,
    features: ["4wd", "terrain_modes", "jbl_audio", "cooled_seats", "360_camera"],
    ratingAvg: "4.9", tripCount: 18, reviewCount: 15,
  }),
  v({
    id: V_BLR_TIAGO, hostId: HOST_BLR3_ID,
    make: "Tata", model: "Tiago", year: 2023, variant: "XZ+ AMT",
    vehicleType: "hatchback", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Flame Red", registrationNumber: "KA04ST9012",
    latitude: "12.9100000", longitude: "77.6500000",
    address: "BTM Layout 2nd Stage, Bangalore", city: "Bangalore",
    baseDailyRate: 55000, weekendRate: 68000, minPrice: 45000,
    features: ["apple_carplay", "android_auto", "rear_camera"],
    ratingAvg: "4.2", tripCount: 61, reviewCount: 48,
  }),

  // ═══════════════════════════════════════════════════════════════
  // MUMBAI
  // ═══════════════════════════════════════════════════════════════
  v({
    id: V_MUM_BALENO, hostId: HOST_MUMBAI_ID,
    make: "Maruti Suzuki", model: "Baleno", year: 2024, variant: "Alpha AMT",
    vehicleType: "hatchback", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Nexa Blue", registrationNumber: "MH01UV3456",
    latitude: "19.0596000", longitude: "72.8295000",
    address: "Hill Road, Bandra West, Mumbai", city: "Mumbai",
    baseDailyRate: 85000, weekendRate: 100000, minPrice: 70000,
    features: ["heads_up_display", "360_camera", "apple_carplay", "android_auto"],
    ratingAvg: "4.4", tripCount: 58, reviewCount: 45,
  }),
  v({
    id: V_MUM_I20, hostId: HOST_MUMBAI_ID,
    make: "Hyundai", model: "i20", year: 2024, variant: "Asta(O) DCT",
    vehicleType: "hatchback", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Fiery Red", registrationNumber: "MH02WX7890",
    latitude: "19.1136000", longitude: "72.8697000",
    address: "SV Road, Andheri West, Mumbai", city: "Mumbai",
    baseDailyRate: 90000, weekendRate: 105000, minPrice: 75000,
    features: ["sunroof", "wireless_charging", "bose_audio", "connected_car"],
    ratingAvg: "4.5", tripCount: 44, reviewCount: 36,
  }),
  v({
    id: V_MUM_HARRIER, hostId: HOST_MUMBAI_ID,
    make: "Tata", model: "Harrier", year: 2024, variant: "Fearless+ AT",
    vehicleType: "suv", fuelType: "diesel", transmission: "automatic", seats: 5,
    color: "Ash Grey", registrationNumber: "MH01YZ1234",
    latitude: "19.0176000", longitude: "72.8562000",
    address: "Prabhadevi, Mumbai", city: "Mumbai",
    baseDailyRate: 200000, weekendRate: 240000, minPrice: 170000,
    features: ["sunroof", "jbl_audio", "360_camera", "adas", "ventilated_seats"],
    ratingAvg: "4.6", tripCount: 31, reviewCount: 24,
  }),
  v({
    id: V_MUM_HECTOR, hostId: HOST_MUM2_ID,
    make: "MG", model: "Hector", year: 2024, variant: "Sharp Pro CVT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Starry Black", registrationNumber: "MH03AB5678",
    latitude: "19.0760000", longitude: "72.8777000",
    address: "Colaba Causeway, Mumbai", city: "Mumbai",
    baseDailyRate: 190000, weekendRate: 225000, minPrice: 160000,
    features: ["panoramic_sunroof", "14_inch_touchscreen", "adas", "wireless_charging"],
    ratingAvg: "4.3", tripCount: 27, reviewCount: 20,
  }),
  v({
    id: V_MUM_GLANZA, hostId: HOST_MUM2_ID,
    make: "Toyota", model: "Glanza", year: 2023, variant: "V AMT",
    vehicleType: "hatchback", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Cafe White", registrationNumber: "MH04CD9012",
    latitude: "19.1286000", longitude: "72.8360000",
    address: "Juhu Tara Road, Mumbai", city: "Mumbai",
    baseDailyRate: 75000, weekendRate: 90000, minPrice: 60000,
    features: ["heads_up_display", "apple_carplay", "android_auto", "rear_camera"],
    ratingAvg: "4.2", tripCount: 39, reviewCount: 30,
  }),
  v({
    id: V_MUM_VERNA, hostId: HOST_MUMBAI_ID,
    make: "Hyundai", model: "Verna", year: 2024, variant: "SX(O) Turbo DCT",
    vehicleType: "sedan", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Abyss Black", registrationNumber: "MH01EF3456",
    latitude: "19.0430000", longitude: "72.8200000",
    address: "Worli Sea Face, Mumbai", city: "Mumbai",
    baseDailyRate: 160000, weekendRate: 190000, minPrice: 130000,
    features: ["sunroof", "ventilated_seats", "bose_audio", "adas", "wireless_charging"],
    ratingAvg: "4.6", tripCount: 22, reviewCount: 18,
  }),
  v({
    id: V_MUM_ERTIGA, hostId: HOST_MUM2_ID,
    make: "Maruti Suzuki", model: "Ertiga", year: 2023, variant: "ZXi+ AT",
    vehicleType: "mpv", fuelType: "petrol", transmission: "automatic", seats: 7,
    color: "Pearl Metallic Auburn Red", registrationNumber: "MH02GH7890",
    latitude: "19.0900000", longitude: "72.8400000",
    address: "Khar West, Mumbai", city: "Mumbai",
    baseDailyRate: 140000, weekendRate: 165000, minPrice: 115000,
    features: ["rear_ac", "apple_carplay", "android_auto", "cruise_control"],
    ratingAvg: "4.4", tripCount: 56, reviewCount: 44,
  }),
  v({
    id: V_MUM_XUV700, hostId: HOST_MUM2_ID,
    make: "Mahindra", model: "XUV700", year: 2024, variant: "AX7 L AT",
    vehicleType: "suv", fuelType: "diesel", transmission: "automatic", seats: 7,
    color: "Dazzling Silver", registrationNumber: "MH04IJ1234",
    latitude: "19.1800000", longitude: "72.9600000",
    address: "LBS Marg, Mulund, Mumbai", city: "Mumbai",
    baseDailyRate: 260000, weekendRate: 310000, minPrice: 220000,
    features: ["adas", "panoramic_sunroof", "sony_audio", "wireless_charging", "flush_door_handles"],
    ratingAvg: "4.7", tripCount: 19, reviewCount: 15,
  }),

  // ═══════════════════════════════════════════════════════════════
  // DELHI NCR
  // ═══════════════════════════════════════════════════════════════
  v({
    id: V_DEL_DZIRE, hostId: HOST_DELHI_ID,
    make: "Maruti Suzuki", model: "Dzire", year: 2024, variant: "ZXi+ AMT",
    vehicleType: "sedan", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Sherwood Brown", registrationNumber: "DL01KL5678",
    latitude: "28.6280000", longitude: "77.2190000",
    address: "Connaught Place, New Delhi", city: "New Delhi",
    baseDailyRate: 90000, weekendRate: 110000, minPrice: 75000,
    features: ["apple_carplay", "android_auto", "rear_camera", "cruise_control"],
    ratingAvg: "4.3", tripCount: 65, reviewCount: 52,
  }),
  v({
    id: V_DEL_VENUE, hostId: HOST_DELHI_ID,
    make: "Hyundai", model: "Venue", year: 2024, variant: "SX(O) DCT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Denim Blue", registrationNumber: "DL02MN9012",
    latitude: "28.5700000", longitude: "77.2100000",
    address: "Saket District Centre, New Delhi", city: "New Delhi",
    baseDailyRate: 130000, weekendRate: 155000, minPrice: 110000,
    features: ["sunroof", "connected_car", "wireless_charging", "rear_camera"],
    ratingAvg: "4.4", tripCount: 38, reviewCount: 29,
  }),
  v({
    id: V_DEL_FORTUNER, hostId: HOST_DELHI_ID,
    make: "Toyota", model: "Fortuner", year: 2024, variant: "Legender AT",
    vehicleType: "luxury", fuelType: "diesel", transmission: "automatic", seats: 7,
    color: "Attitude Black", registrationNumber: "DL03OP3456",
    latitude: "28.6500000", longitude: "77.2300000",
    address: "Karol Bagh, New Delhi", city: "New Delhi",
    baseDailyRate: 450000, weekendRate: 530000, minPrice: 380000,
    features: ["4wd", "jbl_audio", "cooled_seats", "360_camera", "adas"],
    ratingAvg: "4.8", tripCount: 22, reviewCount: 18,
  }),
  v({
    id: V_DEL_SONET, hostId: HOST_DEL2_ID,
    make: "Kia", model: "Sonet", year: 2024, variant: "HTX+ IMT",
    vehicleType: "suv", fuelType: "petrol", transmission: "manual", seats: 5,
    color: "Glacier White Pearl", registrationNumber: "DL04QR7890",
    latitude: "28.5900000", longitude: "77.2500000",
    address: "Nehru Place, New Delhi", city: "New Delhi",
    baseDailyRate: 120000, weekendRate: 140000, minPrice: 100000,
    features: ["sunroof", "ventilated_seats", "bose_audio", "air_purifier"],
    ratingAvg: "4.3", tripCount: 29, reviewCount: 22,
  }),
  v({
    id: V_DEL_VERNA, hostId: HOST_DEL2_ID,
    make: "Hyundai", model: "Verna", year: 2024, variant: "SX Turbo DCT",
    vehicleType: "sedan", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Typhoon Silver", registrationNumber: "DL05ST1234",
    latitude: "28.6100000", longitude: "77.2000000",
    address: "Rajpath Area, New Delhi", city: "New Delhi",
    baseDailyRate: 155000, weekendRate: 185000, minPrice: 130000,
    features: ["sunroof", "ventilated_seats", "bose_audio", "adas"],
    ratingAvg: "4.5", tripCount: 34, reviewCount: 27,
  }),
  v({
    id: V_DEL_POLO, hostId: HOST_DEL2_ID,
    make: "Volkswagen", model: "Virtus", year: 2024, variant: "GT Plus DSG",
    vehicleType: "sedan", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Carbon Steel Grey", registrationNumber: "DL06UV5678",
    latitude: "28.6400000", longitude: "77.1800000",
    address: "Rajouri Garden, New Delhi", city: "New Delhi",
    baseDailyRate: 145000, weekendRate: 170000, minPrice: 120000,
    features: ["sunroof", "ventilated_seats", "wireless_charging", "cruise_control"],
    ratingAvg: "4.4", tripCount: 19, reviewCount: 14,
  }),
  v({
    id: V_DEL_SAFARI, hostId: HOST_DELHI_ID,
    make: "Tata", model: "Safari", year: 2024, variant: "Adventure+ AT",
    vehicleType: "suv", fuelType: "diesel", transmission: "automatic", seats: 7,
    color: "Cosmic Gold", registrationNumber: "DL07WX9012",
    latitude: "28.6300000", longitude: "77.2400000",
    address: "ITO, New Delhi", city: "New Delhi",
    baseDailyRate: 230000, weekendRate: 270000, minPrice: 190000,
    features: ["panoramic_sunroof", "jbl_audio", "adas", "terrain_modes", "ventilated_seats"],
    ratingAvg: "4.5", tripCount: 25, reviewCount: 20,
  }),
  v({
    id: V_DEL_CRETA, hostId: HOST_DELHI_ID,
    make: "Hyundai", model: "Creta", year: 2024, variant: "SX(O) DCT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Atlas White", registrationNumber: "DL08YZ3456",
    latitude: "28.5500000", longitude: "77.2000000",
    address: "Vasant Kunj, New Delhi", city: "New Delhi",
    baseDailyRate: 175000, weekendRate: 205000, minPrice: 145000,
    features: ["sunroof", "360_camera", "adas", "ventilated_seats", "bose_audio"],
    ratingAvg: "4.6", tripCount: 42, reviewCount: 35,
  }),

  // ═══════════════════════════════════════════════════════════════
  // HYDERABAD
  // ═══════════════════════════════════════════════════════════════
  v({
    id: V_HYD_AMAZE, hostId: HOST_HYDERABAD_ID,
    make: "Honda", model: "Amaze", year: 2023, variant: "VX CVT",
    vehicleType: "sedan", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Lunar Silver Metallic", registrationNumber: "TS07AB1234",
    latitude: "17.4400000", longitude: "78.3489000",
    address: "Jubilee Hills, Hyderabad", city: "Hyderabad",
    baseDailyRate: 85000, weekendRate: 100000, minPrice: 70000,
    features: ["apple_carplay", "android_auto", "cruise_control", "rear_camera"],
    ratingAvg: "4.2", tripCount: 42, reviewCount: 33,
  }),
  v({
    id: V_HYD_XUV700, hostId: HOST_HYDERABAD_ID,
    make: "Mahindra", model: "XUV700", year: 2024, variant: "AX7 L Diesel AT AWD",
    vehicleType: "suv", fuelType: "diesel", transmission: "automatic", seats: 7,
    color: "Everest White", registrationNumber: "TS08CD5678",
    latitude: "17.3850000", longitude: "78.4867000",
    address: "Hitech City, Hyderabad", city: "Hyderabad",
    baseDailyRate: 270000, weekendRate: 320000, minPrice: 230000,
    features: ["adas", "panoramic_sunroof", "sony_audio", "4wd", "flush_door_handles"],
    ratingAvg: "4.8", tripCount: 19, reviewCount: 16,
  }),
  v({
    id: V_HYD_TIAGO_EV, hostId: HOST_HYDERABAD_ID,
    make: "Tata", model: "Tiago EV", year: 2024, variant: "XZ+ Tech Lux",
    vehicleType: "ev", fuelType: "electric", transmission: "automatic", seats: 5,
    color: "Teal Blue", registrationNumber: "TS09EF9012",
    latitude: "17.4200000", longitude: "78.4500000",
    address: "Banjara Hills, Hyderabad", city: "Hyderabad",
    baseDailyRate: 60000, weekendRate: 75000, minPrice: 50000,
    features: ["ev", "fast_charging", "connected_car", "cruise_control"],
    ratingAvg: "4.1", tripCount: 23, reviewCount: 17,
  }),
  v({
    id: V_HYD_KIGER, hostId: HOST_HYDERABAD_ID,
    make: "Renault", model: "Kiger", year: 2023, variant: "RXT(O) CVT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Caspian Blue", registrationNumber: "TS10GH3456",
    latitude: "17.3600000", longitude: "78.4700000",
    address: "Gachibowli, Hyderabad", city: "Hyderabad",
    baseDailyRate: 95000, weekendRate: 115000, minPrice: 80000,
    features: ["wireless_charging", "ambient_lighting", "rear_camera", "push_start"],
    ratingAvg: "4.0", tripCount: 31, reviewCount: 24,
  }),
  v({
    id: V_HYD_PUNCH, hostId: HOST_HYDERABAD_ID,
    make: "Tata", model: "Punch", year: 2024, variant: "Creative+ AMT",
    vehicleType: "hatchback", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Tropical Mist", registrationNumber: "TS11IJ7890",
    latitude: "17.4000000", longitude: "78.5000000",
    address: "Kondapur, Hyderabad", city: "Hyderabad",
    baseDailyRate: 65000, weekendRate: 80000, minPrice: 55000,
    features: ["terrain_modes", "rear_camera", "apple_carplay", "android_auto"],
    ratingAvg: "4.3", tripCount: 37, reviewCount: 28,
  }),
  v({
    id: V_HYD_INNOVA, hostId: HOST_HYDERABAD_ID,
    make: "Toyota", model: "Innova Hycross", year: 2024, variant: "VX HEV",
    vehicleType: "mpv", fuelType: "hybrid", transmission: "automatic", seats: 7,
    color: "Super White", registrationNumber: "TS07KL1234",
    latitude: "17.4100000", longitude: "78.4400000",
    address: "Road No 12, Banjara Hills, Hyderabad", city: "Hyderabad",
    baseDailyRate: 280000, weekendRate: 330000, minPrice: 240000,
    features: ["captain_seats", "rear_ac", "connected_car", "ottoman_seats"],
    ratingAvg: "4.7", tripCount: 14, reviewCount: 11,
  }),
  v({
    id: V_HYD_SWIFT, hostId: HOST_HYDERABAD_ID,
    make: "Maruti Suzuki", model: "Swift", year: 2024, variant: "ZXi AMT",
    vehicleType: "hatchback", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Sizzling Red", registrationNumber: "TS08MN5678",
    latitude: "17.4450000", longitude: "78.3800000",
    address: "Film Nagar, Hyderabad", city: "Hyderabad",
    baseDailyRate: 75000, weekendRate: 90000, minPrice: 60000,
    features: ["apple_carplay", "android_auto", "rear_camera", "push_start"],
    ratingAvg: "4.3", tripCount: 52, reviewCount: 40,
  }),

  // ═══════════════════════════════════════════════════════════════
  // CHENNAI
  // ═══════════════════════════════════════════════════════════════
  v({
    id: V_CHN_SWIFT, hostId: HOST_CHENNAI_ID,
    make: "Maruti Suzuki", model: "Swift", year: 2023, variant: "ZXi",
    vehicleType: "hatchback", fuelType: "petrol", transmission: "manual", seats: 5,
    color: "Pearl Arctic White", registrationNumber: "TN01AB1234",
    latitude: "13.0600000", longitude: "80.2500000",
    address: "T Nagar, Chennai", city: "Chennai",
    baseDailyRate: 70000, weekendRate: 85000, minPrice: 55000,
    features: ["apple_carplay", "android_auto", "rear_camera"],
    ratingAvg: "4.3", tripCount: 48, reviewCount: 38,
  }),
  v({
    id: V_CHN_CRETA, hostId: HOST_CHENNAI_ID,
    make: "Hyundai", model: "Creta", year: 2024, variant: "SX DCT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Titan Grey", registrationNumber: "TN02CD5678",
    latitude: "13.0827000", longitude: "80.2707000",
    address: "Anna Nagar, Chennai", city: "Chennai",
    baseDailyRate: 170000, weekendRate: 200000, minPrice: 140000,
    features: ["sunroof", "360_camera", "wireless_charging", "ventilated_seats"],
    ratingAvg: "4.5", tripCount: 35, reviewCount: 28,
  }),
  v({
    id: V_CHN_INNOVA, hostId: HOST_CHENNAI_ID,
    make: "Toyota", model: "Innova Crysta", year: 2023, variant: "VX AT",
    vehicleType: "mpv", fuelType: "diesel", transmission: "automatic", seats: 7,
    color: "Super White", registrationNumber: "TN03EF9012",
    latitude: "13.0400000", longitude: "80.2400000",
    address: "Mylapore, Chennai", city: "Chennai",
    baseDailyRate: 240000, weekendRate: 285000, minPrice: 200000,
    features: ["captain_seats", "rear_ac", "cruise_control"],
    ratingAvg: "4.6", tripCount: 60, reviewCount: 48,
  }),
  v({
    id: V_CHN_CITY, hostId: HOST_CHENNAI_ID,
    make: "Honda", model: "City", year: 2023, variant: "V CVT",
    vehicleType: "sedan", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Modern Steel Metallic", registrationNumber: "TN04GH3456",
    latitude: "13.1000000", longitude: "80.2800000",
    address: "Adyar, Chennai", city: "Chennai",
    baseDailyRate: 140000, weekendRate: 165000, minPrice: 115000,
    features: ["sunroof", "apple_carplay", "android_auto", "lane_watch_camera"],
    ratingAvg: "4.4", tripCount: 41, reviewCount: 32,
  }),
  v({
    id: V_CHN_ALTROZ, hostId: HOST_CHENNAI_ID,
    make: "Tata", model: "Altroz", year: 2024, variant: "XZ+ Lux DCA",
    vehicleType: "hatchback", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Harbour Blue", registrationNumber: "TN05IJ7890",
    latitude: "12.9800000", longitude: "80.2500000",
    address: "Velachery, Chennai", city: "Chennai",
    baseDailyRate: 68000, weekendRate: 82000, minPrice: 55000,
    features: ["apple_carplay", "android_auto", "rear_camera", "projector_headlamps"],
    ratingAvg: "4.2", tripCount: 29, reviewCount: 22,
  }),
  v({
    id: V_CHN_NEXON, hostId: HOST_CHENNAI_ID,
    make: "Tata", model: "Nexon", year: 2024, variant: "Fearless+ DCA",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Creative Ocean", registrationNumber: "TN06KL1234",
    latitude: "13.0100000", longitude: "80.2200000",
    address: "Guindy, Chennai", city: "Chennai",
    baseDailyRate: 130000, weekendRate: 155000, minPrice: 110000,
    features: ["sunroof", "ventilated_seats", "air_purifier", "360_camera"],
    ratingAvg: "4.4", tripCount: 26, reviewCount: 20,
  }),

  // ═══════════════════════════════════════════════════════════════
  // PUNE
  // ═══════════════════════════════════════════════════════════════
  v({
    id: V_PUN_BALENO, hostId: HOST_PUNE_ID,
    make: "Maruti Suzuki", model: "Baleno", year: 2024, variant: "Zeta AMT",
    vehicleType: "hatchback", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Luxe Beige", registrationNumber: "MH12AB1234",
    latitude: "18.5204000", longitude: "73.8567000",
    address: "Koregaon Park, Pune", city: "Pune",
    baseDailyRate: 78000, weekendRate: 92000, minPrice: 62000,
    features: ["heads_up_display", "apple_carplay", "android_auto", "rear_camera"],
    ratingAvg: "4.3", tripCount: 43, reviewCount: 34,
  }),
  v({
    id: V_PUN_CRETA, hostId: HOST_PUNE_ID,
    make: "Hyundai", model: "Creta", year: 2024, variant: "SX IVT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Abyss Black", registrationNumber: "MH12CD5678",
    latitude: "18.5600000", longitude: "73.9100000",
    address: "Viman Nagar, Pune", city: "Pune",
    baseDailyRate: 165000, weekendRate: 195000, minPrice: 135000,
    features: ["sunroof", "ventilated_seats", "360_camera", "wireless_charging"],
    ratingAvg: "4.5", tripCount: 37, reviewCount: 30,
  }),
  v({
    id: V_PUN_DZIRE, hostId: HOST_PUNE_ID,
    make: "Maruti Suzuki", model: "Dzire", year: 2023, variant: "ZXi AMT",
    vehicleType: "sedan", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Oxford Blue", registrationNumber: "MH12EF9012",
    latitude: "18.5000000", longitude: "73.8200000",
    address: "Deccan Gymkhana, Pune", city: "Pune",
    baseDailyRate: 82000, weekendRate: 98000, minPrice: 68000,
    features: ["apple_carplay", "android_auto", "rear_camera", "cruise_control"],
    ratingAvg: "4.2", tripCount: 56, reviewCount: 44,
  }),
  v({
    id: V_PUN_HECTOR, hostId: HOST_PUNE_ID,
    make: "MG", model: "Hector", year: 2024, variant: "Sharp CVT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Glaze Red", registrationNumber: "MH12GH3456",
    latitude: "18.5300000", longitude: "73.8800000",
    address: "Kalyani Nagar, Pune", city: "Pune",
    baseDailyRate: 185000, weekendRate: 220000, minPrice: 155000,
    features: ["panoramic_sunroof", "14_inch_touchscreen", "adas", "wireless_charging"],
    ratingAvg: "4.4", tripCount: 22, reviewCount: 17,
  }),
  v({
    id: V_PUN_I20, hostId: HOST_PUNE_ID,
    make: "Hyundai", model: "i20", year: 2024, variant: "Sportz IVT",
    vehicleType: "hatchback", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Starry Night", registrationNumber: "MH12IJ7890",
    latitude: "18.4800000", longitude: "73.8500000",
    address: "Sinhagad Road, Pune", city: "Pune",
    baseDailyRate: 82000, weekendRate: 98000, minPrice: 68000,
    features: ["sunroof", "wireless_charging", "connected_car"],
    ratingAvg: "4.3", tripCount: 34, reviewCount: 26,
  }),
  v({
    id: V_PUN_BREZZA, hostId: HOST_PUNE_ID,
    make: "Maruti Suzuki", model: "Brezza", year: 2024, variant: "ZXi+ AT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Brave Khaki", registrationNumber: "MH12KL1234",
    latitude: "18.5400000", longitude: "73.9300000",
    address: "Hadapsar, Pune", city: "Pune",
    baseDailyRate: 120000, weekendRate: 142000, minPrice: 100000,
    features: ["sunroof", "heads_up_display", "360_camera", "wireless_charging"],
    ratingAvg: "4.4", tripCount: 30, reviewCount: 24,
  }),

  // ═══════════════════════════════════════════════════════════════
  // JAIPUR
  // ═══════════════════════════════════════════════════════════════
  v({
    id: V_JAI_SWIFT, hostId: HOST_JAIPUR_ID,
    make: "Maruti Suzuki", model: "Swift", year: 2023, variant: "VXi",
    vehicleType: "hatchback", fuelType: "petrol", transmission: "manual", seats: 5,
    color: "Pearl Arctic White", registrationNumber: "RJ14AB1234",
    latitude: "26.9124000", longitude: "75.7873000",
    address: "C-Scheme, Jaipur", city: "Jaipur",
    baseDailyRate: 60000, weekendRate: 75000, minPrice: 50000,
    features: ["apple_carplay", "android_auto", "rear_camera"],
    ratingAvg: "4.2", tripCount: 55, reviewCount: 42,
  }),
  v({
    id: V_JAI_SCORPIO, hostId: HOST_JAIPUR_ID,
    make: "Mahindra", model: "Scorpio N", year: 2024, variant: "Z8 AT",
    vehicleType: "suv", fuelType: "diesel", transmission: "automatic", seats: 7,
    color: "Grand Canyon", registrationNumber: "RJ14CD5678",
    latitude: "26.9200000", longitude: "75.7800000",
    address: "Malviya Nagar, Jaipur", city: "Jaipur",
    baseDailyRate: 200000, weekendRate: 240000, minPrice: 170000,
    features: ["sunroof", "terrain_modes", "apple_carplay", "cruise_control"],
    ratingAvg: "4.5", tripCount: 28, reviewCount: 22,
  }),
  v({
    id: V_JAI_ERTIGA, hostId: HOST_JAIPUR_ID,
    make: "Maruti Suzuki", model: "Ertiga", year: 2023, variant: "ZXi AT",
    vehicleType: "mpv", fuelType: "petrol", transmission: "automatic", seats: 7,
    color: "Dignity Brown", registrationNumber: "RJ14EF9012",
    latitude: "26.9000000", longitude: "75.8000000",
    address: "Vaishali Nagar, Jaipur", city: "Jaipur",
    baseDailyRate: 125000, weekendRate: 150000, minPrice: 105000,
    features: ["rear_ac", "apple_carplay", "android_auto", "cruise_control"],
    ratingAvg: "4.4", tripCount: 44, reviewCount: 35,
  }),
  v({
    id: V_JAI_DZIRE, hostId: HOST_JAIPUR_ID,
    make: "Maruti Suzuki", model: "Dzire", year: 2024, variant: "ZXi AMT",
    vehicleType: "sedan", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Splendid Silver", registrationNumber: "RJ14GH3456",
    latitude: "26.8800000", longitude: "75.7600000",
    address: "Mansarovar, Jaipur", city: "Jaipur",
    baseDailyRate: 80000, weekendRate: 95000, minPrice: 65000,
    features: ["apple_carplay", "android_auto", "rear_camera", "cruise_control"],
    ratingAvg: "4.3", tripCount: 49, reviewCount: 38,
  }),
  v({
    id: V_JAI_INNOVA, hostId: HOST_JAIPUR_ID,
    make: "Toyota", model: "Innova Crysta", year: 2023, variant: "GX MT",
    vehicleType: "mpv", fuelType: "diesel", transmission: "manual", seats: 7,
    color: "Super White", registrationNumber: "RJ14IJ7890",
    latitude: "26.9300000", longitude: "75.7500000",
    address: "MI Road, Jaipur", city: "Jaipur",
    baseDailyRate: 220000, weekendRate: 260000, minPrice: 185000,
    features: ["captain_seats", "rear_ac", "cruise_control"],
    ratingAvg: "4.5", tripCount: 38, reviewCount: 30,
  }),

  // ═══════════════════════════════════════════════════════════════
  // KOCHI
  // ═══════════════════════════════════════════════════════════════
  v({
    id: V_KOC_SWIFT, hostId: HOST_KOCHI_ID,
    make: "Maruti Suzuki", model: "Swift", year: 2023, variant: "ZXi",
    vehicleType: "hatchback", fuelType: "petrol", transmission: "manual", seats: 5,
    color: "Solid Fire Red", registrationNumber: "KL07AB1234",
    latitude: "9.9312000", longitude: "76.2673000",
    address: "MG Road, Kochi", city: "Kochi",
    baseDailyRate: 65000, weekendRate: 80000, minPrice: 52000,
    features: ["apple_carplay", "android_auto", "rear_camera"],
    ratingAvg: "4.3", tripCount: 40, reviewCount: 32,
  }),
  v({
    id: V_KOC_CRETA, hostId: HOST_KOCHI_ID,
    make: "Hyundai", model: "Creta", year: 2024, variant: "SX IVT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Fiery Red", registrationNumber: "KL07CD5678",
    latitude: "9.9500000", longitude: "76.2800000",
    address: "Edappally, Kochi", city: "Kochi",
    baseDailyRate: 160000, weekendRate: 190000, minPrice: 135000,
    features: ["sunroof", "ventilated_seats", "360_camera", "bose_audio"],
    ratingAvg: "4.5", tripCount: 27, reviewCount: 21,
  }),
  v({
    id: V_KOC_INNOVA, hostId: HOST_KOCHI_ID,
    make: "Toyota", model: "Innova Crysta", year: 2023, variant: "VX AT",
    vehicleType: "mpv", fuelType: "diesel", transmission: "automatic", seats: 7,
    color: "Super White", registrationNumber: "KL07EF9012",
    latitude: "9.9200000", longitude: "76.2600000",
    address: "Marine Drive, Kochi", city: "Kochi",
    baseDailyRate: 240000, weekendRate: 285000, minPrice: 200000,
    features: ["captain_seats", "rear_ac", "cruise_control", "apple_carplay"],
    ratingAvg: "4.6", tripCount: 33, reviewCount: 26,
  }),
  v({
    id: V_KOC_I20, hostId: HOST_KOCHI_ID,
    make: "Hyundai", model: "i20", year: 2024, variant: "Sportz IVT",
    vehicleType: "hatchback", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Titan Grey", registrationNumber: "KL07GH3456",
    latitude: "9.9700000", longitude: "76.2900000",
    address: "Kakkanad, Kochi", city: "Kochi",
    baseDailyRate: 80000, weekendRate: 95000, minPrice: 65000,
    features: ["sunroof", "wireless_charging", "bose_audio"],
    ratingAvg: "4.3", tripCount: 22, reviewCount: 17,
  }),
  v({
    id: V_KOC_NEXON, hostId: HOST_KOCHI_ID,
    make: "Tata", model: "Nexon", year: 2024, variant: "Fearless+ AMT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Fearless Purple", registrationNumber: "KL07IJ7890",
    latitude: "9.9400000", longitude: "76.2500000",
    address: "Fort Kochi", city: "Kochi",
    baseDailyRate: 125000, weekendRate: 148000, minPrice: 105000,
    features: ["sunroof", "air_purifier", "ventilated_seats", "connected_car"],
    ratingAvg: "4.4", tripCount: 19, reviewCount: 15,
  }),

  // ═══════════════════════════════════════════════════════════════
  // KOLKATA
  // ═══════════════════════════════════════════════════════════════
  v({
    id: V_KOL_BALENO, hostId: HOST_KOLKATA_ID,
    make: "Maruti Suzuki", model: "Baleno", year: 2024, variant: "Alpha AMT",
    vehicleType: "hatchback", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Nexa Blue", registrationNumber: "WB06AB1234",
    latitude: "22.5726000", longitude: "88.3639000",
    address: "Salt Lake, Kolkata", city: "Kolkata",
    baseDailyRate: 72000, weekendRate: 88000, minPrice: 58000,
    features: ["heads_up_display", "apple_carplay", "android_auto", "rear_camera"],
    ratingAvg: "4.3", tripCount: 35, reviewCount: 27,
  }),
  v({
    id: V_KOL_CRETA, hostId: HOST_KOLKATA_ID,
    make: "Hyundai", model: "Creta", year: 2024, variant: "SX DCT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Atlas White", registrationNumber: "WB06CD5678",
    latitude: "22.5400000", longitude: "88.3500000",
    address: "Park Street, Kolkata", city: "Kolkata",
    baseDailyRate: 160000, weekendRate: 190000, minPrice: 130000,
    features: ["sunroof", "ventilated_seats", "360_camera", "wireless_charging"],
    ratingAvg: "4.5", tripCount: 28, reviewCount: 22,
  }),
  v({
    id: V_KOL_DZIRE, hostId: HOST_KOLKATA_ID,
    make: "Maruti Suzuki", model: "Dzire", year: 2023, variant: "ZXi AMT",
    vehicleType: "sedan", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Magma Grey", registrationNumber: "WB06EF9012",
    latitude: "22.5800000", longitude: "88.4000000",
    address: "New Town, Kolkata", city: "Kolkata",
    baseDailyRate: 78000, weekendRate: 92000, minPrice: 62000,
    features: ["apple_carplay", "android_auto", "rear_camera", "cruise_control"],
    ratingAvg: "4.2", tripCount: 42, reviewCount: 33,
  }),
  v({
    id: V_KOL_INNOVA, hostId: HOST_KOLKATA_ID,
    make: "Toyota", model: "Innova Crysta", year: 2023, variant: "GX AT",
    vehicleType: "mpv", fuelType: "diesel", transmission: "automatic", seats: 7,
    color: "Super White", registrationNumber: "WB06GH3456",
    latitude: "22.5500000", longitude: "88.3400000",
    address: "Esplanade, Kolkata", city: "Kolkata",
    baseDailyRate: 230000, weekendRate: 275000, minPrice: 190000,
    features: ["captain_seats", "rear_ac", "cruise_control"],
    ratingAvg: "4.5", tripCount: 30, reviewCount: 24,
  }),
  v({
    id: V_KOL_SELTOS, hostId: HOST_KOLKATA_ID,
    make: "Kia", model: "Seltos", year: 2024, variant: "HTX+ IVT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Gravity Grey", registrationNumber: "WB06IJ7890",
    latitude: "22.5600000", longitude: "88.3800000",
    address: "EM Bypass, Kolkata", city: "Kolkata",
    baseDailyRate: 155000, weekendRate: 185000, minPrice: 130000,
    features: ["sunroof", "ventilated_seats", "bose_audio", "360_camera"],
    ratingAvg: "4.4", tripCount: 20, reviewCount: 16,
  }),

  // ═══════════════════════════════════════════════════════════════
  // AHMEDABAD
  // ═══════════════════════════════════════════════════════════════
  v({
    id: V_AHM_SWIFT, hostId: HOST_AHMEDABAD_ID,
    make: "Maruti Suzuki", model: "Swift", year: 2024, variant: "ZXi",
    vehicleType: "hatchback", fuelType: "petrol", transmission: "manual", seats: 5,
    color: "Sizzling Red", registrationNumber: "GJ01AB1234",
    latitude: "23.0225000", longitude: "72.5714000",
    address: "CG Road, Ahmedabad", city: "Ahmedabad",
    baseDailyRate: 62000, weekendRate: 78000, minPrice: 50000,
    features: ["apple_carplay", "android_auto", "rear_camera"],
    ratingAvg: "4.2", tripCount: 46, reviewCount: 36,
  }),
  v({
    id: V_AHM_HARRIER, hostId: HOST_AHMEDABAD_ID,
    make: "Tata", model: "Harrier", year: 2024, variant: "Fearless+ AT",
    vehicleType: "suv", fuelType: "diesel", transmission: "automatic", seats: 5,
    color: "Ash Grey", registrationNumber: "GJ01CD5678",
    latitude: "23.0300000", longitude: "72.5800000",
    address: "SG Highway, Ahmedabad", city: "Ahmedabad",
    baseDailyRate: 195000, weekendRate: 230000, minPrice: 165000,
    features: ["sunroof", "jbl_audio", "360_camera", "adas"],
    ratingAvg: "4.5", tripCount: 24, reviewCount: 19,
  }),
  v({
    id: V_AHM_ERTIGA, hostId: HOST_AHMEDABAD_ID,
    make: "Maruti Suzuki", model: "Ertiga", year: 2023, variant: "ZXi+ AT",
    vehicleType: "mpv", fuelType: "petrol", transmission: "automatic", seats: 7,
    color: "Pearl Metallic Auburn Red", registrationNumber: "GJ01EF9012",
    latitude: "23.0100000", longitude: "72.5500000",
    address: "Navrangpura, Ahmedabad", city: "Ahmedabad",
    baseDailyRate: 130000, weekendRate: 155000, minPrice: 110000,
    features: ["rear_ac", "apple_carplay", "android_auto", "cruise_control"],
    ratingAvg: "4.4", tripCount: 39, reviewCount: 31,
  }),
  v({
    id: V_AHM_NEXON, hostId: HOST_AHMEDABAD_ID,
    make: "Tata", model: "Nexon", year: 2024, variant: "Creative+ AMT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Creative Ocean", registrationNumber: "GJ01GH3456",
    latitude: "23.0400000", longitude: "72.5900000",
    address: "Prahlad Nagar, Ahmedabad", city: "Ahmedabad",
    baseDailyRate: 120000, weekendRate: 142000, minPrice: 100000,
    features: ["sunroof", "air_purifier", "ventilated_seats", "connected_car"],
    ratingAvg: "4.3", tripCount: 31, reviewCount: 24,
  }),
  v({
    id: V_AHM_CITY, hostId: HOST_AHMEDABAD_ID,
    make: "Honda", model: "City", year: 2023, variant: "V CVT",
    vehicleType: "sedan", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Modern Steel Metallic", registrationNumber: "GJ01IJ7890",
    latitude: "23.0000000", longitude: "72.5600000",
    address: "Law Garden, Ahmedabad", city: "Ahmedabad",
    baseDailyRate: 135000, weekendRate: 160000, minPrice: 110000,
    features: ["sunroof", "apple_carplay", "lane_watch_camera"],
    ratingAvg: "4.4", tripCount: 33, reviewCount: 26,
  }),

  // ═══════════════════════════════════════════════════════════════
  // GOA
  // ═══════════════════════════════════════════════════════════════
  v({
    id: V_GOA_SWIFT, hostId: HOST_GOA_ID,
    make: "Maruti Suzuki", model: "Swift", year: 2024, variant: "ZXi AMT",
    vehicleType: "hatchback", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Pearl Arctic White", registrationNumber: "GA01AB1234",
    latitude: "15.4909000", longitude: "73.8278000",
    address: "Panaji City Centre, Goa", city: "Panaji",
    baseDailyRate: 75000, weekendRate: 95000, minPrice: 60000,
    features: ["apple_carplay", "android_auto", "rear_camera"],
    ratingAvg: "4.3", tripCount: 62, reviewCount: 48,
  }),
  v({
    id: V_GOA_CRETA, hostId: HOST_GOA_ID,
    make: "Hyundai", model: "Creta", year: 2024, variant: "SX DCT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Titan Grey", registrationNumber: "GA01CD5678",
    latitude: "15.5000000", longitude: "73.8300000",
    address: "Calangute Road, Goa", city: "Panaji",
    baseDailyRate: 180000, weekendRate: 220000, minPrice: 150000,
    features: ["sunroof", "ventilated_seats", "360_camera", "bose_audio"],
    ratingAvg: "4.6", tripCount: 38, reviewCount: 30,
  }),
  v({
    id: V_GOA_THAR, hostId: HOST_GOA_ID,
    make: "Mahindra", model: "Thar", year: 2024, variant: "LX AT 4x4",
    vehicleType: "suv", fuelType: "diesel", transmission: "automatic", seats: 4,
    color: "Galaxy Grey", registrationNumber: "GA01EF9012",
    latitude: "15.4800000", longitude: "73.8100000",
    address: "Miramar Beach Road, Goa", city: "Panaji",
    baseDailyRate: 250000, weekendRate: 310000, minPrice: 210000,
    features: ["4wd", "removable_roof", "terrain_modes", "touchscreen"],
    ratingAvg: "4.8", tripCount: 45, reviewCount: 38,
  }),
  v({
    id: V_GOA_ALTROZ, hostId: HOST_GOA_ID,
    make: "Tata", model: "Altroz", year: 2023, variant: "XZ DCA",
    vehicleType: "hatchback", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Downtown Red", registrationNumber: "GA02GH3456",
    latitude: "15.5100000", longitude: "73.7700000",
    address: "Mapusa, Goa", city: "Panaji",
    baseDailyRate: 65000, weekendRate: 82000, minPrice: 52000,
    features: ["apple_carplay", "android_auto", "rear_camera"],
    ratingAvg: "4.1", tripCount: 28, reviewCount: 20,
  }),
  v({
    id: V_GOA_ERTIGA, hostId: HOST_GOA_ID,
    make: "Maruti Suzuki", model: "Ertiga", year: 2024, variant: "ZXi+ AT",
    vehicleType: "mpv", fuelType: "petrol", transmission: "automatic", seats: 7,
    color: "Dignity Brown", registrationNumber: "GA01IJ7890",
    latitude: "15.4700000", longitude: "73.8400000",
    address: "Dona Paula, Goa", city: "Panaji",
    baseDailyRate: 145000, weekendRate: 175000, minPrice: 120000,
    features: ["rear_ac", "apple_carplay", "android_auto", "cruise_control"],
    ratingAvg: "4.4", tripCount: 34, reviewCount: 27,
  }),

  // ═══════════════════════════════════════════════════════════════
  // LUCKNOW
  // ═══════════════════════════════════════════════════════════════
  v({
    id: V_LKO_SWIFT, hostId: HOST_LUCKNOW_ID,
    make: "Maruti Suzuki", model: "Swift", year: 2023, variant: "VXi",
    vehicleType: "hatchback", fuelType: "petrol", transmission: "manual", seats: 5,
    color: "Solid Fire Red", registrationNumber: "UP32AB1234",
    latitude: "26.8467000", longitude: "80.9462000",
    address: "Hazratganj, Lucknow", city: "Lucknow",
    baseDailyRate: 55000, weekendRate: 68000, minPrice: 45000,
    features: ["apple_carplay", "android_auto", "rear_camera"],
    ratingAvg: "4.2", tripCount: 38, reviewCount: 30,
  }),
  v({
    id: V_LKO_CRETA, hostId: HOST_LUCKNOW_ID,
    make: "Hyundai", model: "Creta", year: 2024, variant: "SX IVT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Atlas White", registrationNumber: "UP32CD5678",
    latitude: "26.8500000", longitude: "80.9500000",
    address: "Gomti Nagar, Lucknow", city: "Lucknow",
    baseDailyRate: 155000, weekendRate: 185000, minPrice: 130000,
    features: ["sunroof", "ventilated_seats", "360_camera"],
    ratingAvg: "4.4", tripCount: 22, reviewCount: 17,
  }),
  v({
    id: V_LKO_DZIRE, hostId: HOST_LUCKNOW_ID,
    make: "Maruti Suzuki", model: "Dzire", year: 2023, variant: "ZXi AMT",
    vehicleType: "sedan", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Oxford Blue", registrationNumber: "UP32EF9012",
    latitude: "26.8600000", longitude: "80.9300000",
    address: "Alambagh, Lucknow", city: "Lucknow",
    baseDailyRate: 75000, weekendRate: 90000, minPrice: 62000,
    features: ["apple_carplay", "android_auto", "rear_camera", "cruise_control"],
    ratingAvg: "4.2", tripCount: 44, reviewCount: 35,
  }),
  v({
    id: V_LKO_INNOVA, hostId: HOST_LUCKNOW_ID,
    make: "Toyota", model: "Innova Crysta", year: 2023, variant: "GX AT",
    vehicleType: "mpv", fuelType: "diesel", transmission: "automatic", seats: 7,
    color: "Super White", registrationNumber: "UP32GH3456",
    latitude: "26.8400000", longitude: "80.9600000",
    address: "Vibhuti Khand, Lucknow", city: "Lucknow",
    baseDailyRate: 225000, weekendRate: 265000, minPrice: 185000,
    features: ["captain_seats", "rear_ac", "cruise_control"],
    ratingAvg: "4.5", tripCount: 29, reviewCount: 23,
  }),

  // ═══════════════════════════════════════════════════════════════
  // CHANDIGARH
  // ═══════════════════════════════════════════════════════════════
  v({
    id: V_CHD_SELTOS, hostId: HOST_CHANDIGARH_ID,
    make: "Kia", model: "Seltos", year: 2024, variant: "HTX+ IVT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Pewter Olive", registrationNumber: "CH01AB1234",
    latitude: "30.7333000", longitude: "76.7794000",
    address: "Sector 17, Chandigarh", city: "Chandigarh",
    baseDailyRate: 160000, weekendRate: 190000, minPrice: 135000,
    features: ["sunroof", "ventilated_seats", "bose_audio", "360_camera"],
    ratingAvg: "4.5", tripCount: 25, reviewCount: 20,
  }),
  v({
    id: V_CHD_CRETA, hostId: HOST_CHANDIGARH_ID,
    make: "Hyundai", model: "Creta", year: 2024, variant: "SX(O) DCT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Fiery Red", registrationNumber: "CH01CD5678",
    latitude: "30.7400000", longitude: "76.7700000",
    address: "Sector 35, Chandigarh", city: "Chandigarh",
    baseDailyRate: 175000, weekendRate: 205000, minPrice: 145000,
    features: ["sunroof", "360_camera", "adas", "ventilated_seats", "bose_audio"],
    ratingAvg: "4.6", tripCount: 20, reviewCount: 16,
  }),
  v({
    id: V_CHD_SWIFT, hostId: HOST_CHANDIGARH_ID,
    make: "Maruti Suzuki", model: "Swift", year: 2024, variant: "ZXi AMT",
    vehicleType: "hatchback", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Pearl Arctic White", registrationNumber: "CH01EF9012",
    latitude: "30.7200000", longitude: "76.7900000",
    address: "Sector 22, Chandigarh", city: "Chandigarh",
    baseDailyRate: 72000, weekendRate: 88000, minPrice: 58000,
    features: ["apple_carplay", "android_auto", "rear_camera", "push_start"],
    ratingAvg: "4.3", tripCount: 33, reviewCount: 26,
  }),
  v({
    id: V_CHD_FORTUNER, hostId: HOST_CHANDIGARH_ID,
    make: "Toyota", model: "Fortuner", year: 2024, variant: "Legender AT",
    vehicleType: "luxury", fuelType: "diesel", transmission: "automatic", seats: 7,
    color: "Attitude Black", registrationNumber: "CH01GH3456",
    latitude: "30.7500000", longitude: "76.7600000",
    address: "Sector 8, Chandigarh", city: "Chandigarh",
    baseDailyRate: 420000, weekendRate: 500000, minPrice: 360000,
    features: ["4wd", "jbl_audio", "cooled_seats", "360_camera"],
    ratingAvg: "4.8", tripCount: 12, reviewCount: 10,
  }),

  // ═══════════════════════════════════════════════════════════════
  // COIMBATORE
  // ═══════════════════════════════════════════════════════════════
  v({
    id: V_CBE_SWIFT, hostId: HOST_COIMBATORE_ID,
    make: "Maruti Suzuki", model: "Swift", year: 2023, variant: "VXi",
    vehicleType: "hatchback", fuelType: "petrol", transmission: "manual", seats: 5,
    color: "Solid Fire Red", registrationNumber: "TN38AB1234",
    latitude: "11.0168000", longitude: "76.9558000",
    address: "RS Puram, Coimbatore", city: "Coimbatore",
    baseDailyRate: 58000, weekendRate: 72000, minPrice: 48000,
    features: ["apple_carplay", "android_auto", "rear_camera"],
    ratingAvg: "4.2", tripCount: 32, reviewCount: 25,
  }),
  v({
    id: V_CBE_CRETA, hostId: HOST_COIMBATORE_ID,
    make: "Hyundai", model: "Creta", year: 2024, variant: "SX IVT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Atlas White", registrationNumber: "TN38CD5678",
    latitude: "11.0200000", longitude: "76.9600000",
    address: "Gandhipuram, Coimbatore", city: "Coimbatore",
    baseDailyRate: 155000, weekendRate: 185000, minPrice: 130000,
    features: ["sunroof", "ventilated_seats", "wireless_charging"],
    ratingAvg: "4.4", tripCount: 19, reviewCount: 15,
  }),
  v({
    id: V_CBE_INNOVA, hostId: HOST_COIMBATORE_ID,
    make: "Toyota", model: "Innova Crysta", year: 2023, variant: "GX AT",
    vehicleType: "mpv", fuelType: "diesel", transmission: "automatic", seats: 7,
    color: "Super White", registrationNumber: "TN38EF9012",
    latitude: "11.0000000", longitude: "76.9400000",
    address: "Peelamedu, Coimbatore", city: "Coimbatore",
    baseDailyRate: 230000, weekendRate: 270000, minPrice: 190000,
    features: ["captain_seats", "rear_ac", "cruise_control"],
    ratingAvg: "4.5", tripCount: 26, reviewCount: 20,
  }),

  // ═══════════════════════════════════════════════════════════════
  // SMALLER CITIES (2-3 vehicles each)
  // ═══════════════════════════════════════════════════════════════

  // Mysore
  v({
    id: V_MYS_SWIFT, hostId: DEMO_HOST_ID,
    make: "Maruti Suzuki", model: "Swift", year: 2023, variant: "VXi",
    vehicleType: "hatchback", fuelType: "petrol", transmission: "manual", seats: 5,
    registrationNumber: "KA09AB1234",
    latitude: "12.2958000", longitude: "76.6394000",
    address: "Devaraja Mohalla, Mysore", city: "Mysore",
    baseDailyRate: 55000, weekendRate: 68000, minPrice: 45000,
    ratingAvg: "4.2", tripCount: 28, reviewCount: 22,
  }),
  v({
    id: V_MYS_CRETA, hostId: DEMO_HOST_ID,
    make: "Hyundai", model: "Creta", year: 2024, variant: "SX IVT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    registrationNumber: "KA09CD5678",
    latitude: "12.3000000", longitude: "76.6500000",
    address: "Vijayanagar, Mysore", city: "Mysore",
    baseDailyRate: 150000, weekendRate: 178000, minPrice: 125000,
    ratingAvg: "4.4", tripCount: 18, reviewCount: 14,
  }),
  v({
    id: V_MYS_ERTIGA, hostId: DEMO_HOST_ID,
    make: "Maruti Suzuki", model: "Ertiga", year: 2023, variant: "ZXi AT",
    vehicleType: "mpv", fuelType: "petrol", transmission: "automatic", seats: 7,
    registrationNumber: "KA09EF9012",
    latitude: "12.2800000", longitude: "76.6300000",
    address: "Kuvempunagar, Mysore", city: "Mysore",
    baseDailyRate: 120000, weekendRate: 142000, minPrice: 100000,
    ratingAvg: "4.3", tripCount: 24, reviewCount: 19,
  }),

  // Gurgaon
  v({
    id: V_GGN_CRETA, hostId: HOST_DEL2_ID,
    make: "Hyundai", model: "Creta", year: 2024, variant: "SX(O) DCT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    registrationNumber: "HR26AB1234",
    latitude: "28.4595000", longitude: "77.0266000",
    address: "DLF Cyber City, Gurgaon", city: "Gurgaon",
    baseDailyRate: 180000, weekendRate: 210000, minPrice: 150000,
    features: ["sunroof", "360_camera", "adas", "ventilated_seats"],
    ratingAvg: "4.6", tripCount: 35, reviewCount: 28,
  }),
  v({
    id: V_GGN_FORTUNER, hostId: HOST_DEL2_ID,
    make: "Toyota", model: "Fortuner", year: 2024, variant: "Legender AT",
    vehicleType: "luxury", fuelType: "diesel", transmission: "automatic", seats: 7,
    registrationNumber: "HR26CD5678",
    latitude: "28.4700000", longitude: "77.0300000",
    address: "Golf Course Road, Gurgaon", city: "Gurgaon",
    baseDailyRate: 460000, weekendRate: 540000, minPrice: 390000,
    features: ["4wd", "jbl_audio", "cooled_seats", "360_camera"],
    ratingAvg: "4.8", tripCount: 16, reviewCount: 13,
  }),
  v({
    id: V_GGN_I20, hostId: HOST_DELHI_ID,
    make: "Hyundai", model: "i20", year: 2024, variant: "Asta(O) DCT",
    vehicleType: "hatchback", fuelType: "petrol", transmission: "automatic", seats: 5,
    registrationNumber: "HR26EF9012",
    latitude: "28.4500000", longitude: "77.0400000",
    address: "Sector 29, Gurgaon", city: "Gurgaon",
    baseDailyRate: 88000, weekendRate: 105000, minPrice: 72000,
    features: ["sunroof", "wireless_charging", "bose_audio", "connected_car"],
    ratingAvg: "4.4", tripCount: 27, reviewCount: 21,
  }),

  // Noida
  v({
    id: V_NOI_SWIFT, hostId: HOST_DELHI_ID,
    make: "Maruti Suzuki", model: "Swift", year: 2024, variant: "ZXi AMT",
    vehicleType: "hatchback", fuelType: "petrol", transmission: "automatic", seats: 5,
    registrationNumber: "UP16AB1234",
    latitude: "28.5355000", longitude: "77.3910000",
    address: "Sector 18, Noida", city: "Noida",
    baseDailyRate: 78000, weekendRate: 92000, minPrice: 62000,
    ratingAvg: "4.3", tripCount: 40, reviewCount: 32,
  }),
  v({
    id: V_NOI_SELTOS, hostId: HOST_DEL2_ID,
    make: "Kia", model: "Seltos", year: 2024, variant: "HTX+ IVT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    registrationNumber: "UP16CD5678",
    latitude: "28.5400000", longitude: "77.3500000",
    address: "Sector 62, Noida", city: "Noida",
    baseDailyRate: 162000, weekendRate: 192000, minPrice: 135000,
    features: ["sunroof", "ventilated_seats", "bose_audio"],
    ratingAvg: "4.4", tripCount: 23, reviewCount: 18,
  }),
  v({
    id: V_NOI_VERNA, hostId: HOST_DEL2_ID,
    make: "Hyundai", model: "Verna", year: 2024, variant: "SX DCT",
    vehicleType: "sedan", fuelType: "petrol", transmission: "automatic", seats: 5,
    registrationNumber: "UP16EF9012",
    latitude: "28.5500000", longitude: "77.3700000",
    address: "Sector 44, Noida", city: "Noida",
    baseDailyRate: 148000, weekendRate: 175000, minPrice: 125000,
    features: ["sunroof", "ventilated_seats", "adas", "wireless_charging"],
    ratingAvg: "4.5", tripCount: 18, reviewCount: 14,
  }),

  // Udaipur
  v({
    id: V_UDR_SWIFT, hostId: HOST_JAIPUR_ID,
    make: "Maruti Suzuki", model: "Swift", year: 2023, variant: "VXi",
    vehicleType: "hatchback", fuelType: "petrol", transmission: "manual", seats: 5,
    registrationNumber: "RJ27AB1234",
    latitude: "24.5854000", longitude: "73.7125000",
    address: "Fatehpura, Udaipur", city: "Udaipur",
    baseDailyRate: 58000, weekendRate: 72000, minPrice: 48000,
    ratingAvg: "4.2", tripCount: 35, reviewCount: 27,
  }),
  v({
    id: V_UDR_SCORPIO, hostId: HOST_JAIPUR_ID,
    make: "Mahindra", model: "Scorpio N", year: 2024, variant: "Z6 MT",
    vehicleType: "suv", fuelType: "diesel", transmission: "manual", seats: 7,
    registrationNumber: "RJ27CD5678",
    latitude: "24.5900000", longitude: "73.7200000",
    address: "Hiran Magri, Udaipur", city: "Udaipur",
    baseDailyRate: 180000, weekendRate: 215000, minPrice: 150000,
    features: ["terrain_modes", "sunroof", "apple_carplay"],
    ratingAvg: "4.4", tripCount: 20, reviewCount: 16,
  }),

  // Surat
  v({
    id: V_SUR_BALENO, hostId: HOST_AHMEDABAD_ID,
    make: "Maruti Suzuki", model: "Baleno", year: 2024, variant: "Alpha AMT",
    vehicleType: "hatchback", fuelType: "petrol", transmission: "automatic", seats: 5,
    registrationNumber: "GJ05AB1234",
    latitude: "21.1702000", longitude: "72.8311000",
    address: "Adajan, Surat", city: "Surat",
    baseDailyRate: 68000, weekendRate: 82000, minPrice: 55000,
    ratingAvg: "4.2", tripCount: 30, reviewCount: 24,
  }),
  v({
    id: V_SUR_CRETA, hostId: HOST_AHMEDABAD_ID,
    make: "Hyundai", model: "Creta", year: 2024, variant: "SX IVT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    registrationNumber: "GJ05CD5678",
    latitude: "21.1800000", longitude: "72.8400000",
    address: "Vesu, Surat", city: "Surat",
    baseDailyRate: 155000, weekendRate: 185000, minPrice: 130000,
    ratingAvg: "4.4", tripCount: 21, reviewCount: 17,
  }),

  // Varanasi
  v({
    id: V_VAR_DZIRE, hostId: HOST_LUCKNOW_ID,
    make: "Maruti Suzuki", model: "Dzire", year: 2023, variant: "ZXi AMT",
    vehicleType: "sedan", fuelType: "petrol", transmission: "automatic", seats: 5,
    registrationNumber: "UP65AB1234",
    latitude: "25.3176000", longitude: "82.9739000",
    address: "Sigra, Varanasi", city: "Varanasi",
    baseDailyRate: 72000, weekendRate: 88000, minPrice: 58000,
    ratingAvg: "4.2", tripCount: 36, reviewCount: 28,
  }),
  v({
    id: V_VAR_ERTIGA, hostId: HOST_LUCKNOW_ID,
    make: "Maruti Suzuki", model: "Ertiga", year: 2023, variant: "ZXi AT",
    vehicleType: "mpv", fuelType: "petrol", transmission: "automatic", seats: 7,
    registrationNumber: "UP65CD5678",
    latitude: "25.3200000", longitude: "82.9800000",
    address: "Lanka, Varanasi", city: "Varanasi",
    baseDailyRate: 118000, weekendRate: 140000, minPrice: 98000,
    ratingAvg: "4.3", tripCount: 28, reviewCount: 22,
  }),

  // Trivandrum
  v({
    id: V_TVM_SWIFT, hostId: HOST_KOCHI_ID,
    make: "Maruti Suzuki", model: "Swift", year: 2023, variant: "ZXi",
    vehicleType: "hatchback", fuelType: "petrol", transmission: "manual", seats: 5,
    registrationNumber: "KL01AB1234",
    latitude: "8.5241000", longitude: "76.9366000",
    address: "Kowdiar, Trivandrum", city: "Trivandrum",
    baseDailyRate: 62000, weekendRate: 78000, minPrice: 50000,
    ratingAvg: "4.2", tripCount: 30, reviewCount: 24,
  }),
  v({
    id: V_TVM_CRETA, hostId: HOST_KOCHI_ID,
    make: "Hyundai", model: "Creta", year: 2024, variant: "SX IVT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    registrationNumber: "KL01CD5678",
    latitude: "8.5300000", longitude: "76.9400000",
    address: "Pattom, Trivandrum", city: "Trivandrum",
    baseDailyRate: 155000, weekendRate: 185000, minPrice: 130000,
    ratingAvg: "4.4", tripCount: 18, reviewCount: 14,
  }),

  // Warangal
  v({
    id: V_WGL_SWIFT, hostId: HOST_HYDERABAD_ID,
    make: "Maruti Suzuki", model: "Swift", year: 2023, variant: "VXi",
    vehicleType: "hatchback", fuelType: "petrol", transmission: "manual", seats: 5,
    registrationNumber: "TS12AB1234",
    latitude: "17.9784000", longitude: "79.5941000",
    address: "Hanamkonda, Warangal", city: "Warangal",
    baseDailyRate: 50000, weekendRate: 62000, minPrice: 42000,
    ratingAvg: "4.1", tripCount: 22, reviewCount: 17,
  }),

  // Hubli
  v({
    id: V_HBL_SWIFT, hostId: DEMO_HOST_ID,
    make: "Maruti Suzuki", model: "Swift", year: 2023, variant: "VXi",
    vehicleType: "hatchback", fuelType: "petrol", transmission: "manual", seats: 5,
    registrationNumber: "KA25AB1234",
    latitude: "15.3647000", longitude: "75.1240000",
    address: "Vidyanagar, Hubli", city: "Hubli",
    baseDailyRate: 50000, weekendRate: 62000, minPrice: 42000,
    ratingAvg: "4.1", tripCount: 25, reviewCount: 20,
  }),
  v({
    id: V_HBL_INNOVA, hostId: DEMO_HOST_ID,
    make: "Toyota", model: "Innova Crysta", year: 2023, variant: "GX MT",
    vehicleType: "mpv", fuelType: "diesel", transmission: "manual", seats: 7,
    registrationNumber: "KA25CD5678",
    latitude: "15.3700000", longitude: "75.1300000",
    address: "Deshpande Nagar, Hubli", city: "Hubli",
    baseDailyRate: 210000, weekendRate: 248000, minPrice: 175000,
    ratingAvg: "4.4", tripCount: 18, reviewCount: 14,
  }),

  // Mangalore
  v({
    id: V_MNG_SWIFT, hostId: DEMO_HOST_ID,
    make: "Maruti Suzuki", model: "Swift", year: 2024, variant: "ZXi",
    vehicleType: "hatchback", fuelType: "petrol", transmission: "manual", seats: 5,
    registrationNumber: "KA19AB1234",
    latitude: "12.9141000", longitude: "74.8560000",
    address: "Hampankatta, Mangalore", city: "Mangalore",
    baseDailyRate: 58000, weekendRate: 72000, minPrice: 48000,
    ratingAvg: "4.2", tripCount: 30, reviewCount: 24,
  }),
  v({
    id: V_MNG_CRETA, hostId: DEMO_HOST_ID,
    make: "Hyundai", model: "Creta", year: 2024, variant: "SX IVT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    registrationNumber: "KA19CD5678",
    latitude: "12.9200000", longitude: "74.8600000",
    address: "Bejai, Mangalore", city: "Mangalore",
    baseDailyRate: 155000, weekendRate: 185000, minPrice: 130000,
    ratingAvg: "4.4", tripCount: 20, reviewCount: 16,
  }),

  // Nashik
  v({
    id: V_NSK_BALENO, hostId: HOST_MUMBAI_ID,
    make: "Maruti Suzuki", model: "Baleno", year: 2024, variant: "Alpha AMT",
    vehicleType: "hatchback", fuelType: "petrol", transmission: "automatic", seats: 5,
    registrationNumber: "MH15AB1234",
    latitude: "19.9975000", longitude: "73.7898000",
    address: "College Road, Nashik", city: "Nashik",
    baseDailyRate: 70000, weekendRate: 85000, minPrice: 58000,
    ratingAvg: "4.2", tripCount: 26, reviewCount: 20,
  }),
  v({
    id: V_NSK_BREZZA, hostId: HOST_MUMBAI_ID,
    make: "Maruti Suzuki", model: "Brezza", year: 2024, variant: "ZXi+ AT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    registrationNumber: "MH15CD5678",
    latitude: "20.0000000", longitude: "73.7800000",
    address: "Gangapur Road, Nashik", city: "Nashik",
    baseDailyRate: 118000, weekendRate: 140000, minPrice: 98000,
    ratingAvg: "4.3", tripCount: 22, reviewCount: 17,
  }),

  // Nagpur
  v({
    id: V_NGP_SWIFT, hostId: HOST_MUMBAI_ID,
    make: "Maruti Suzuki", model: "Swift", year: 2024, variant: "ZXi AMT",
    vehicleType: "hatchback", fuelType: "petrol", transmission: "automatic", seats: 5,
    registrationNumber: "MH31AB1234",
    latitude: "21.1458000", longitude: "79.0882000",
    address: "Dharampeth, Nagpur", city: "Nagpur",
    baseDailyRate: 65000, weekendRate: 78000, minPrice: 52000,
    ratingAvg: "4.2", tripCount: 32, reviewCount: 25,
  }),
  v({
    id: V_NGP_CRETA, hostId: HOST_MUMBAI_ID,
    make: "Hyundai", model: "Creta", year: 2024, variant: "SX IVT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    registrationNumber: "MH31CD5678",
    latitude: "21.1500000", longitude: "79.0900000",
    address: "Sadar, Nagpur", city: "Nagpur",
    baseDailyRate: 155000, weekendRate: 185000, minPrice: 130000,
    ratingAvg: "4.4", tripCount: 19, reviewCount: 15,
  }),

  // Madurai
  v({
    id: V_MDU_SWIFT, hostId: HOST_CHENNAI_ID,
    make: "Maruti Suzuki", model: "Swift", year: 2023, variant: "VXi",
    vehicleType: "hatchback", fuelType: "petrol", transmission: "manual", seats: 5,
    registrationNumber: "TN58AB1234",
    latitude: "9.9252000", longitude: "78.1198000",
    address: "KK Nagar, Madurai", city: "Madurai",
    baseDailyRate: 55000, weekendRate: 68000, minPrice: 45000,
    ratingAvg: "4.1", tripCount: 28, reviewCount: 22,
  }),
  v({
    id: V_MDU_INNOVA, hostId: HOST_CHENNAI_ID,
    make: "Toyota", model: "Innova Crysta", year: 2023, variant: "GX MT",
    vehicleType: "mpv", fuelType: "diesel", transmission: "manual", seats: 7,
    registrationNumber: "TN58CD5678",
    latitude: "9.9300000", longitude: "78.1200000",
    address: "Anna Nagar, Madurai", city: "Madurai",
    baseDailyRate: 215000, weekendRate: 255000, minPrice: 180000,
    ratingAvg: "4.4", tripCount: 24, reviewCount: 19,
  }),

  // Bhopal
  v({
    id: V_BPL_SWIFT, hostId: HOST_LUCKNOW_ID,
    make: "Maruti Suzuki", model: "Swift", year: 2023, variant: "ZXi",
    vehicleType: "hatchback", fuelType: "petrol", transmission: "manual", seats: 5,
    registrationNumber: "MP04AB1234",
    latitude: "23.2599000", longitude: "77.4126000",
    address: "MP Nagar, Bhopal", city: "Bhopal",
    baseDailyRate: 55000, weekendRate: 68000, minPrice: 45000,
    ratingAvg: "4.2", tripCount: 26, reviewCount: 20,
  }),
  v({
    id: V_BPL_CRETA, hostId: HOST_LUCKNOW_ID,
    make: "Hyundai", model: "Creta", year: 2024, variant: "SX IVT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    registrationNumber: "MP04CD5678",
    latitude: "23.2600000", longitude: "77.4200000",
    address: "Arera Colony, Bhopal", city: "Bhopal",
    baseDailyRate: 150000, weekendRate: 178000, minPrice: 125000,
    ratingAvg: "4.3", tripCount: 18, reviewCount: 14,
  }),

  // Indore
  v({
    id: V_IDR_BALENO, hostId: HOST_LUCKNOW_ID,
    make: "Maruti Suzuki", model: "Baleno", year: 2024, variant: "Alpha AMT",
    vehicleType: "hatchback", fuelType: "petrol", transmission: "automatic", seats: 5,
    registrationNumber: "MP09AB1234",
    latitude: "22.7196000", longitude: "75.8577000",
    address: "Vijay Nagar, Indore", city: "Indore",
    baseDailyRate: 65000, weekendRate: 78000, minPrice: 52000,
    ratingAvg: "4.2", tripCount: 30, reviewCount: 24,
  }),
  v({
    id: V_IDR_BREZZA, hostId: HOST_LUCKNOW_ID,
    make: "Maruti Suzuki", model: "Brezza", year: 2024, variant: "ZXi+ AT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    registrationNumber: "MP09CD5678",
    latitude: "22.7200000", longitude: "75.8600000",
    address: "Palasia, Indore", city: "Indore",
    baseDailyRate: 115000, weekendRate: 138000, minPrice: 95000,
    ratingAvg: "4.3", tripCount: 22, reviewCount: 17,
  }),

  // Amritsar
  v({
    id: V_AMR_SWIFT, hostId: HOST_CHANDIGARH_ID,
    make: "Maruti Suzuki", model: "Swift", year: 2023, variant: "VXi",
    vehicleType: "hatchback", fuelType: "petrol", transmission: "manual", seats: 5,
    registrationNumber: "PB02AB1234",
    latitude: "31.6340000", longitude: "74.8723000",
    address: "Lawrence Road, Amritsar", city: "Amritsar",
    baseDailyRate: 55000, weekendRate: 68000, minPrice: 45000,
    ratingAvg: "4.2", tripCount: 32, reviewCount: 25,
  }),
  v({
    id: V_AMR_INNOVA, hostId: HOST_CHANDIGARH_ID,
    make: "Toyota", model: "Innova Crysta", year: 2023, variant: "GX AT",
    vehicleType: "mpv", fuelType: "diesel", transmission: "automatic", seats: 7,
    registrationNumber: "PB02CD5678",
    latitude: "31.6400000", longitude: "74.8700000",
    address: "Mall Road, Amritsar", city: "Amritsar",
    baseDailyRate: 220000, weekendRate: 260000, minPrice: 185000,
    ratingAvg: "4.5", tripCount: 24, reviewCount: 19,
  }),

  // Siliguri
  v({
    id: V_SLG_SWIFT, hostId: HOST_KOLKATA_ID,
    make: "Maruti Suzuki", model: "Swift", year: 2023, variant: "VXi",
    vehicleType: "hatchback", fuelType: "petrol", transmission: "manual", seats: 5,
    registrationNumber: "WB73AB1234",
    latitude: "26.7271000", longitude: "88.3953000",
    address: "Hill Cart Road, Siliguri", city: "Siliguri",
    baseDailyRate: 52000, weekendRate: 65000, minPrice: 42000,
    ratingAvg: "4.1", tripCount: 20, reviewCount: 16,
  }),

  // Vadodara
  v({
    id: V_VDR_BALENO, hostId: HOST_AHMEDABAD_ID,
    make: "Maruti Suzuki", model: "Baleno", year: 2024, variant: "Zeta AMT",
    vehicleType: "hatchback", fuelType: "petrol", transmission: "automatic", seats: 5,
    registrationNumber: "GJ06AB1234",
    latitude: "22.3072000", longitude: "73.1812000",
    address: "Alkapuri, Vadodara", city: "Vadodara",
    baseDailyRate: 65000, weekendRate: 78000, minPrice: 52000,
    ratingAvg: "4.2", tripCount: 25, reviewCount: 20,
  }),
  v({
    id: V_VDR_CRETA, hostId: HOST_AHMEDABAD_ID,
    make: "Hyundai", model: "Creta", year: 2024, variant: "SX IVT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    registrationNumber: "GJ06CD5678",
    latitude: "22.3100000", longitude: "73.1900000",
    address: "Gotri, Vadodara", city: "Vadodara",
    baseDailyRate: 150000, weekendRate: 178000, minPrice: 125000,
    ratingAvg: "4.3", tripCount: 17, reviewCount: 13,
  }),

  // Agra
  v({
    id: V_AGR_DZIRE, hostId: HOST_LUCKNOW_ID,
    make: "Maruti Suzuki", model: "Dzire", year: 2023, variant: "ZXi AMT",
    vehicleType: "sedan", fuelType: "petrol", transmission: "automatic", seats: 5,
    registrationNumber: "UP80AB1234",
    latitude: "27.1767000", longitude: "78.0081000",
    address: "Sanjay Place, Agra", city: "Agra",
    baseDailyRate: 72000, weekendRate: 88000, minPrice: 58000,
    ratingAvg: "4.2", tripCount: 38, reviewCount: 30,
  }),
  v({
    id: V_AGR_ERTIGA, hostId: HOST_LUCKNOW_ID,
    make: "Maruti Suzuki", model: "Ertiga", year: 2023, variant: "ZXi AT",
    vehicleType: "mpv", fuelType: "petrol", transmission: "automatic", seats: 7,
    registrationNumber: "UP80CD5678",
    latitude: "27.1800000", longitude: "78.0100000",
    address: "Tajganj, Agra", city: "Agra",
    baseDailyRate: 120000, weekendRate: 145000, minPrice: 100000,
    ratingAvg: "4.4", tripCount: 32, reviewCount: 25,
  }),

  // Jodhpur
  v({
    id: V_JDH_SCORPIO, hostId: HOST_JAIPUR_ID,
    make: "Mahindra", model: "Scorpio N", year: 2024, variant: "Z6 MT",
    vehicleType: "suv", fuelType: "diesel", transmission: "manual", seats: 7,
    registrationNumber: "RJ19AB1234",
    latitude: "26.2389000", longitude: "73.0243000",
    address: "Sardarpura, Jodhpur", city: "Jodhpur",
    baseDailyRate: 180000, weekendRate: 215000, minPrice: 150000,
    features: ["terrain_modes", "sunroof", "apple_carplay"],
    ratingAvg: "4.4", tripCount: 22, reviewCount: 17,
  }),
  v({
    id: V_JDH_SWIFT, hostId: HOST_JAIPUR_ID,
    make: "Maruti Suzuki", model: "Swift", year: 2023, variant: "VXi",
    vehicleType: "hatchback", fuelType: "petrol", transmission: "manual", seats: 5,
    registrationNumber: "RJ19CD5678",
    latitude: "26.2400000", longitude: "73.0300000",
    address: "Paota, Jodhpur", city: "Jodhpur",
    baseDailyRate: 55000, weekendRate: 68000, minPrice: 45000,
    ratingAvg: "4.1", tripCount: 28, reviewCount: 22,
  }),

  // Aurangabad
  v({
    id: V_AUR_SWIFT, hostId: HOST_PUNE_ID,
    make: "Maruti Suzuki", model: "Swift", year: 2023, variant: "ZXi",
    vehicleType: "hatchback", fuelType: "petrol", transmission: "manual", seats: 5,
    registrationNumber: "MH20AB1234",
    latitude: "19.8762000", longitude: "75.3433000",
    address: "CIDCO, Aurangabad", city: "Aurangabad",
    baseDailyRate: 58000, weekendRate: 72000, minPrice: 48000,
    ratingAvg: "4.1", tripCount: 24, reviewCount: 19,
  }),

  // ═══════════════════════════════════════════════════════════════
  // FLEET VEHICLES
  // ═══════════════════════════════════════════════════════════════
  v({
    id: V_FLEET_ERTIGA, hostId: DEMO_FLEET_ID,
    make: "Maruti Suzuki", model: "Ertiga", year: 2024, variant: "ZXi+ AT",
    vehicleType: "mpv", fuelType: "petrol", transmission: "automatic", seats: 7,
    color: "Pearl Metallic Auburn Red", registrationNumber: "KA01FL0001",
    latitude: "12.9716000", longitude: "77.5946000",
    address: "Majestic, Bangalore", city: "Bangalore",
    baseDailyRate: 130000, weekendRate: 155000, minPrice: 110000,
    features: ["rear_ac", "apple_carplay", "android_auto", "cruise_control"],
    ratingAvg: "4.4", tripCount: 85, reviewCount: 68,
  }),
  v({
    id: V_FLEET_CITY_MUM, hostId: DEMO_FLEET_ID,
    make: "Honda", model: "City", year: 2023, variant: "V CVT",
    vehicleType: "sedan", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Modern Steel Metallic", registrationNumber: "MH01FL0002",
    latitude: "19.0176000", longitude: "72.8562000",
    address: "Dadar, Mumbai", city: "Mumbai",
    baseDailyRate: 140000, weekendRate: 165000, minPrice: 115000,
    features: ["apple_carplay", "lane_watch_camera", "cruise_control"],
    ratingAvg: "4.3", tripCount: 92, reviewCount: 73,
  }),
  v({
    id: V_FLEET_XUV300, hostId: DEMO_FLEET_ID,
    make: "Mahindra", model: "XUV300", year: 2024, variant: "W8(O) AMT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Electric Blue", registrationNumber: "KA01FL0003",
    latitude: "12.9600000", longitude: "77.5700000",
    address: "Rajajinagar, Bangalore", city: "Bangalore",
    baseDailyRate: 110000, weekendRate: 130000, minPrice: 90000,
    features: ["sunroof", "dual_zone_ac", "apple_carplay", "android_auto"],
    ratingAvg: "4.2", tripCount: 67, reviewCount: 53,
  }),
  v({
    id: V_FLEET_SWIFT_DEL, hostId: DEMO_FLEET_ID,
    make: "Maruti Suzuki", model: "Swift", year: 2024, variant: "ZXi AMT",
    vehicleType: "hatchback", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Sizzling Red", registrationNumber: "DL01FL0004",
    latitude: "28.6139000", longitude: "77.2090000",
    address: "Janpath, New Delhi", city: "New Delhi",
    baseDailyRate: 75000, weekendRate: 90000, minPrice: 60000,
    features: ["apple_carplay", "android_auto", "rear_camera", "push_start"],
    ratingAvg: "4.3", tripCount: 78, reviewCount: 62,
  }),
  v({
    id: V_FLEET_BREZZA, hostId: DEMO_FLEET_ID,
    make: "Maruti Suzuki", model: "Brezza", year: 2024, variant: "ZXi+ AT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Brave Khaki", registrationNumber: "MH12FL0005",
    latitude: "18.5204000", longitude: "73.8567000",
    address: "Shivajinagar, Pune", city: "Pune",
    baseDailyRate: 115000, weekendRate: 138000, minPrice: 95000,
    features: ["sunroof", "heads_up_display", "360_camera", "wireless_charging"],
    ratingAvg: "4.4", tripCount: 55, reviewCount: 44,
  }),
  v({
    id: V_FLEET_CRETA_HYD, hostId: DEMO_FLEET_ID,
    make: "Hyundai", model: "Creta", year: 2024, variant: "SX IVT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Titan Grey", registrationNumber: "TS07FL0006",
    latitude: "17.3850000", longitude: "78.4867000",
    address: "Madhapur, Hyderabad", city: "Hyderabad",
    baseDailyRate: 165000, weekendRate: 195000, minPrice: 138000,
    features: ["sunroof", "ventilated_seats", "360_camera", "wireless_charging"],
    ratingAvg: "4.5", tripCount: 48, reviewCount: 38,
  }),

  // ═══════════════════════════════════════════════════════════════
  // NEW VEHICLES — EXPANDED FLEET
  // ═══════════════════════════════════════════════════════════════

  // ── Bangalore (new) ────────────────────────────────────────────
  v({
    id: V_BLR_BMW320, hostId: HOST_BLR2_ID,
    make: "BMW", model: "3 Series", year: 2023, variant: "320d Sport Line",
    vehicleType: "luxury", fuelType: "diesel", transmission: "automatic", seats: 5,
    color: "Alpine White", registrationNumber: "KA01XX5001",
    latitude: "12.9850000", longitude: "77.6050000",
    address: "Ulsoor Lake Road, Bangalore", city: "Bangalore",
    baseDailyRate: 450000, weekendRate: 540000, minPrice: 375000,
    features: ["bmw_live_cockpit", "gesture_control", "harman_kardon", "wireless_charging", "parking_assist"],
    description: "Experience Bavarian luxury with this 320d Sport Line. Refined diesel powertrain, advanced cockpit, and dynamic handling.",
    ratingAvg: "4.7", tripCount: 14, reviewCount: 11,
  }),
  v({
    id: V_BLR_PUNCH, hostId: HOST_BLR3_ID,
    make: "Tata", model: "Punch", year: 2024, variant: "Creative AMT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Tornado Blue", registrationNumber: "KA01XX5002",
    latitude: "12.9450000", longitude: "77.6350000",
    address: "Koramangala 8th Block, Bangalore", city: "Bangalore",
    baseDailyRate: 65000, weekendRate: 78000, minPrice: 55000,
    features: ["apple_carplay", "android_auto", "rear_camera", "cruise_control"],
    ratingAvg: "4.3", tripCount: 38, reviewCount: 30,
  }),
  v({
    id: V_BLR_ZS_EV, hostId: DEMO_HOST_ID,
    make: "MG", model: "ZS EV", year: 2024, variant: "Exclusive Pro",
    vehicleType: "ev", fuelType: "electric", transmission: "automatic", seats: 5,
    color: "Glaze Red", registrationNumber: "KA01XX5003",
    latitude: "12.9680000", longitude: "77.7400000",
    address: "ITPL Road, Whitefield, Bangalore", city: "Bangalore",
    baseDailyRate: 145000, weekendRate: 175000, minPrice: 120000,
    features: ["ev", "fast_charging", "panoramic_sunroof", "apple_carplay", "android_auto", "pm2_5_filter"],
    description: "Go green in style. The MG ZS EV offers an impressive electric range with premium features and zero emissions.",
    ratingAvg: "4.5", tripCount: 18, reviewCount: 14,
  }),

  // ── Mumbai (new) ───────────────────────────────────────────────
  v({
    id: V_MUM_MERC_C, hostId: HOST_MUMBAI_ID,
    make: "Mercedes-Benz", model: "C-Class", year: 2024, variant: "C200 AMG Line",
    vehicleType: "luxury", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Obsidian Black", registrationNumber: "MH01XX5004",
    latitude: "19.0400000", longitude: "72.8200000",
    address: "Worli Seaface, Mumbai", city: "Mumbai",
    baseDailyRate: 500000, weekendRate: 600000, minPrice: 420000,
    features: ["mbux", "burmester_audio", "panoramic_sunroof", "digital_key", "ambient_lighting"],
    description: "The Mercedes-Benz C200 AMG Line delivers unmatched luxury with MBUX infotainment, Burmester surround sound, and AMG styling.",
    ratingAvg: "4.8", tripCount: 10, reviewCount: 8,
  }),
  v({
    id: V_MUM_PUNCH, hostId: HOST_MUM2_ID,
    make: "Tata", model: "Punch", year: 2024, variant: "Creative AMT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Tropical Mist", registrationNumber: "MH01XX5005",
    latitude: "19.0900000", longitude: "72.8650000",
    address: "Santacruz East, Mumbai", city: "Mumbai",
    baseDailyRate: 65000, weekendRate: 78000, minPrice: 55000,
    features: ["apple_carplay", "android_auto", "rear_camera", "cruise_control"],
    ratingAvg: "4.3", tripCount: 32, reviewCount: 25,
  }),
  v({
    id: V_MUM_SONET, hostId: HOST_MUMBAI_ID,
    make: "Kia", model: "Sonet", year: 2024, variant: "HTX+ DCT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Glacier White Pearl", registrationNumber: "MH01XX5006",
    latitude: "19.0260000", longitude: "72.8540000",
    address: "Lower Parel, Mumbai", city: "Mumbai",
    baseDailyRate: 95000, weekendRate: 115000, minPrice: 80000,
    features: ["sunroof", "ventilated_seats", "apple_carplay", "android_auto", "air_purifier"],
    ratingAvg: "4.4", tripCount: 28, reviewCount: 22, instantBooking: false,
  }),
  v({
    id: V_MUM_ZS_EV, hostId: HOST_MUM2_ID,
    make: "MG", model: "ZS EV", year: 2024, variant: "Exclusive Pro",
    vehicleType: "ev", fuelType: "electric", transmission: "automatic", seats: 5,
    color: "Aurora Silver", registrationNumber: "MH01XX5007",
    latitude: "19.1200000", longitude: "72.9100000",
    address: "Powai, Mumbai", city: "Mumbai",
    baseDailyRate: 145000, weekendRate: 175000, minPrice: 120000,
    features: ["ev", "fast_charging", "panoramic_sunroof", "apple_carplay", "android_auto", "pm2_5_filter"],
    description: "Premium electric SUV with fast charging. Perfect for eco-conscious city driving in Mumbai.",
    ratingAvg: "4.6", tripCount: 15, reviewCount: 12,
  }),

  // ── Delhi (new) ────────────────────────────────────────────────
  v({
    id: V_DEL_BMW320, hostId: HOST_DELHI_ID,
    make: "BMW", model: "3 Series", year: 2023, variant: "320d Sport Line",
    vehicleType: "luxury", fuelType: "diesel", transmission: "automatic", seats: 5,
    color: "Mineral Grey Metallic", registrationNumber: "DL01XX5008",
    latitude: "28.6350000", longitude: "77.2250000",
    address: "Barakhamba Road, New Delhi", city: "New Delhi",
    baseDailyRate: 450000, weekendRate: 540000, minPrice: 375000,
    features: ["bmw_live_cockpit", "gesture_control", "harman_kardon", "wireless_charging", "parking_assist"],
    description: "BMW 320d Sport Line with a refined diesel engine and premium luxury features for the discerning driver.",
    ratingAvg: "4.8", tripCount: 12, reviewCount: 10,
  }),
  v({
    id: V_DEL_PUNCH, hostId: HOST_DEL2_ID,
    make: "Tata", model: "Punch", year: 2024, variant: "Creative AMT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Calypso Red", registrationNumber: "DL01XX5009",
    latitude: "28.5800000", longitude: "77.2350000",
    address: "Greater Kailash I, New Delhi", city: "New Delhi",
    baseDailyRate: 65000, weekendRate: 78000, minPrice: 55000,
    features: ["apple_carplay", "android_auto", "rear_camera", "cruise_control"],
    ratingAvg: "4.2", tripCount: 42, reviewCount: 34,
  }),
  v({
    id: V_DEL_FRONX, hostId: HOST_DEL2_ID,
    make: "Maruti Suzuki", model: "Fronx", year: 2024, variant: "Alpha+ AT",
    vehicleType: "hatchback", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Earthen Brown", registrationNumber: "DL01XX5010",
    latitude: "28.6200000", longitude: "77.1900000",
    address: "Dwarka Sector 21, New Delhi", city: "New Delhi",
    baseDailyRate: 72000, weekendRate: 86000, minPrice: 60000,
    features: ["heads_up_display", "360_camera", "apple_carplay", "android_auto", "wireless_charging"],
    ratingAvg: "4.4", tripCount: 26, reviewCount: 20,
  }),
  v({
    id: V_DEL_ATTO3, hostId: HOST_DELHI_ID,
    make: "BYD", model: "Atto 3", year: 2024, variant: "Dynamic",
    vehicleType: "ev", fuelType: "electric", transmission: "automatic", seats: 5,
    color: "Ski White", registrationNumber: "DL01XX5011",
    latitude: "28.6000000", longitude: "77.2200000",
    address: "Lodhi Road, New Delhi", city: "New Delhi",
    baseDailyRate: 155000, weekendRate: 185000, minPrice: 128000,
    features: ["ev", "fast_charging", "rotating_screen", "apple_carplay", "android_auto", "vehicle_to_load"],
    description: "BYD Atto 3 electric crossover with a rotating centre screen and Vehicle-to-Load feature. Future of mobility.",
    ratingAvg: "4.5", tripCount: 11, reviewCount: 8, instantBooking: false,
  }),

  // ── Hyderabad (new) ───────────────────────────────────────────
  v({
    id: V_HYD_CAMRY, hostId: HOST_HYDERABAD_ID,
    make: "Toyota", model: "Camry", year: 2024, variant: "Hybrid",
    vehicleType: "luxury", fuelType: "hybrid", transmission: "automatic", seats: 5,
    color: "Platinum White Pearl", registrationNumber: "TS07XX5012",
    latitude: "17.4300000", longitude: "78.4100000",
    address: "Road No 36, Jubilee Hills, Hyderabad", city: "Hyderabad",
    baseDailyRate: 380000, weekendRate: 456000, minPrice: 320000,
    features: ["hybrid", "jbl_audio", "panoramic_sunroof", "heads_up_display", "wireless_charging"],
    description: "Toyota Camry Hybrid combines fuel efficiency with executive luxury. Whisper-quiet cabin with JBL audio.",
    ratingAvg: "4.7", tripCount: 13, reviewCount: 10,
  }),
  v({
    id: V_HYD_SONET, hostId: HOST_HYDERABAD_ID,
    make: "Kia", model: "Sonet", year: 2024, variant: "HTX+ DCT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Intense Red", registrationNumber: "TS07XX5013",
    latitude: "17.3900000", longitude: "78.4900000",
    address: "Nanakramguda, Hyderabad", city: "Hyderabad",
    baseDailyRate: 95000, weekendRate: 115000, minPrice: 80000,
    features: ["sunroof", "ventilated_seats", "apple_carplay", "android_auto", "air_purifier"],
    ratingAvg: "4.4", tripCount: 30, reviewCount: 24,
  }),
  v({
    id: V_HYD_GRAND_VITARA, hostId: HOST_HYDERABAD_ID,
    make: "Maruti Suzuki", model: "Grand Vitara", year: 2024, variant: "Alpha+ AT",
    vehicleType: "suv", fuelType: "hybrid", transmission: "automatic", seats: 5,
    color: "Celestial Blue", registrationNumber: "TS07XX5014",
    latitude: "17.4500000", longitude: "78.3900000",
    address: "Kukatpally, Hyderabad", city: "Hyderabad",
    baseDailyRate: 165000, weekendRate: 198000, minPrice: 138000,
    features: ["hybrid", "panoramic_sunroof", "heads_up_display", "360_camera", "wireless_charging"],
    ratingAvg: "4.5", tripCount: 20, reviewCount: 16, instantBooking: false,
  }),

  // ── Chennai (new) ─────────────────────────────────────────────
  v({
    id: V_CHN_PUNCH, hostId: HOST_CHENNAI_ID,
    make: "Tata", model: "Punch", year: 2024, variant: "Creative AMT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Meteor Bronze", registrationNumber: "TN01XX5015",
    latitude: "13.0700000", longitude: "80.2300000",
    address: "Vadapalani, Chennai", city: "Chennai",
    baseDailyRate: 65000, weekendRate: 78000, minPrice: 55000,
    features: ["apple_carplay", "android_auto", "rear_camera", "cruise_control"],
    ratingAvg: "4.3", tripCount: 25, reviewCount: 20,
  }),
  v({
    id: V_CHN_SELTOS, hostId: HOST_CHENNAI_ID,
    make: "Kia", model: "Seltos", year: 2024, variant: "HTX+ AT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Gravity Grey", registrationNumber: "TN01XX5016",
    latitude: "13.0500000", longitude: "80.2600000",
    address: "Nungambakkam, Chennai", city: "Chennai",
    baseDailyRate: 140000, weekendRate: 168000, minPrice: 115000,
    features: ["sunroof", "ventilated_seats", "bose_audio", "360_camera", "apple_carplay", "android_auto"],
    ratingAvg: "4.5", tripCount: 30, reviewCount: 24,
  }),
  v({
    id: V_CHN_HECTOR, hostId: HOST_CHENNAI_ID,
    make: "MG", model: "Hector", year: 2024, variant: "Sharp Pro AT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Starry Black", registrationNumber: "TN01XX5017",
    latitude: "12.9900000", longitude: "80.2150000",
    address: "Ashok Nagar, Chennai", city: "Chennai",
    baseDailyRate: 170000, weekendRate: 200000, minPrice: 140000,
    features: ["panoramic_sunroof", "14_inch_screen", "apple_carplay", "android_auto", "adas", "wireless_charging"],
    ratingAvg: "4.4", tripCount: 18, reviewCount: 14, instantBooking: false,
  }),
  v({
    id: V_CHN_C3, hostId: HOST_CHENNAI_ID,
    make: "Citroen", model: "C3", year: 2024, variant: "Feel vTi AT",
    vehicleType: "hatchback", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Zesty Orange", registrationNumber: "TN01XX5018",
    latitude: "13.0300000", longitude: "80.2700000",
    address: "Kilpauk, Chennai", city: "Chennai",
    baseDailyRate: 55000, weekendRate: 66000, minPrice: 45000,
    features: ["10_inch_screen", "apple_carplay", "android_auto", "cruise_control"],
    ratingAvg: "4.1", tripCount: 20, reviewCount: 16,
  }),

  // ── Pune (new) ─────────────────────────────────────────────────
  v({
    id: V_PUN_PUNCH, hostId: HOST_PUNE_ID,
    make: "Tata", model: "Punch", year: 2024, variant: "Creative AMT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Tornado Blue", registrationNumber: "MH12XX5019",
    latitude: "18.5100000", longitude: "73.8400000",
    address: "FC Road, Pune", city: "Pune",
    baseDailyRate: 65000, weekendRate: 78000, minPrice: 55000,
    features: ["apple_carplay", "android_auto", "rear_camera", "cruise_control"],
    ratingAvg: "4.4", tripCount: 35, reviewCount: 28,
  }),
  v({
    id: V_PUN_EV6, hostId: HOST_PUNE_ID,
    make: "Kia", model: "EV6", year: 2024, variant: "GT Line AWD",
    vehicleType: "ev", fuelType: "electric", transmission: "automatic", seats: 5,
    color: "Moonscape Matte", registrationNumber: "MH12XX5020",
    latitude: "18.5600000", longitude: "73.9200000",
    address: "Magarpatta, Pune", city: "Pune",
    baseDailyRate: 350000, weekendRate: 420000, minPrice: 290000,
    features: ["ev", "ultra_fast_charging", "adas", "hud", "meridian_audio", "vehicle_to_load"],
    description: "Kia EV6 GT Line AWD with ultra-fast 800V charging architecture. 0-100 in 5.2s with dual motors and Meridian audio.",
    ratingAvg: "4.8", tripCount: 8, reviewCount: 6, instantBooking: false,
  }),
  v({
    id: V_PUN_HYRYDER, hostId: HOST_PUNE_ID,
    make: "Toyota", model: "Hyryder", year: 2024, variant: "V Hybrid AT",
    vehicleType: "suv", fuelType: "hybrid", transmission: "automatic", seats: 5,
    color: "Celestial Blue", registrationNumber: "MH12XX5021",
    latitude: "18.5500000", longitude: "73.8700000",
    address: "Baner, Pune", city: "Pune",
    baseDailyRate: 160000, weekendRate: 192000, minPrice: 133000,
    features: ["hybrid", "panoramic_sunroof", "heads_up_display", "wireless_charging", "connected_car"],
    ratingAvg: "4.5", tripCount: 15, reviewCount: 12,
  }),

  // ── Jaipur (new) ──────────────────────────────────────────────
  v({
    id: V_JAI_PUNCH, hostId: HOST_JAIPUR_ID,
    make: "Tata", model: "Punch", year: 2024, variant: "Creative AMT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Calypso Red", registrationNumber: "RJ14XX5022",
    latitude: "26.9000000", longitude: "75.7700000",
    address: "Raja Park, Jaipur", city: "Jaipur",
    baseDailyRate: 65000, weekendRate: 78000, minPrice: 55000,
    features: ["apple_carplay", "android_auto", "rear_camera", "cruise_control"],
    ratingAvg: "4.3", tripCount: 33, reviewCount: 26,
  }),
  v({
    id: V_JAI_VENUE, hostId: HOST_JAIPUR_ID,
    make: "Hyundai", model: "Venue", year: 2024, variant: "SX+ DCT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Denim Blue", registrationNumber: "RJ14XX5023",
    latitude: "26.9300000", longitude: "75.7900000",
    address: "Bani Park, Jaipur", city: "Jaipur",
    baseDailyRate: 85000, weekendRate: 102000, minPrice: 70000,
    features: ["connected_car", "sunroof", "apple_carplay", "android_auto", "wireless_charging"],
    ratingAvg: "4.3", tripCount: 28, reviewCount: 22,
  }),
  v({
    id: V_JAI_HECTOR, hostId: HOST_JAIPUR_ID,
    make: "MG", model: "Hector", year: 2024, variant: "Sharp Pro AT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Candy White", registrationNumber: "RJ14XX5024",
    latitude: "26.8900000", longitude: "75.8100000",
    address: "Tonk Road, Jaipur", city: "Jaipur",
    baseDailyRate: 170000, weekendRate: 200000, minPrice: 140000,
    features: ["panoramic_sunroof", "14_inch_screen", "apple_carplay", "android_auto", "adas", "wireless_charging"],
    ratingAvg: "4.5", tripCount: 16, reviewCount: 13,
  }),

  // ── Kochi (new) ───────────────────────────────────────────────
  v({
    id: V_KOC_PUNCH, hostId: HOST_KOCHI_ID,
    make: "Tata", model: "Punch", year: 2024, variant: "Creative AMT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Pristine White", registrationNumber: "KL07XX5025",
    latitude: "9.9600000", longitude: "76.2700000",
    address: "Palarivattom, Kochi", city: "Kochi",
    baseDailyRate: 65000, weekendRate: 78000, minPrice: 55000,
    features: ["apple_carplay", "android_auto", "rear_camera", "cruise_control"],
    ratingAvg: "4.2", tripCount: 22, reviewCount: 18,
  }),
  v({
    id: V_KOC_GRAND_VITARA, hostId: HOST_KOCHI_ID,
    make: "Maruti Suzuki", model: "Grand Vitara", year: 2024, variant: "Alpha+ AT",
    vehicleType: "suv", fuelType: "hybrid", transmission: "automatic", seats: 5,
    color: "Arctic White", registrationNumber: "KL07XX5026",
    latitude: "9.9400000", longitude: "76.2600000",
    address: "Thevara, Kochi", city: "Kochi",
    baseDailyRate: 165000, weekendRate: 198000, minPrice: 138000,
    features: ["hybrid", "panoramic_sunroof", "heads_up_display", "360_camera", "wireless_charging"],
    ratingAvg: "4.5", tripCount: 17, reviewCount: 14, instantBooking: false,
  }),
  v({
    id: V_KOC_C3, hostId: HOST_KOCHI_ID,
    make: "Citroen", model: "C3", year: 2024, variant: "Feel vTi AT",
    vehicleType: "hatchback", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Platinum Grey", registrationNumber: "KL07XX5027",
    latitude: "9.9500000", longitude: "76.2850000",
    address: "Aluva, Kochi", city: "Kochi",
    baseDailyRate: 55000, weekendRate: 66000, minPrice: 45000,
    features: ["10_inch_screen", "apple_carplay", "android_auto", "cruise_control"],
    ratingAvg: "4.0", tripCount: 15, reviewCount: 12,
  }),

  // ── Kolkata (new) ─────────────────────────────────────────────
  v({
    id: V_KOL_PUNCH, hostId: HOST_KOLKATA_ID,
    make: "Tata", model: "Punch", year: 2024, variant: "Creative AMT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Meteor Bronze", registrationNumber: "WB06XX5028",
    latitude: "22.5500000", longitude: "88.3700000",
    address: "Ballygunge, Kolkata", city: "Kolkata",
    baseDailyRate: 65000, weekendRate: 78000, minPrice: 55000,
    features: ["apple_carplay", "android_auto", "rear_camera", "cruise_control"],
    ratingAvg: "4.2", tripCount: 27, reviewCount: 22,
  }),
  v({
    id: V_KOL_HECTOR, hostId: HOST_KOLKATA_ID,
    make: "MG", model: "Hector", year: 2024, variant: "Sharp Pro AT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Glaze Red", registrationNumber: "WB06XX5029",
    latitude: "22.5800000", longitude: "88.3900000",
    address: "Rajarhat, Kolkata", city: "Kolkata",
    baseDailyRate: 170000, weekendRate: 200000, minPrice: 140000,
    features: ["panoramic_sunroof", "14_inch_screen", "apple_carplay", "android_auto", "adas", "wireless_charging"],
    ratingAvg: "4.3", tripCount: 15, reviewCount: 12,
  }),
  v({
    id: V_KOL_SONET, hostId: HOST_KOLKATA_ID,
    make: "Kia", model: "Sonet", year: 2024, variant: "HTX+ DCT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Intense Red", registrationNumber: "WB06XX5030",
    latitude: "22.5600000", longitude: "88.3500000",
    address: "Gariahat, Kolkata", city: "Kolkata",
    baseDailyRate: 95000, weekendRate: 115000, minPrice: 80000,
    features: ["sunroof", "ventilated_seats", "apple_carplay", "android_auto", "air_purifier"],
    ratingAvg: "4.4", tripCount: 24, reviewCount: 19,
  }),

  // ── Ahmedabad (new) ───────────────────────────────────────────
  v({
    id: V_AHM_PUNCH, hostId: HOST_AHMEDABAD_ID,
    make: "Tata", model: "Punch", year: 2024, variant: "Creative AMT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Tornado Blue", registrationNumber: "GJ01XX5031",
    latitude: "23.0350000", longitude: "72.5600000",
    address: "Satellite, Ahmedabad", city: "Ahmedabad",
    baseDailyRate: 65000, weekendRate: 78000, minPrice: 55000,
    features: ["apple_carplay", "android_auto", "rear_camera", "cruise_control"],
    ratingAvg: "4.3", tripCount: 30, reviewCount: 24,
  }),
  v({
    id: V_AHM_SELTOS, hostId: HOST_AHMEDABAD_ID,
    make: "Kia", model: "Seltos", year: 2024, variant: "HTX+ AT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Pewter Olive", registrationNumber: "GJ01XX5032",
    latitude: "23.0150000", longitude: "72.5300000",
    address: "Vastrapur, Ahmedabad", city: "Ahmedabad",
    baseDailyRate: 140000, weekendRate: 168000, minPrice: 115000,
    features: ["sunroof", "ventilated_seats", "bose_audio", "360_camera", "apple_carplay", "android_auto"],
    ratingAvg: "4.5", tripCount: 25, reviewCount: 20,
  }),
  v({
    id: V_AHM_TUCSON, hostId: HOST_AHMEDABAD_ID,
    make: "Hyundai", model: "Tucson", year: 2024, variant: "Signature AT",
    vehicleType: "suv", fuelType: "diesel", transmission: "automatic", seats: 5,
    color: "Titan Grey", registrationNumber: "GJ01XX5033",
    latitude: "23.0500000", longitude: "72.5950000",
    address: "Bodakdev, Ahmedabad", city: "Ahmedabad",
    baseDailyRate: 250000, weekendRate: 300000, minPrice: 210000,
    features: ["panoramic_sunroof", "bose_audio", "ventilated_seats", "adas", "360_camera", "air_purifier"],
    ratingAvg: "4.6", tripCount: 12, reviewCount: 9, instantBooking: false,
  }),

  // ── Goa (new) ─────────────────────────────────────────────────
  v({
    id: V_GOA_PUNCH, hostId: HOST_GOA_ID,
    make: "Tata", model: "Punch", year: 2024, variant: "Creative AMT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Calypso Red", registrationNumber: "GA01XX5034",
    latitude: "15.5050000", longitude: "73.8200000",
    address: "Candolim, Goa", city: "Panaji",
    baseDailyRate: 65000, weekendRate: 78000, minPrice: 55000,
    features: ["apple_carplay", "android_auto", "rear_camera", "cruise_control"],
    ratingAvg: "4.4", tripCount: 40, reviewCount: 32,
  }),
  v({
    id: V_GOA_ZS_EV, hostId: HOST_GOA_ID,
    make: "MG", model: "ZS EV", year: 2024, variant: "Exclusive Pro",
    vehicleType: "ev", fuelType: "electric", transmission: "automatic", seats: 5,
    color: "Aurora Silver", registrationNumber: "GA01XX5035",
    latitude: "15.4850000", longitude: "73.8350000",
    address: "Panjim Waterfront, Goa", city: "Panaji",
    baseDailyRate: 145000, weekendRate: 175000, minPrice: 120000,
    features: ["ev", "fast_charging", "panoramic_sunroof", "apple_carplay", "android_auto", "pm2_5_filter"],
    description: "Explore Goa sustainably in the MG ZS EV. Silent, smooth, and loaded with features.",
    ratingAvg: "4.5", tripCount: 12, reviewCount: 10,
  }),
  v({
    id: V_GOA_SONET, hostId: HOST_GOA_ID,
    make: "Kia", model: "Sonet", year: 2024, variant: "HTX+ DCT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Glacier White Pearl", registrationNumber: "GA01XX5036",
    latitude: "15.4750000", longitude: "73.8150000",
    address: "Bambolim, Goa", city: "Panaji",
    baseDailyRate: 95000, weekendRate: 115000, minPrice: 80000,
    features: ["sunroof", "ventilated_seats", "apple_carplay", "android_auto", "air_purifier"],
    ratingAvg: "4.3", tripCount: 34, reviewCount: 27,
  }),

  // ── Lucknow (new) ─────────────────────────────────────────────
  v({
    id: V_LKO_PUNCH, hostId: HOST_LUCKNOW_ID,
    make: "Tata", model: "Punch", year: 2024, variant: "Creative AMT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Tropical Mist", registrationNumber: "UP32XX5037",
    latitude: "26.8550000", longitude: "80.9400000",
    address: "Aashiana, Lucknow", city: "Lucknow",
    baseDailyRate: 65000, weekendRate: 78000, minPrice: 55000,
    features: ["apple_carplay", "android_auto", "rear_camera", "cruise_control"],
    ratingAvg: "4.2", tripCount: 20, reviewCount: 16,
  }),
  v({
    id: V_LKO_SONET, hostId: HOST_LUCKNOW_ID,
    make: "Kia", model: "Sonet", year: 2024, variant: "HTX+ DCT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Intense Red", registrationNumber: "UP32XX5038",
    latitude: "26.8700000", longitude: "80.9550000",
    address: "Indira Nagar, Lucknow", city: "Lucknow",
    baseDailyRate: 95000, weekendRate: 115000, minPrice: 80000,
    features: ["sunroof", "ventilated_seats", "apple_carplay", "android_auto", "air_purifier"],
    ratingAvg: "4.4", tripCount: 18, reviewCount: 14,
  }),

  // ── Chandigarh (new) ──────────────────────────────────────────
  v({
    id: V_CHD_PUNCH, hostId: HOST_CHANDIGARH_ID,
    make: "Tata", model: "Punch", year: 2024, variant: "Creative AMT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Pristine White", registrationNumber: "CH01XX5039",
    latitude: "30.7400000", longitude: "76.7800000",
    address: "Sector 43, Chandigarh", city: "Chandigarh",
    baseDailyRate: 65000, weekendRate: 78000, minPrice: 55000,
    features: ["apple_carplay", "android_auto", "rear_camera", "cruise_control"],
    ratingAvg: "4.3", tripCount: 22, reviewCount: 18,
  }),
  v({
    id: V_CHD_HECTOR, hostId: HOST_CHANDIGARH_ID,
    make: "MG", model: "Hector", year: 2024, variant: "Sharp Pro AT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Starry Black", registrationNumber: "CH01XX5040",
    latitude: "30.7250000", longitude: "76.7650000",
    address: "Sector 26, Chandigarh", city: "Chandigarh",
    baseDailyRate: 170000, weekendRate: 200000, minPrice: 140000,
    features: ["panoramic_sunroof", "14_inch_screen", "apple_carplay", "android_auto", "adas", "wireless_charging"],
    ratingAvg: "4.4", tripCount: 15, reviewCount: 12, instantBooking: false,
  }),

  // ── Coimbatore (new) ──────────────────────────────────────────
  v({
    id: V_CBE_PUNCH, hostId: HOST_COIMBATORE_ID,
    make: "Tata", model: "Punch", year: 2024, variant: "Creative AMT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Meteor Bronze", registrationNumber: "TN38XX5041",
    latitude: "11.0250000", longitude: "76.9650000",
    address: "Saibaba Colony, Coimbatore", city: "Coimbatore",
    baseDailyRate: 65000, weekendRate: 78000, minPrice: 55000,
    features: ["apple_carplay", "android_auto", "rear_camera", "cruise_control"],
    ratingAvg: "4.2", tripCount: 18, reviewCount: 14,
  }),
  v({
    id: V_CBE_VENUE, hostId: HOST_COIMBATORE_ID,
    make: "Hyundai", model: "Venue", year: 2024, variant: "SX+ DCT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Fiery Red", registrationNumber: "TN38XX5042",
    latitude: "11.0050000", longitude: "76.9500000",
    address: "Race Course, Coimbatore", city: "Coimbatore",
    baseDailyRate: 85000, weekendRate: 102000, minPrice: 70000,
    features: ["connected_car", "sunroof", "apple_carplay", "android_auto", "wireless_charging"],
    ratingAvg: "4.3", tripCount: 15, reviewCount: 12,
  }),

  // ── Mysore (new) ──────────────────────────────────────────────
  v({
    id: V_MYS_PUNCH, hostId: DEMO_HOST_ID,
    make: "Tata", model: "Punch", year: 2024, variant: "Creative AMT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Tornado Blue", registrationNumber: "KA09XX5043",
    latitude: "12.3100000", longitude: "76.6450000",
    address: "Jayalakshmipuram, Mysore", city: "Mysore",
    baseDailyRate: 65000, weekendRate: 78000, minPrice: 55000,
    features: ["apple_carplay", "android_auto", "rear_camera", "cruise_control"],
    ratingAvg: "4.2", tripCount: 16, reviewCount: 13,
  }),
  v({
    id: V_MYS_SONET, hostId: DEMO_HOST_ID,
    make: "Kia", model: "Sonet", year: 2024, variant: "HTX+ DCT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Glacier White Pearl", registrationNumber: "KA09XX5044",
    latitude: "12.2900000", longitude: "76.6350000",
    address: "Saraswathipuram, Mysore", city: "Mysore",
    baseDailyRate: 95000, weekendRate: 115000, minPrice: 80000,
    features: ["sunroof", "ventilated_seats", "apple_carplay", "android_auto", "air_purifier"],
    ratingAvg: "4.3", tripCount: 14, reviewCount: 11,
  }),

  // ── Gurgaon (new) ─────────────────────────────────────────────
  v({
    id: V_GGN_PUNCH, hostId: HOST_DELHI_ID,
    make: "Tata", model: "Punch", year: 2024, variant: "Creative AMT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Calypso Red", registrationNumber: "HR26XX5045",
    latitude: "28.4600000", longitude: "77.0350000",
    address: "Sohna Road, Gurgaon", city: "Gurgaon",
    baseDailyRate: 65000, weekendRate: 78000, minPrice: 55000,
    features: ["apple_carplay", "android_auto", "rear_camera", "cruise_control"],
    ratingAvg: "4.3", tripCount: 30, reviewCount: 24,
  }),
  v({
    id: V_GGN_SELTOS, hostId: HOST_DEL2_ID,
    make: "Kia", model: "Seltos", year: 2024, variant: "HTX+ AT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Gravity Grey", registrationNumber: "HR26XX5046",
    latitude: "28.4400000", longitude: "77.0500000",
    address: "Sector 56, Gurgaon", city: "Gurgaon",
    baseDailyRate: 140000, weekendRate: 168000, minPrice: 115000,
    features: ["sunroof", "ventilated_seats", "bose_audio", "360_camera", "apple_carplay", "android_auto"],
    ratingAvg: "4.5", tripCount: 28, reviewCount: 22,
  }),
  v({
    id: V_GGN_FRONX, hostId: HOST_DELHI_ID,
    make: "Maruti Suzuki", model: "Fronx", year: 2024, variant: "Alpha+ AT",
    vehicleType: "hatchback", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Splendid Silver", registrationNumber: "HR26XX5047",
    latitude: "28.4700000", longitude: "77.0150000",
    address: "MG Road, Gurgaon", city: "Gurgaon",
    baseDailyRate: 72000, weekendRate: 86000, minPrice: 60000,
    features: ["heads_up_display", "360_camera", "apple_carplay", "android_auto", "wireless_charging"],
    ratingAvg: "4.3", tripCount: 22, reviewCount: 17,
  }),

  // ── Noida (new) ───────────────────────────────────────────────
  v({
    id: V_NOI_PUNCH, hostId: HOST_DELHI_ID,
    make: "Tata", model: "Punch", year: 2024, variant: "Creative AMT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Tropical Mist", registrationNumber: "UP16XX5048",
    latitude: "28.5300000", longitude: "77.3600000",
    address: "Sector 37, Noida", city: "Noida",
    baseDailyRate: 65000, weekendRate: 78000, minPrice: 55000,
    features: ["apple_carplay", "android_auto", "rear_camera", "cruise_control"],
    ratingAvg: "4.3", tripCount: 28, reviewCount: 22,
  }),
  v({
    id: V_NOI_HECTOR, hostId: HOST_DEL2_ID,
    make: "MG", model: "Hector", year: 2024, variant: "Sharp Pro AT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Candy White", registrationNumber: "UP16XX5049",
    latitude: "28.5450000", longitude: "77.3800000",
    address: "Sector 75, Noida", city: "Noida",
    baseDailyRate: 170000, weekendRate: 200000, minPrice: 140000,
    features: ["panoramic_sunroof", "14_inch_screen", "apple_carplay", "android_auto", "adas", "wireless_charging"],
    ratingAvg: "4.4", tripCount: 17, reviewCount: 13, instantBooking: false,
  }),
  v({
    id: V_NOI_VENUE, hostId: HOST_DEL2_ID,
    make: "Hyundai", model: "Venue", year: 2024, variant: "SX+ DCT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Denim Blue", registrationNumber: "UP16XX5050",
    latitude: "28.5200000", longitude: "77.4000000",
    address: "Sector 142, Noida", city: "Noida",
    baseDailyRate: 85000, weekendRate: 102000, minPrice: 70000,
    features: ["connected_car", "sunroof", "apple_carplay", "android_auto", "wireless_charging"],
    ratingAvg: "4.2", tripCount: 22, reviewCount: 17,
  }),

  // ── Udaipur (new) ─────────────────────────────────────────────
  v({
    id: V_UDR_PUNCH, hostId: HOST_JAIPUR_ID,
    make: "Tata", model: "Punch", year: 2024, variant: "Creative AMT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Pristine White", registrationNumber: "RJ27XX5051",
    latitude: "24.5800000", longitude: "73.6800000",
    address: "Chetak Circle, Udaipur", city: "Udaipur",
    baseDailyRate: 65000, weekendRate: 78000, minPrice: 55000,
    features: ["apple_carplay", "android_auto", "rear_camera", "cruise_control"],
    ratingAvg: "4.3", tripCount: 22, reviewCount: 18,
  }),
  v({
    id: V_UDR_BREZZA, hostId: HOST_JAIPUR_ID,
    make: "Maruti Suzuki", model: "Brezza", year: 2024, variant: "ZXi+ AT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Brave Khaki", registrationNumber: "RJ27XX5052",
    latitude: "24.5950000", longitude: "73.7100000",
    address: "Sukhadia Circle, Udaipur", city: "Udaipur",
    baseDailyRate: 105000, weekendRate: 126000, minPrice: 88000,
    features: ["sunroof", "heads_up_display", "360_camera", "wireless_charging"],
    ratingAvg: "4.4", tripCount: 18, reviewCount: 14,
  }),
  v({
    id: V_UDR_VENUE, hostId: HOST_JAIPUR_ID,
    make: "Hyundai", model: "Venue", year: 2024, variant: "SX+ DCT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Titan Grey", registrationNumber: "RJ27XX5053",
    latitude: "24.5700000", longitude: "73.6950000",
    address: "Ambamata, Udaipur", city: "Udaipur",
    baseDailyRate: 85000, weekendRate: 102000, minPrice: 70000,
    features: ["connected_car", "sunroof", "apple_carplay", "android_auto", "wireless_charging"],
    ratingAvg: "4.2", tripCount: 20, reviewCount: 16,
  }),

  // ── Surat (new) ───────────────────────────────────────────────
  v({
    id: V_SUR_PUNCH, hostId: HOST_AHMEDABAD_ID,
    make: "Tata", model: "Punch", year: 2024, variant: "Creative AMT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Tornado Blue", registrationNumber: "GJ05XX5054",
    latitude: "21.1750000", longitude: "72.8250000",
    address: "Athwa, Surat", city: "Surat",
    baseDailyRate: 65000, weekendRate: 78000, minPrice: 55000,
    features: ["apple_carplay", "android_auto", "rear_camera", "cruise_control"],
    ratingAvg: "4.3", tripCount: 24, reviewCount: 19,
  }),
  v({
    id: V_SUR_SONET, hostId: HOST_AHMEDABAD_ID,
    make: "Kia", model: "Sonet", year: 2024, variant: "HTX+ DCT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Intense Red", registrationNumber: "GJ05XX5055",
    latitude: "21.1600000", longitude: "72.8100000",
    address: "Dumas Road, Surat", city: "Surat",
    baseDailyRate: 95000, weekendRate: 115000, minPrice: 80000,
    features: ["sunroof", "ventilated_seats", "apple_carplay", "android_auto", "air_purifier"],
    ratingAvg: "4.4", tripCount: 20, reviewCount: 16,
  }),
  v({
    id: V_SUR_VENUE, hostId: HOST_AHMEDABAD_ID,
    make: "Hyundai", model: "Venue", year: 2024, variant: "SX+ DCT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Denim Blue", registrationNumber: "GJ05XX5056",
    latitude: "21.1900000", longitude: "72.8500000",
    address: "Althan, Surat", city: "Surat",
    baseDailyRate: 85000, weekendRate: 102000, minPrice: 70000,
    features: ["connected_car", "sunroof", "apple_carplay", "android_auto", "wireless_charging"],
    ratingAvg: "4.2", tripCount: 22, reviewCount: 18, instantBooking: false,
  }),

  // ── Varanasi (new) ────────────────────────────────────────────
  v({
    id: V_VAR_PUNCH, hostId: HOST_LUCKNOW_ID,
    make: "Tata", model: "Punch", year: 2024, variant: "Creative AMT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Calypso Red", registrationNumber: "UP65XX5057",
    latitude: "25.3100000", longitude: "82.9800000",
    address: "Bhelupur, Varanasi", city: "Varanasi",
    baseDailyRate: 65000, weekendRate: 78000, minPrice: 55000,
    features: ["apple_carplay", "android_auto", "rear_camera", "cruise_control"],
    ratingAvg: "4.2", tripCount: 18, reviewCount: 14,
  }),
  v({
    id: V_VAR_I20, hostId: HOST_LUCKNOW_ID,
    make: "Hyundai", model: "i20", year: 2024, variant: "Sportz iVT",
    vehicleType: "hatchback", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Starry Night", registrationNumber: "UP65XX5058",
    latitude: "25.3250000", longitude: "82.9900000",
    address: "Mahmoorganj, Varanasi", city: "Varanasi",
    baseDailyRate: 75000, weekendRate: 90000, minPrice: 62000,
    features: ["sunroof", "apple_carplay", "android_auto", "wireless_charging", "connected_car"],
    ratingAvg: "4.3", tripCount: 25, reviewCount: 20,
  }),
  v({
    id: V_VAR_CRETA, hostId: HOST_LUCKNOW_ID,
    make: "Hyundai", model: "Creta", year: 2024, variant: "SX(O) AT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Atlas White", registrationNumber: "UP65XX5059",
    latitude: "25.3000000", longitude: "83.0100000",
    address: "Cantt Area, Varanasi", city: "Varanasi",
    baseDailyRate: 170000, weekendRate: 204000, minPrice: 142000,
    features: ["sunroof", "ventilated_seats", "360_camera", "bose_audio", "wireless_charging"],
    ratingAvg: "4.5", tripCount: 14, reviewCount: 11,
  }),

  // ── Trivandrum (new) ──────────────────────────────────────────
  v({
    id: V_TVM_PUNCH, hostId: HOST_KOCHI_ID,
    make: "Tata", model: "Punch", year: 2024, variant: "Creative AMT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Meteor Bronze", registrationNumber: "KL01XX5060",
    latitude: "8.5150000", longitude: "76.9400000",
    address: "Vazhuthacaud, Trivandrum", city: "Trivandrum",
    baseDailyRate: 65000, weekendRate: 78000, minPrice: 55000,
    features: ["apple_carplay", "android_auto", "rear_camera", "cruise_control"],
    ratingAvg: "4.3", tripCount: 19, reviewCount: 15,
  }),
  v({
    id: V_TVM_SONET, hostId: HOST_KOCHI_ID,
    make: "Kia", model: "Sonet", year: 2024, variant: "HTX+ DCT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Intense Red", registrationNumber: "KL01XX5061",
    latitude: "8.5300000", longitude: "76.9500000",
    address: "Kowdiar, Trivandrum", city: "Trivandrum",
    baseDailyRate: 95000, weekendRate: 115000, minPrice: 80000,
    features: ["sunroof", "ventilated_seats", "apple_carplay", "android_auto", "air_purifier"],
    ratingAvg: "4.4", tripCount: 16, reviewCount: 12,
  }),
  v({
    id: V_TVM_ERTIGA, hostId: HOST_KOCHI_ID,
    make: "Maruti Suzuki", model: "Ertiga", year: 2024, variant: "ZXi+ AT",
    vehicleType: "mpv", fuelType: "petrol", transmission: "automatic", seats: 7,
    color: "Pearl Metallic Auburn Red", registrationNumber: "KL01XX5062",
    latitude: "8.5400000", longitude: "76.9250000",
    address: "Kazhakkoottam, Trivandrum", city: "Trivandrum",
    baseDailyRate: 120000, weekendRate: 144000, minPrice: 100000,
    features: ["rear_ac", "apple_carplay", "android_auto", "cruise_control"],
    ratingAvg: "4.3", tripCount: 30, reviewCount: 24, instantBooking: false,
  }),

  // ── Warangal (new) ────────────────────────────────────────────
  v({
    id: V_WGL_PUNCH, hostId: HOST_HYDERABAD_ID,
    make: "Tata", model: "Punch", year: 2024, variant: "Creative AMT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Tornado Blue", registrationNumber: "TS12XX5063",
    latitude: "17.9700000", longitude: "79.5800000",
    address: "Kazipet, Warangal", city: "Warangal",
    baseDailyRate: 65000, weekendRate: 78000, minPrice: 55000,
    features: ["apple_carplay", "android_auto", "rear_camera", "cruise_control"],
    ratingAvg: "4.2", tripCount: 15, reviewCount: 12,
  }),
  v({
    id: V_WGL_CRETA, hostId: HOST_HYDERABAD_ID,
    make: "Hyundai", model: "Creta", year: 2024, variant: "SX(O) AT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Titan Grey", registrationNumber: "TS12XX5064",
    latitude: "17.9800000", longitude: "79.6000000",
    address: "Warangal Fort Road, Warangal", city: "Warangal",
    baseDailyRate: 170000, weekendRate: 204000, minPrice: 142000,
    features: ["sunroof", "ventilated_seats", "360_camera", "bose_audio", "wireless_charging"],
    ratingAvg: "4.5", tripCount: 10, reviewCount: 8,
  }),
  v({
    id: V_WGL_BREZZA, hostId: HOST_HYDERABAD_ID,
    make: "Maruti Suzuki", model: "Brezza", year: 2024, variant: "ZXi+ AT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Brave Khaki", registrationNumber: "TS12XX5065",
    latitude: "17.9900000", longitude: "79.5900000",
    address: "Hanamkonda Bypass, Warangal", city: "Warangal",
    baseDailyRate: 105000, weekendRate: 126000, minPrice: 88000,
    features: ["sunroof", "heads_up_display", "360_camera", "wireless_charging"],
    ratingAvg: "4.3", tripCount: 12, reviewCount: 10,
  }),
  v({
    id: V_WGL_SONET, hostId: HOST_HYDERABAD_ID,
    make: "Kia", model: "Sonet", year: 2024, variant: "HTX+ DCT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Glacier White Pearl", registrationNumber: "TS12XX5066",
    latitude: "17.9650000", longitude: "79.6100000",
    address: "Subedari, Warangal", city: "Warangal",
    baseDailyRate: 95000, weekendRate: 115000, minPrice: 80000,
    features: ["sunroof", "ventilated_seats", "apple_carplay", "android_auto", "air_purifier"],
    ratingAvg: "4.3", tripCount: 14, reviewCount: 11,
  }),

  // ── Hubli (new) ───────────────────────────────────────────────
  v({
    id: V_HBL_PUNCH, hostId: DEMO_HOST_ID,
    make: "Tata", model: "Punch", year: 2024, variant: "Creative AMT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Calypso Red", registrationNumber: "KA25XX5067",
    latitude: "15.3600000", longitude: "75.1150000",
    address: "Keshwapur, Hubli", city: "Hubli",
    baseDailyRate: 65000, weekendRate: 78000, minPrice: 55000,
    features: ["apple_carplay", "android_auto", "rear_camera", "cruise_control"],
    ratingAvg: "4.2", tripCount: 18, reviewCount: 14,
  }),
  v({
    id: V_HBL_BREZZA, hostId: DEMO_HOST_ID,
    make: "Maruti Suzuki", model: "Brezza", year: 2024, variant: "ZXi+ AT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Pearl Arctic White", registrationNumber: "KA25XX5068",
    latitude: "15.3750000", longitude: "75.1350000",
    address: "Gokul Road, Hubli", city: "Hubli",
    baseDailyRate: 105000, weekendRate: 126000, minPrice: 88000,
    features: ["sunroof", "heads_up_display", "360_camera", "wireless_charging"],
    ratingAvg: "4.3", tripCount: 14, reviewCount: 11,
  }),
  v({
    id: V_HBL_VENUE, hostId: DEMO_HOST_ID,
    make: "Hyundai", model: "Venue", year: 2024, variant: "SX+ DCT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Fiery Red", registrationNumber: "KA25XX5069",
    latitude: "15.3500000", longitude: "75.1200000",
    address: "Old Hubli, Hubli", city: "Hubli",
    baseDailyRate: 85000, weekendRate: 102000, minPrice: 70000,
    features: ["connected_car", "sunroof", "apple_carplay", "android_auto", "wireless_charging"],
    ratingAvg: "4.2", tripCount: 20, reviewCount: 16, instantBooking: false,
  }),

  // ── Mangalore (new) ───────────────────────────────────────────
  v({
    id: V_MNG_PUNCH, hostId: DEMO_HOST_ID,
    make: "Tata", model: "Punch", year: 2024, variant: "Creative AMT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Pristine White", registrationNumber: "KA19XX5070",
    latitude: "12.8800000", longitude: "74.8500000",
    address: "Kankanady, Mangalore", city: "Mangalore",
    baseDailyRate: 65000, weekendRate: 78000, minPrice: 55000,
    features: ["apple_carplay", "android_auto", "rear_camera", "cruise_control"],
    ratingAvg: "4.3", tripCount: 22, reviewCount: 17,
  }),
  v({
    id: V_MNG_SONET, hostId: DEMO_HOST_ID,
    make: "Kia", model: "Sonet", year: 2024, variant: "HTX+ DCT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Intense Red", registrationNumber: "KA19XX5071",
    latitude: "12.9050000", longitude: "74.8450000",
    address: "Kadri, Mangalore", city: "Mangalore",
    baseDailyRate: 95000, weekendRate: 115000, minPrice: 80000,
    features: ["sunroof", "ventilated_seats", "apple_carplay", "android_auto", "air_purifier"],
    ratingAvg: "4.4", tripCount: 16, reviewCount: 12,
  }),
  v({
    id: V_MNG_ERTIGA, hostId: DEMO_HOST_ID,
    make: "Maruti Suzuki", model: "Ertiga", year: 2024, variant: "ZXi+ AT",
    vehicleType: "mpv", fuelType: "petrol", transmission: "automatic", seats: 7,
    color: "Dignity Brown", registrationNumber: "KA19XX5072",
    latitude: "12.8700000", longitude: "74.8650000",
    address: "Surathkal, Mangalore", city: "Mangalore",
    baseDailyRate: 120000, weekendRate: 144000, minPrice: 100000,
    features: ["rear_ac", "apple_carplay", "android_auto", "cruise_control"],
    ratingAvg: "4.3", tripCount: 24, reviewCount: 19,
  }),

  // ── Nashik (new) ──────────────────────────────────────────────
  v({
    id: V_NSK_PUNCH, hostId: HOST_PUNE_ID,
    make: "Tata", model: "Punch", year: 2024, variant: "Creative AMT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Meteor Bronze", registrationNumber: "MH15XX5073",
    latitude: "20.0050000", longitude: "73.7900000",
    address: "Panchavati, Nashik", city: "Nashik",
    baseDailyRate: 65000, weekendRate: 78000, minPrice: 55000,
    features: ["apple_carplay", "android_auto", "rear_camera", "cruise_control"],
    ratingAvg: "4.2", tripCount: 18, reviewCount: 14,
  }),
  v({
    id: V_NSK_VENUE, hostId: HOST_MUMBAI_ID,
    make: "Hyundai", model: "Venue", year: 2024, variant: "SX+ DCT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Denim Blue", registrationNumber: "MH15XX5074",
    latitude: "19.9900000", longitude: "73.7750000",
    address: "Tidke Colony, Nashik", city: "Nashik",
    baseDailyRate: 85000, weekendRate: 102000, minPrice: 70000,
    features: ["connected_car", "sunroof", "apple_carplay", "android_auto", "wireless_charging"],
    ratingAvg: "4.3", tripCount: 16, reviewCount: 12,
  }),
  v({
    id: V_NSK_SONET, hostId: HOST_PUNE_ID,
    make: "Kia", model: "Sonet", year: 2024, variant: "HTX+ DCT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Glacier White Pearl", registrationNumber: "MH15XX5075",
    latitude: "20.0100000", longitude: "73.8000000",
    address: "CIDCO, Nashik", city: "Nashik",
    baseDailyRate: 95000, weekendRate: 115000, minPrice: 80000,
    features: ["sunroof", "ventilated_seats", "apple_carplay", "android_auto", "air_purifier"],
    ratingAvg: "4.4", tripCount: 14, reviewCount: 11, instantBooking: false,
  }),

  // ── Nagpur (new) ──────────────────────────────────────────────
  v({
    id: V_NGP_PUNCH, hostId: HOST_MUMBAI_ID,
    make: "Tata", model: "Punch", year: 2024, variant: "Creative AMT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Tornado Blue", registrationNumber: "MH31XX5076",
    latitude: "21.1400000", longitude: "79.0800000",
    address: "Sitabuldi, Nagpur", city: "Nagpur",
    baseDailyRate: 65000, weekendRate: 78000, minPrice: 55000,
    features: ["apple_carplay", "android_auto", "rear_camera", "cruise_control"],
    ratingAvg: "4.2", tripCount: 20, reviewCount: 16,
  }),
  v({
    id: V_NGP_I20, hostId: HOST_MUMBAI_ID,
    make: "Hyundai", model: "i20", year: 2024, variant: "Sportz iVT",
    vehicleType: "hatchback", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Fiery Red", registrationNumber: "MH31XX5077",
    latitude: "21.1550000", longitude: "79.1000000",
    address: "Bajaj Nagar, Nagpur", city: "Nagpur",
    baseDailyRate: 75000, weekendRate: 90000, minPrice: 62000,
    features: ["sunroof", "apple_carplay", "android_auto", "wireless_charging", "connected_car"],
    ratingAvg: "4.3", tripCount: 26, reviewCount: 21,
  }),
  v({
    id: V_NGP_BREZZA, hostId: HOST_MUMBAI_ID,
    make: "Maruti Suzuki", model: "Brezza", year: 2024, variant: "ZXi+ AT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Brave Khaki", registrationNumber: "MH31XX5078",
    latitude: "21.1300000", longitude: "79.0700000",
    address: "Ramdaspeth, Nagpur", city: "Nagpur",
    baseDailyRate: 105000, weekendRate: 126000, minPrice: 88000,
    features: ["sunroof", "heads_up_display", "360_camera", "wireless_charging"],
    ratingAvg: "4.4", tripCount: 16, reviewCount: 13,
  }),

  // ── Madurai (new) ─────────────────────────────────────────────
  v({
    id: V_MDU_PUNCH, hostId: HOST_CHENNAI_ID,
    make: "Tata", model: "Punch", year: 2024, variant: "Creative AMT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Calypso Red", registrationNumber: "TN58XX5079",
    latitude: "9.9300000", longitude: "78.1100000",
    address: "Goripalayam, Madurai", city: "Madurai",
    baseDailyRate: 65000, weekendRate: 78000, minPrice: 55000,
    features: ["apple_carplay", "android_auto", "rear_camera", "cruise_control"],
    ratingAvg: "4.2", tripCount: 18, reviewCount: 14,
  }),
  v({
    id: V_MDU_VENUE, hostId: HOST_CHENNAI_ID,
    make: "Hyundai", model: "Venue", year: 2024, variant: "SX+ DCT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Titan Grey", registrationNumber: "TN58XX5080",
    latitude: "9.9200000", longitude: "78.1250000",
    address: "Tallakulam, Madurai", city: "Madurai",
    baseDailyRate: 85000, weekendRate: 102000, minPrice: 70000,
    features: ["connected_car", "sunroof", "apple_carplay", "android_auto", "wireless_charging"],
    ratingAvg: "4.3", tripCount: 15, reviewCount: 12,
  }),
  v({
    id: V_MDU_BREZZA, hostId: HOST_CHENNAI_ID,
    make: "Maruti Suzuki", model: "Brezza", year: 2024, variant: "ZXi+ AT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Pearl Arctic White", registrationNumber: "TN58XX5081",
    latitude: "9.9350000", longitude: "78.1300000",
    address: "SS Colony, Madurai", city: "Madurai",
    baseDailyRate: 105000, weekendRate: 126000, minPrice: 88000,
    features: ["sunroof", "heads_up_display", "360_camera", "wireless_charging"],
    ratingAvg: "4.3", tripCount: 25, reviewCount: 20,
  }),

  // ── Bhopal (new) ──────────────────────────────────────────────
  v({
    id: V_BPL_PUNCH, hostId: HOST_LUCKNOW_ID,
    make: "Tata", model: "Punch", year: 2024, variant: "Creative AMT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Tropical Mist", registrationNumber: "MP04XX5082",
    latitude: "23.2650000", longitude: "77.4100000",
    address: "New Market, Bhopal", city: "Bhopal",
    baseDailyRate: 65000, weekendRate: 78000, minPrice: 55000,
    features: ["apple_carplay", "android_auto", "rear_camera", "cruise_control"],
    ratingAvg: "4.2", tripCount: 17, reviewCount: 13,
  }),
  v({
    id: V_BPL_I20, hostId: HOST_LUCKNOW_ID,
    make: "Hyundai", model: "i20", year: 2024, variant: "Sportz iVT",
    vehicleType: "hatchback", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Starry Night", registrationNumber: "MP04XX5083",
    latitude: "23.2500000", longitude: "77.4300000",
    address: "Kolar Road, Bhopal", city: "Bhopal",
    baseDailyRate: 75000, weekendRate: 90000, minPrice: 62000,
    features: ["sunroof", "apple_carplay", "android_auto", "wireless_charging", "connected_car"],
    ratingAvg: "4.4", tripCount: 22, reviewCount: 18,
  }),
  v({
    id: V_BPL_ERTIGA, hostId: HOST_LUCKNOW_ID,
    make: "Maruti Suzuki", model: "Ertiga", year: 2024, variant: "ZXi+ AT",
    vehicleType: "mpv", fuelType: "petrol", transmission: "automatic", seats: 7,
    color: "Dignity Brown", registrationNumber: "MP04XX5084",
    latitude: "23.2700000", longitude: "77.4000000",
    address: "Habibganj, Bhopal", city: "Bhopal",
    baseDailyRate: 120000, weekendRate: 144000, minPrice: 100000,
    features: ["rear_ac", "apple_carplay", "android_auto", "cruise_control"],
    ratingAvg: "4.4", tripCount: 32, reviewCount: 25, instantBooking: false,
  }),

  // ── Indore (new) ──────────────────────────────────────────────
  v({
    id: V_IDR_PUNCH, hostId: HOST_LUCKNOW_ID,
    make: "Tata", model: "Punch", year: 2024, variant: "Creative AMT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Pristine White", registrationNumber: "MP09XX5085",
    latitude: "22.7150000", longitude: "75.8500000",
    address: "Sapna Sangeeta, Indore", city: "Indore",
    baseDailyRate: 65000, weekendRate: 78000, minPrice: 55000,
    features: ["apple_carplay", "android_auto", "rear_camera", "cruise_control"],
    ratingAvg: "4.3", tripCount: 20, reviewCount: 16,
  }),
  v({
    id: V_IDR_VENUE, hostId: HOST_LUCKNOW_ID,
    make: "Hyundai", model: "Venue", year: 2024, variant: "SX+ DCT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Denim Blue", registrationNumber: "MP09XX5086",
    latitude: "22.7250000", longitude: "75.8650000",
    address: "MG Road, Indore", city: "Indore",
    baseDailyRate: 85000, weekendRate: 102000, minPrice: 70000,
    features: ["connected_car", "sunroof", "apple_carplay", "android_auto", "wireless_charging"],
    ratingAvg: "4.2", tripCount: 18, reviewCount: 14,
  }),
  v({
    id: V_IDR_SONET, hostId: HOST_LUCKNOW_ID,
    make: "Kia", model: "Sonet", year: 2024, variant: "HTX+ DCT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Intense Red", registrationNumber: "MP09XX5087",
    latitude: "22.7100000", longitude: "75.8700000",
    address: "Bhawarkua, Indore", city: "Indore",
    baseDailyRate: 95000, weekendRate: 115000, minPrice: 80000,
    features: ["sunroof", "ventilated_seats", "apple_carplay", "android_auto", "air_purifier"],
    ratingAvg: "4.4", tripCount: 16, reviewCount: 12,
  }),

  // ── Amritsar (new) ────────────────────────────────────────────
  v({
    id: V_AMR_PUNCH, hostId: HOST_CHANDIGARH_ID,
    make: "Tata", model: "Punch", year: 2024, variant: "Creative AMT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Tornado Blue", registrationNumber: "PB02XX5088",
    latitude: "31.6300000", longitude: "74.8600000",
    address: "Ranjit Avenue, Amritsar", city: "Amritsar",
    baseDailyRate: 65000, weekendRate: 78000, minPrice: 55000,
    features: ["apple_carplay", "android_auto", "rear_camera", "cruise_control"],
    ratingAvg: "4.3", tripCount: 22, reviewCount: 17,
  }),
  v({
    id: V_AMR_I20, hostId: HOST_CHANDIGARH_ID,
    make: "Hyundai", model: "i20", year: 2024, variant: "Sportz iVT",
    vehicleType: "hatchback", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Fiery Red", registrationNumber: "PB02XX5089",
    latitude: "31.6400000", longitude: "74.8800000",
    address: "GT Road, Amritsar", city: "Amritsar",
    baseDailyRate: 75000, weekendRate: 90000, minPrice: 62000,
    features: ["sunroof", "apple_carplay", "android_auto", "wireless_charging", "connected_car"],
    ratingAvg: "4.3", tripCount: 28, reviewCount: 22,
  }),
  v({
    id: V_AMR_SONET, hostId: HOST_CHANDIGARH_ID,
    make: "Kia", model: "Sonet", year: 2024, variant: "HTX+ DCT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Glacier White Pearl", registrationNumber: "PB02XX5090",
    latitude: "31.6250000", longitude: "74.8750000",
    address: "Majitha Road, Amritsar", city: "Amritsar",
    baseDailyRate: 95000, weekendRate: 115000, minPrice: 80000,
    features: ["sunroof", "ventilated_seats", "apple_carplay", "android_auto", "air_purifier"],
    ratingAvg: "4.5", tripCount: 18, reviewCount: 14, instantBooking: false,
  }),

  // ── Siliguri (new) ────────────────────────────────────────────
  v({
    id: V_SLG_PUNCH, hostId: HOST_KOLKATA_ID,
    make: "Tata", model: "Punch", year: 2024, variant: "Creative AMT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Calypso Red", registrationNumber: "WB73XX5091",
    latitude: "26.7200000", longitude: "88.4000000",
    address: "Sevoke Road, Siliguri", city: "Siliguri",
    baseDailyRate: 65000, weekendRate: 78000, minPrice: 55000,
    features: ["apple_carplay", "android_auto", "rear_camera", "cruise_control"],
    ratingAvg: "4.2", tripCount: 15, reviewCount: 12,
  }),
  v({
    id: V_SLG_CRETA, hostId: HOST_KOLKATA_ID,
    make: "Hyundai", model: "Creta", year: 2024, variant: "SX(O) AT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Atlas White", registrationNumber: "WB73XX5092",
    latitude: "26.7300000", longitude: "88.4200000",
    address: "Matigara, Siliguri", city: "Siliguri",
    baseDailyRate: 170000, weekendRate: 204000, minPrice: 142000,
    features: ["sunroof", "ventilated_seats", "360_camera", "bose_audio", "wireless_charging"],
    ratingAvg: "4.5", tripCount: 8, reviewCount: 6,
  }),
  v({
    id: V_SLG_BREZZA, hostId: HOST_KOLKATA_ID,
    make: "Maruti Suzuki", model: "Brezza", year: 2024, variant: "ZXi+ AT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Pearl Arctic White", registrationNumber: "WB73XX5093",
    latitude: "26.7150000", longitude: "88.3800000",
    address: "Pradhan Nagar, Siliguri", city: "Siliguri",
    baseDailyRate: 105000, weekendRate: 126000, minPrice: 88000,
    features: ["sunroof", "heads_up_display", "360_camera", "wireless_charging"],
    ratingAvg: "4.3", tripCount: 12, reviewCount: 10,
  }),
  v({
    id: V_SLG_SONET, hostId: HOST_KOLKATA_ID,
    make: "Kia", model: "Sonet", year: 2024, variant: "HTX+ DCT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Intense Red", registrationNumber: "WB73XX5094",
    latitude: "26.7350000", longitude: "88.4100000",
    address: "Salugara, Siliguri", city: "Siliguri",
    baseDailyRate: 95000, weekendRate: 115000, minPrice: 80000,
    features: ["sunroof", "ventilated_seats", "apple_carplay", "android_auto", "air_purifier"],
    ratingAvg: "4.4", tripCount: 10, reviewCount: 8,
  }),

  // ── Vadodara (new) ────────────────────────────────────────────
  v({
    id: V_VDR_PUNCH, hostId: HOST_AHMEDABAD_ID,
    make: "Tata", model: "Punch", year: 2024, variant: "Creative AMT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Meteor Bronze", registrationNumber: "GJ06XX5095",
    latitude: "22.3150000", longitude: "73.1850000",
    address: "Sayajigunj, Vadodara", city: "Vadodara",
    baseDailyRate: 65000, weekendRate: 78000, minPrice: 55000,
    features: ["apple_carplay", "android_auto", "rear_camera", "cruise_control"],
    ratingAvg: "4.2", tripCount: 18, reviewCount: 14,
  }),
  v({
    id: V_VDR_SONET, hostId: HOST_AHMEDABAD_ID,
    make: "Kia", model: "Sonet", year: 2024, variant: "HTX+ DCT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Glacier White Pearl", registrationNumber: "GJ06XX5096",
    latitude: "22.3000000", longitude: "73.1750000",
    address: "Akota, Vadodara", city: "Vadodara",
    baseDailyRate: 95000, weekendRate: 115000, minPrice: 80000,
    features: ["sunroof", "ventilated_seats", "apple_carplay", "android_auto", "air_purifier"],
    ratingAvg: "4.3", tripCount: 14, reviewCount: 11,
  }),
  v({
    id: V_VDR_VENUE, hostId: HOST_AHMEDABAD_ID,
    make: "Hyundai", model: "Venue", year: 2024, variant: "SX+ DCT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Titan Grey", registrationNumber: "GJ06XX5097",
    latitude: "22.3200000", longitude: "73.2000000",
    address: "Fatehgunj, Vadodara", city: "Vadodara",
    baseDailyRate: 85000, weekendRate: 102000, minPrice: 70000,
    features: ["connected_car", "sunroof", "apple_carplay", "android_auto", "wireless_charging"],
    ratingAvg: "4.3", tripCount: 16, reviewCount: 13, instantBooking: false,
  }),

  // ── Agra (new) ────────────────────────────────────────────────
  v({
    id: V_AGR_PUNCH, hostId: HOST_LUCKNOW_ID,
    make: "Tata", model: "Punch", year: 2024, variant: "Creative AMT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Tropical Mist", registrationNumber: "UP80XX5098",
    latitude: "27.1800000", longitude: "78.0200000",
    address: "Civil Lines, Agra", city: "Agra",
    baseDailyRate: 65000, weekendRate: 78000, minPrice: 55000,
    features: ["apple_carplay", "android_auto", "rear_camera", "cruise_control"],
    ratingAvg: "4.3", tripCount: 22, reviewCount: 18,
  }),
  v({
    id: V_AGR_I20, hostId: HOST_LUCKNOW_ID,
    make: "Hyundai", model: "i20", year: 2024, variant: "Sportz iVT",
    vehicleType: "hatchback", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Fiery Red", registrationNumber: "UP80XX5099",
    latitude: "27.1700000", longitude: "78.0000000",
    address: "Dayal Bagh, Agra", city: "Agra",
    baseDailyRate: 75000, weekendRate: 90000, minPrice: 62000,
    features: ["sunroof", "apple_carplay", "android_auto", "wireless_charging", "connected_car"],
    ratingAvg: "4.3", tripCount: 28, reviewCount: 22,
  }),
  v({
    id: V_AGR_SONET, hostId: HOST_LUCKNOW_ID,
    make: "Kia", model: "Sonet", year: 2024, variant: "HTX+ DCT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Intense Red", registrationNumber: "UP80XX5100",
    latitude: "27.1900000", longitude: "77.9900000",
    address: "Sikandra, Agra", city: "Agra",
    baseDailyRate: 95000, weekendRate: 115000, minPrice: 80000,
    features: ["sunroof", "ventilated_seats", "apple_carplay", "android_auto", "air_purifier"],
    ratingAvg: "4.4", tripCount: 18, reviewCount: 14,
  }),

  // ── Jodhpur (new) ─────────────────────────────────────────────
  v({
    id: V_JDH_PUNCH, hostId: HOST_JAIPUR_ID,
    make: "Tata", model: "Punch", year: 2024, variant: "Creative AMT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Pristine White", registrationNumber: "RJ19XX5101",
    latitude: "26.2450000", longitude: "73.0200000",
    address: "Ratanada, Jodhpur", city: "Jodhpur",
    baseDailyRate: 65000, weekendRate: 78000, minPrice: 55000,
    features: ["apple_carplay", "android_auto", "rear_camera", "cruise_control"],
    ratingAvg: "4.2", tripCount: 20, reviewCount: 16,
  }),
  v({
    id: V_JDH_VENUE, hostId: HOST_JAIPUR_ID,
    make: "Hyundai", model: "Venue", year: 2024, variant: "SX+ DCT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Denim Blue", registrationNumber: "RJ19XX5102",
    latitude: "26.2500000", longitude: "73.0350000",
    address: "Shastri Nagar, Jodhpur", city: "Jodhpur",
    baseDailyRate: 85000, weekendRate: 102000, minPrice: 70000,
    features: ["connected_car", "sunroof", "apple_carplay", "android_auto", "wireless_charging"],
    ratingAvg: "4.3", tripCount: 16, reviewCount: 12,
  }),
  v({
    id: V_JDH_BREZZA, hostId: HOST_JAIPUR_ID,
    make: "Maruti Suzuki", model: "Brezza", year: 2024, variant: "ZXi+ AT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Brave Khaki", registrationNumber: "RJ19XX5103",
    latitude: "26.2300000", longitude: "73.0150000",
    address: "Pal Road, Jodhpur", city: "Jodhpur",
    baseDailyRate: 105000, weekendRate: 126000, minPrice: 88000,
    features: ["sunroof", "heads_up_display", "360_camera", "wireless_charging"],
    ratingAvg: "4.4", tripCount: 14, reviewCount: 11, instantBooking: false,
  }),

  // ── Aurangabad (new) ─────────────────────────────────────────
  v({
    id: V_AUR_PUNCH, hostId: HOST_PUNE_ID,
    make: "Tata", model: "Punch", year: 2024, variant: "Creative AMT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Tornado Blue", registrationNumber: "MH20XX5104",
    latitude: "19.8800000", longitude: "75.3500000",
    address: "Jalna Road, Aurangabad", city: "Aurangabad",
    baseDailyRate: 65000, weekendRate: 78000, minPrice: 55000,
    features: ["apple_carplay", "android_auto", "rear_camera", "cruise_control"],
    ratingAvg: "4.2", tripCount: 16, reviewCount: 12,
  }),
  v({
    id: V_AUR_CRETA, hostId: HOST_MUMBAI_ID,
    make: "Hyundai", model: "Creta", year: 2024, variant: "SX(O) AT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Atlas White", registrationNumber: "MH20XX5105",
    latitude: "19.8700000", longitude: "75.3300000",
    address: "Osmanpura, Aurangabad", city: "Aurangabad",
    baseDailyRate: 170000, weekendRate: 204000, minPrice: 142000,
    features: ["sunroof", "ventilated_seats", "360_camera", "bose_audio", "wireless_charging"],
    ratingAvg: "4.6", tripCount: 10, reviewCount: 8,
  }),
  v({
    id: V_AUR_BREZZA, hostId: HOST_PUNE_ID,
    make: "Maruti Suzuki", model: "Brezza", year: 2024, variant: "ZXi+ AT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Splendid Silver", registrationNumber: "MH20XX5106",
    latitude: "19.8850000", longitude: "75.3600000",
    address: "Garkheda, Aurangabad", city: "Aurangabad",
    baseDailyRate: 105000, weekendRate: 126000, minPrice: 88000,
    features: ["sunroof", "heads_up_display", "360_camera", "wireless_charging"],
    ratingAvg: "4.3", tripCount: 14, reviewCount: 11,
  }),
  v({
    id: V_AUR_SONET, hostId: HOST_MUMBAI_ID,
    make: "Kia", model: "Sonet", year: 2024, variant: "HTX+ DCT",
    vehicleType: "suv", fuelType: "petrol", transmission: "automatic", seats: 5,
    color: "Glacier White Pearl", registrationNumber: "MH20XX5107",
    latitude: "19.8650000", longitude: "75.3400000",
    address: "Samarth Nagar, Aurangabad", city: "Aurangabad",
    baseDailyRate: 95000, weekendRate: 115000, minPrice: 80000,
    features: ["sunroof", "ventilated_seats", "apple_carplay", "android_auto", "air_purifier"],
    ratingAvg: "4.4", tripCount: 12, reviewCount: 9,
  }),
];
