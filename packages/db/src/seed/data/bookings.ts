import type { NewBooking, NewBookingEvent } from "../../schema/bookings";
import type { NewPayment } from "../../schema/payments";
import type { NewTrip } from "../../schema/trips";
import {
  DEMO_RENTER_ID,
  DEMO_HOST_ID,
  DEMO_FLEET_ID,
  HOST_MUMBAI_ID,
  HOST_DELHI_ID,
  HOST_HYDERABAD_ID,
  HOST_BLR2_ID,
  HOST_BLR3_ID,
  HOST_CHENNAI_ID,
  HOST_PUNE_ID,
  HOST_JAIPUR_ID,
  HOST_KOCHI_ID,
  HOST_GOA_ID,
  HOST_KOLKATA_ID,
  HOST_AHMEDABAD_ID,
  RENTER_IN1_ID,
  RENTER_IN2_ID,
} from "./users";
import {
  V_BLR_SWIFT,
  V_BLR_CRETA,
  V_BLR_SCORPIO,
  V_BLR_NEXON_EV,
  V_BLR_CITY,
  V_BLR_INNOVA,
  V_BLR_SELTOS,
  V_MUM_BALENO,
  V_MUM_I20,
  V_MUM_HARRIER,
  V_MUM_VERNA,
  V_MUM_XUV700,
  V_DEL_DZIRE,
  V_DEL_VENUE,
  V_DEL_FORTUNER,
  V_DEL_SAFARI,
  V_DEL_CRETA,
  V_HYD_AMAZE,
  V_HYD_XUV700,
  V_HYD_INNOVA,
  V_CHN_SWIFT,
  V_CHN_CRETA,
  V_CHN_INNOVA,
  V_PUN_BALENO,
  V_PUN_CRETA,
  V_PUN_HECTOR,
  V_JAI_SWIFT,
  V_JAI_SCORPIO,
  V_JAI_ERTIGA,
  V_KOC_SWIFT,
  V_KOC_CRETA,
  V_KOC_INNOVA,
  V_GOA_SWIFT,
  V_GOA_THAR,
  V_GOA_CRETA,
  V_KOL_BALENO,
  V_KOL_CRETA,
  V_AHM_SWIFT,
  V_AHM_HARRIER,
  V_FLEET_ERTIGA,
  V_FLEET_CITY_MUM,
  V_FLEET_SWIFT_DEL,
  V_FLEET_BREZZA,
  V_FLEET_CRETA_HYD,
} from "./vehicles";

// ── Helpers ──────────────────────────────────────────────────
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(10, 0, 0, 0);
  return d;
}

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(10, 0, 0, 0);
  return d;
}

function bookingId(n: number): string {
  return `c0000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
}

function paymentId(n: number): string {
  return `e0000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
}

function tripId(n: number): string {
  return `f0000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
}

function eventId(n: number): string {
  return `ee000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
}

interface BookingSpec {
  n: number;
  renterId: string;
  vehicleId: string;
  hostId: string;
  status: string;
  startDaysAgo: number;
  durationDays: number;
  currency: string;
  baseRate: number;
  city: string;
  lat: string;
  lng: string;
  address: string;
  factors?: string[];
  cancellationReason?: string;
  cancelledBy?: string;
}

function buildBooking(spec: BookingSpec): {
  booking: NewBooking;
  payment: NewPayment | null;
  trip: NewTrip | null;
  events: NewBookingEvent[];
} {
  const days = spec.durationDays;
  const base = spec.baseRate * days;
  const platformFee = Math.round(base * 0.18);
  const insurance = Math.round(base * 0.055);
  const tax = Math.round((base + platformFee + insurance) * 0.18);
  const total = base + platformFee + insurance + tax;

  const startDate = daysAgo(spec.startDaysAgo);
  const endDate = daysAgo(spec.startDaysAgo - days);
  const isActive = spec.status === "active";
  const isCancelled = spec.status === "cancelled";
  const isCompleted = spec.status === "completed";

  const booking: NewBooking = {
    id: bookingId(spec.n),
    renterId: spec.renterId,
    vehicleId: spec.vehicleId,
    hostId: spec.hostId,
    status: spec.status,
    startDate: isActive ? daysAgo(1) : startDate,
    endDate: isActive ? daysFromNow(2) : endDate,
    pickupLatitude: spec.lat,
    pickupLongitude: spec.lng,
    pickupAddress: spec.address,
    dropoffLatitude: spec.lat,
    dropoffLongitude: spec.lng,
    dropoffAddress: spec.address,
    totalAmount: total,
    currency: spec.currency,
    priceBreakdown: {
      base,
      surge: 0,
      platformFee,
      insurance,
      tax,
      total,
      factors: spec.factors || [],
    },
    cancellationReason: isCancelled ? (spec.cancellationReason || "Plans changed") : null,
    cancelledBy: isCancelled ? (spec.cancelledBy || spec.renterId) : null,
    cancelledAt: isCancelled ? daysAgo(spec.startDaysAgo + 1) : null,
    addons: [],
    version: 1,
  };

  const payment: NewPayment | null =
    isCancelled
      ? null
      : {
          id: paymentId(spec.n),
          bookingId: bookingId(spec.n),
          userId: spec.renterId,
          amount: total,
          currency: spec.currency,
          type: "charge",
          status: isCompleted || isActive ? "captured" : "authorized",
          method: "upi",
          gatewayReference: `pay_inr_${spec.n}_${Date.now().toString(36)}`,
          idempotencyKey: `idem_${spec.n}_${bookingId(spec.n).slice(0, 8)}`,
          metadata: { gateway: "razorpay" },
        };

  const trip: NewTrip | null =
    isCompleted || isActive
      ? {
          id: tripId(spec.n),
          bookingId: bookingId(spec.n),
          status: isCompleted ? "completed" : "in_progress",
          actualStart: isActive ? daysAgo(1) : startDate,
          actualEnd: isCompleted ? endDate : null,
          startOdometer: 15000 + spec.n * 1000,
          endOdometer: isCompleted ? 15000 + spec.n * 1000 + days * 120 : null,
          startFuelLevel: "0.90",
          endFuelLevel: isCompleted ? "0.65" : null,
          preInspection: { exterior: "good", interior: "good", tires: "good", photos: 4 },
          postInspection: isCompleted
            ? { exterior: "good", interior: "good", tires: "good", photos: 4 }
            : null,
        }
      : null;

  const events: NewBookingEvent[] = [];
  let eventNum = spec.n * 10;

  events.push({
    id: eventId(eventNum++),
    bookingId: bookingId(spec.n),
    eventType: "created",
    data: { source: "web", currency: spec.currency },
    actorId: spec.renterId,
    actorType: "user",
  });

  if (!isCancelled) {
    events.push({
      id: eventId(eventNum++),
      bookingId: bookingId(spec.n),
      eventType: "confirmed",
      data: { paymentId: paymentId(spec.n) },
      actorId: spec.hostId,
      actorType: "user",
    });
  }

  if (isCompleted) {
    events.push({
      id: eventId(eventNum++),
      bookingId: bookingId(spec.n),
      eventType: "trip_started",
      data: { odometer: 15000 + spec.n * 1000 },
      actorId: spec.renterId,
      actorType: "user",
    });
    events.push({
      id: eventId(eventNum++),
      bookingId: bookingId(spec.n),
      eventType: "completed",
      data: { odometer: 15000 + spec.n * 1000 + days * 120 },
      actorId: spec.renterId,
      actorType: "user",
    });
  }

  if (isCancelled) {
    events.push({
      id: eventId(eventNum++),
      bookingId: bookingId(spec.n),
      eventType: "cancelled",
      data: { reason: spec.cancellationReason || "Plans changed", by: spec.cancelledBy || spec.renterId },
      actorId: spec.renterId,
      actorType: "user",
    });
  }

  return { booking, payment, trip, events };
}

// ── Booking Specifications ───────────────────────────────────
const bookingSpecs: BookingSpec[] = [
  // ── Bangalore ─────────────────────────────────────────────
  { n: 1, renterId: DEMO_RENTER_ID, vehicleId: V_BLR_SWIFT, hostId: DEMO_HOST_ID, status: "completed", startDaysAgo: 85, durationDays: 3, currency: "INR", baseRate: 80000, city: "Bangalore", lat: "12.9352", lng: "77.6245", address: "Koramangala, Bangalore" },
  { n: 2, renterId: DEMO_RENTER_ID, vehicleId: V_BLR_CRETA, hostId: DEMO_HOST_ID, status: "completed", startDaysAgo: 60, durationDays: 2, currency: "INR", baseRate: 180000, city: "Bangalore", lat: "12.9784", lng: "77.6408", address: "Indiranagar, Bangalore", factors: ["Weekend +15%"] },
  { n: 3, renterId: DEMO_RENTER_ID, vehicleId: V_BLR_INNOVA, hostId: HOST_BLR2_ID, status: "completed", startDaysAgo: 42, durationDays: 5, currency: "INR", baseRate: 250000, city: "Bangalore", lat: "12.9784", lng: "77.6408", address: "Indiranagar, Bangalore" },
  { n: 4, renterId: DEMO_RENTER_ID, vehicleId: V_FLEET_ERTIGA, hostId: DEMO_FLEET_ID, status: "completed", startDaysAgo: 20, durationDays: 2, currency: "INR", baseRate: 130000, city: "Bangalore", lat: "12.9352", lng: "77.6245", address: "Koramangala, Bangalore" },
  { n: 5, renterId: DEMO_RENTER_ID, vehicleId: V_BLR_NEXON_EV, hostId: DEMO_HOST_ID, status: "active", startDaysAgo: 1, durationDays: 3, currency: "INR", baseRate: 160000, city: "Bangalore", lat: "12.9698", lng: "77.7500", address: "Whitefield, Bangalore" },
  { n: 6, renterId: DEMO_RENTER_ID, vehicleId: V_BLR_SCORPIO, hostId: DEMO_HOST_ID, status: "cancelled", startDaysAgo: 30, durationDays: 4, currency: "INR", baseRate: 220000, city: "Bangalore", lat: "12.9116", lng: "77.6474", address: "HSR Layout, Bangalore", cancellationReason: "Trip plans changed due to weather", cancelledBy: undefined },
  { n: 7, renterId: RENTER_IN1_ID, vehicleId: V_BLR_SWIFT, hostId: DEMO_HOST_ID, status: "completed", startDaysAgo: 75, durationDays: 1, currency: "INR", baseRate: 80000, city: "Bangalore", lat: "12.9352", lng: "77.6245", address: "Koramangala, Bangalore" },
  { n: 8, renterId: RENTER_IN1_ID, vehicleId: V_BLR_CITY, hostId: DEMO_HOST_ID, status: "completed", startDaysAgo: 50, durationDays: 3, currency: "INR", baseRate: 150000, city: "Bangalore", lat: "12.9250", lng: "77.5897", address: "Jayanagar, Bangalore" },
  { n: 9, renterId: RENTER_IN2_ID, vehicleId: V_BLR_SELTOS, hostId: HOST_BLR3_ID, status: "completed", startDaysAgo: 45, durationDays: 2, currency: "INR", baseRate: 170000, city: "Bangalore", lat: "12.9500", lng: "77.5700", address: "Basavanagudi, Bangalore" },
  { n: 10, renterId: RENTER_IN2_ID, vehicleId: V_BLR_CRETA, hostId: DEMO_HOST_ID, status: "completed", startDaysAgo: 25, durationDays: 4, currency: "INR", baseRate: 180000, city: "Bangalore", lat: "12.9784", lng: "77.6408", address: "Indiranagar, Bangalore" },
  { n: 11, renterId: RENTER_IN1_ID, vehicleId: V_BLR_NEXON_EV, hostId: DEMO_HOST_ID, status: "completed", startDaysAgo: 15, durationDays: 2, currency: "INR", baseRate: 160000, city: "Bangalore", lat: "12.9698", lng: "77.7500", address: "Whitefield, Bangalore" },

  // ── Mumbai ────────────────────────────────────────────────
  { n: 12, renterId: RENTER_IN2_ID, vehicleId: V_MUM_BALENO, hostId: HOST_MUMBAI_ID, status: "completed", startDaysAgo: 70, durationDays: 2, currency: "INR", baseRate: 85000, city: "Mumbai", lat: "19.0596", lng: "72.8295", address: "Bandra West, Mumbai" },
  { n: 13, renterId: DEMO_RENTER_ID, vehicleId: V_MUM_I20, hostId: HOST_MUMBAI_ID, status: "completed", startDaysAgo: 55, durationDays: 3, currency: "INR", baseRate: 90000, city: "Mumbai", lat: "19.1136", lng: "72.8697", address: "Andheri West, Mumbai" },
  { n: 14, renterId: RENTER_IN1_ID, vehicleId: V_MUM_HARRIER, hostId: HOST_MUMBAI_ID, status: "completed", startDaysAgo: 35, durationDays: 1, currency: "INR", baseRate: 200000, city: "Mumbai", lat: "19.0176", lng: "72.8562", address: "Prabhadevi, Mumbai", factors: ["Weekend +15%"] },
  { n: 15, renterId: RENTER_IN2_ID, vehicleId: V_FLEET_CITY_MUM, hostId: DEMO_FLEET_ID, status: "completed", startDaysAgo: 22, durationDays: 5, currency: "INR", baseRate: 140000, city: "Mumbai", lat: "19.0176", lng: "72.8562", address: "Dadar, Mumbai" },
  { n: 16, renterId: RENTER_IN1_ID, vehicleId: V_MUM_BALENO, hostId: HOST_MUMBAI_ID, status: "cancelled", startDaysAgo: 10, durationDays: 2, currency: "INR", baseRate: 85000, city: "Mumbai", lat: "19.0596", lng: "72.8295", address: "Bandra West, Mumbai", cancellationReason: "Found alternative transport", cancelledBy: undefined },
  { n: 17, renterId: DEMO_RENTER_ID, vehicleId: V_MUM_VERNA, hostId: HOST_MUMBAI_ID, status: "completed", startDaysAgo: 18, durationDays: 2, currency: "INR", baseRate: 160000, city: "Mumbai", lat: "19.0430", lng: "72.8200", address: "Worli, Mumbai" },
  { n: 18, renterId: RENTER_IN1_ID, vehicleId: V_MUM_XUV700, hostId: HOST_MUMBAI_ID, status: "completed", startDaysAgo: 8, durationDays: 3, currency: "INR", baseRate: 260000, city: "Mumbai", lat: "19.1800", lng: "72.9600", address: "Mulund, Mumbai" },

  // ── Delhi NCR ─────────────────────────────────────────────
  { n: 19, renterId: RENTER_IN1_ID, vehicleId: V_DEL_DZIRE, hostId: HOST_DELHI_ID, status: "completed", startDaysAgo: 80, durationDays: 2, currency: "INR", baseRate: 90000, city: "Delhi", lat: "28.6280", lng: "77.2190", address: "Connaught Place, Delhi" },
  { n: 20, renterId: RENTER_IN2_ID, vehicleId: V_DEL_VENUE, hostId: HOST_DELHI_ID, status: "completed", startDaysAgo: 65, durationDays: 3, currency: "INR", baseRate: 130000, city: "Delhi", lat: "28.5700", lng: "77.2100", address: "Saket, Delhi" },
  { n: 21, renterId: DEMO_RENTER_ID, vehicleId: V_DEL_FORTUNER, hostId: HOST_DELHI_ID, status: "completed", startDaysAgo: 40, durationDays: 7, currency: "INR", baseRate: 450000, city: "Delhi", lat: "28.6500", lng: "77.2300", address: "Karol Bagh, Delhi", factors: ["Weekly -10%"] },
  { n: 22, renterId: RENTER_IN1_ID, vehicleId: V_FLEET_SWIFT_DEL, hostId: DEMO_FLEET_ID, status: "completed", startDaysAgo: 18, durationDays: 1, currency: "INR", baseRate: 75000, city: "Delhi", lat: "28.6139", lng: "77.2090", address: "Janpath, Delhi" },
  { n: 23, renterId: RENTER_IN2_ID, vehicleId: V_FLEET_BREZZA, hostId: DEMO_FLEET_ID, status: "completed", startDaysAgo: 8, durationDays: 4, currency: "INR", baseRate: 115000, city: "Pune", lat: "18.5204", lng: "73.8567", address: "Shivajinagar, Pune" },
  { n: 24, renterId: DEMO_RENTER_ID, vehicleId: V_DEL_SAFARI, hostId: HOST_DELHI_ID, status: "completed", startDaysAgo: 12, durationDays: 3, currency: "INR", baseRate: 230000, city: "Delhi", lat: "28.6300", lng: "77.2400", address: "ITO, Delhi" },
  { n: 25, renterId: RENTER_IN1_ID, vehicleId: V_DEL_CRETA, hostId: HOST_DELHI_ID, status: "active", startDaysAgo: 1, durationDays: 3, currency: "INR", baseRate: 175000, city: "Delhi", lat: "28.5500", lng: "77.2000", address: "Vasant Kunj, Delhi" },

  // ── Hyderabad ─────────────────────────────────────────────
  { n: 26, renterId: RENTER_IN1_ID, vehicleId: V_HYD_AMAZE, hostId: HOST_HYDERABAD_ID, status: "completed", startDaysAgo: 72, durationDays: 3, currency: "INR", baseRate: 85000, city: "Hyderabad", lat: "17.4400", lng: "78.3489", address: "Jubilee Hills, Hyderabad" },
  { n: 27, renterId: RENTER_IN2_ID, vehicleId: V_HYD_XUV700, hostId: HOST_HYDERABAD_ID, status: "completed", startDaysAgo: 48, durationDays: 2, currency: "INR", baseRate: 270000, city: "Hyderabad", lat: "17.3850", lng: "78.4867", address: "Hitech City, Hyderabad" },
  { n: 28, renterId: DEMO_RENTER_ID, vehicleId: V_FLEET_CRETA_HYD, hostId: DEMO_FLEET_ID, status: "completed", startDaysAgo: 28, durationDays: 3, currency: "INR", baseRate: 165000, city: "Hyderabad", lat: "17.3850", lng: "78.4867", address: "Madhapur, Hyderabad" },
  { n: 29, renterId: RENTER_IN1_ID, vehicleId: V_HYD_INNOVA, hostId: HOST_HYDERABAD_ID, status: "completed", startDaysAgo: 14, durationDays: 2, currency: "INR", baseRate: 280000, city: "Hyderabad", lat: "17.4100", lng: "78.4400", address: "Banjara Hills, Hyderabad" },

  // ── Chennai ───────────────────────────────────────────────
  { n: 30, renterId: RENTER_IN2_ID, vehicleId: V_CHN_SWIFT, hostId: HOST_CHENNAI_ID, status: "completed", startDaysAgo: 62, durationDays: 2, currency: "INR", baseRate: 70000, city: "Chennai", lat: "13.0600", lng: "80.2500", address: "T Nagar, Chennai" },
  { n: 31, renterId: DEMO_RENTER_ID, vehicleId: V_CHN_CRETA, hostId: HOST_CHENNAI_ID, status: "completed", startDaysAgo: 38, durationDays: 3, currency: "INR", baseRate: 170000, city: "Chennai", lat: "13.0827", lng: "80.2707", address: "Anna Nagar, Chennai" },
  { n: 32, renterId: RENTER_IN1_ID, vehicleId: V_CHN_INNOVA, hostId: HOST_CHENNAI_ID, status: "completed", startDaysAgo: 22, durationDays: 4, currency: "INR", baseRate: 240000, city: "Chennai", lat: "13.0400", lng: "80.2400", address: "Mylapore, Chennai" },

  // ── Pune ──────────────────────────────────────────────────
  { n: 33, renterId: RENTER_IN2_ID, vehicleId: V_PUN_BALENO, hostId: HOST_PUNE_ID, status: "completed", startDaysAgo: 58, durationDays: 2, currency: "INR", baseRate: 78000, city: "Pune", lat: "18.5204", lng: "73.8567", address: "Koregaon Park, Pune" },
  { n: 34, renterId: RENTER_IN1_ID, vehicleId: V_PUN_CRETA, hostId: HOST_PUNE_ID, status: "completed", startDaysAgo: 30, durationDays: 3, currency: "INR", baseRate: 165000, city: "Pune", lat: "18.5600", lng: "73.9100", address: "Viman Nagar, Pune" },
  { n: 35, renterId: DEMO_RENTER_ID, vehicleId: V_PUN_HECTOR, hostId: HOST_PUNE_ID, status: "completed", startDaysAgo: 15, durationDays: 2, currency: "INR", baseRate: 185000, city: "Pune", lat: "18.5300", lng: "73.8800", address: "Kalyani Nagar, Pune", factors: ["Weekend +15%"] },

  // ── Jaipur ────────────────────────────────────────────────
  { n: 36, renterId: RENTER_IN1_ID, vehicleId: V_JAI_SWIFT, hostId: HOST_JAIPUR_ID, status: "completed", startDaysAgo: 52, durationDays: 2, currency: "INR", baseRate: 60000, city: "Jaipur", lat: "26.9124", lng: "75.7873", address: "C-Scheme, Jaipur" },
  { n: 37, renterId: RENTER_IN2_ID, vehicleId: V_JAI_SCORPIO, hostId: HOST_JAIPUR_ID, status: "completed", startDaysAgo: 32, durationDays: 3, currency: "INR", baseRate: 200000, city: "Jaipur", lat: "26.9200", lng: "75.7800", address: "Malviya Nagar, Jaipur" },
  { n: 38, renterId: DEMO_RENTER_ID, vehicleId: V_JAI_ERTIGA, hostId: HOST_JAIPUR_ID, status: "completed", startDaysAgo: 10, durationDays: 5, currency: "INR", baseRate: 125000, city: "Jaipur", lat: "26.9000", lng: "75.8000", address: "Vaishali Nagar, Jaipur" },

  // ── Kochi ─────────────────────────────────────────────────
  { n: 39, renterId: RENTER_IN1_ID, vehicleId: V_KOC_SWIFT, hostId: HOST_KOCHI_ID, status: "completed", startDaysAgo: 45, durationDays: 3, currency: "INR", baseRate: 65000, city: "Kochi", lat: "9.9312", lng: "76.2673", address: "MG Road, Kochi" },
  { n: 40, renterId: DEMO_RENTER_ID, vehicleId: V_KOC_CRETA, hostId: HOST_KOCHI_ID, status: "completed", startDaysAgo: 25, durationDays: 2, currency: "INR", baseRate: 160000, city: "Kochi", lat: "9.9500", lng: "76.2800", address: "Edappally, Kochi" },
  { n: 41, renterId: RENTER_IN2_ID, vehicleId: V_KOC_INNOVA, hostId: HOST_KOCHI_ID, status: "completed", startDaysAgo: 12, durationDays: 4, currency: "INR", baseRate: 240000, city: "Kochi", lat: "9.9200", lng: "76.2600", address: "Marine Drive, Kochi" },

  // ── Goa ───────────────────────────────────────────────────
  { n: 42, renterId: DEMO_RENTER_ID, vehicleId: V_GOA_THAR, hostId: HOST_GOA_ID, status: "completed", startDaysAgo: 35, durationDays: 3, currency: "INR", baseRate: 250000, city: "Goa", lat: "15.4800", lng: "73.8100", address: "Miramar, Goa", factors: ["Weekend +15%"] },
  { n: 43, renterId: RENTER_IN1_ID, vehicleId: V_GOA_SWIFT, hostId: HOST_GOA_ID, status: "completed", startDaysAgo: 20, durationDays: 4, currency: "INR", baseRate: 75000, city: "Goa", lat: "15.4909", lng: "73.8278", address: "Panaji, Goa" },
  { n: 44, renterId: RENTER_IN2_ID, vehicleId: V_GOA_CRETA, hostId: HOST_GOA_ID, status: "completed", startDaysAgo: 7, durationDays: 2, currency: "INR", baseRate: 180000, city: "Goa", lat: "15.5000", lng: "73.8300", address: "Calangute, Goa" },

  // ── Kolkata ───────────────────────────────────────────────
  { n: 45, renterId: RENTER_IN1_ID, vehicleId: V_KOL_BALENO, hostId: HOST_KOLKATA_ID, status: "completed", startDaysAgo: 50, durationDays: 2, currency: "INR", baseRate: 72000, city: "Kolkata", lat: "22.5726", lng: "88.3639", address: "Salt Lake, Kolkata" },
  { n: 46, renterId: RENTER_IN2_ID, vehicleId: V_KOL_CRETA, hostId: HOST_KOLKATA_ID, status: "completed", startDaysAgo: 28, durationDays: 3, currency: "INR", baseRate: 160000, city: "Kolkata", lat: "22.5400", lng: "88.3500", address: "Park Street, Kolkata" },

  // ── Ahmedabad ─────────────────────────────────────────────
  { n: 47, renterId: RENTER_IN2_ID, vehicleId: V_AHM_SWIFT, hostId: HOST_AHMEDABAD_ID, status: "completed", startDaysAgo: 42, durationDays: 2, currency: "INR", baseRate: 62000, city: "Ahmedabad", lat: "23.0225", lng: "72.5714", address: "CG Road, Ahmedabad" },
  { n: 48, renterId: RENTER_IN1_ID, vehicleId: V_AHM_HARRIER, hostId: HOST_AHMEDABAD_ID, status: "completed", startDaysAgo: 18, durationDays: 3, currency: "INR", baseRate: 195000, city: "Ahmedabad", lat: "23.0300", lng: "72.5800", address: "SG Highway, Ahmedabad" },

  // ── More volume ───────────────────────────────────────────
  { n: 49, renterId: RENTER_IN1_ID, vehicleId: V_BLR_SWIFT, hostId: DEMO_HOST_ID, status: "completed", startDaysAgo: 90, durationDays: 2, currency: "INR", baseRate: 80000, city: "Bangalore", lat: "12.9352", lng: "77.6245", address: "Koramangala, Bangalore" },
  { n: 50, renterId: RENTER_IN2_ID, vehicleId: V_BLR_CITY, hostId: DEMO_HOST_ID, status: "completed", startDaysAgo: 88, durationDays: 1, currency: "INR", baseRate: 150000, city: "Bangalore", lat: "12.9250", lng: "77.5897", address: "Jayanagar, Bangalore" },
  { n: 51, renterId: RENTER_IN1_ID, vehicleId: V_DEL_DZIRE, hostId: HOST_DELHI_ID, status: "completed", startDaysAgo: 56, durationDays: 3, currency: "INR", baseRate: 90000, city: "Delhi", lat: "28.6280", lng: "77.2190", address: "Connaught Place, Delhi" },
  { n: 52, renterId: RENTER_IN2_ID, vehicleId: V_MUM_BALENO, hostId: HOST_MUMBAI_ID, status: "completed", startDaysAgo: 32, durationDays: 2, currency: "INR", baseRate: 85000, city: "Mumbai", lat: "19.0596", lng: "72.8295", address: "Bandra West, Mumbai", factors: ["Weekend +15%"] },
  { n: 53, renterId: DEMO_RENTER_ID, vehicleId: V_CHN_INNOVA, hostId: HOST_CHENNAI_ID, status: "cancelled", startDaysAgo: 5, durationDays: 2, currency: "INR", baseRate: 240000, city: "Chennai", lat: "13.0400", lng: "80.2400", address: "Mylapore, Chennai", cancellationReason: "Schedule conflict", cancelledBy: undefined },
];

// ── Build all data ───────────────────────────────────────────
const results = bookingSpecs.map((spec) => buildBooking(spec));

export const seedBookings: NewBooking[] = results.map((r) => r.booking);
export const seedPayments: NewPayment[] = results.filter((r) => r.payment).map((r) => r.payment!);
export const seedTrips: NewTrip[] = results.filter((r) => r.trip).map((r) => r.trip!);
export const seedBookingEvents: NewBookingEvent[] = results.flatMap((r) => r.events);
