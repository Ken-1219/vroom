import { z } from "zod";

export const vehicleSearchSchema = z.object({
  query: z.string().optional(),
  city: z.string().optional(),
  country: z.string().length(2).optional(),
  vehicleType: z
    .enum(["sedan", "suv", "hatchback", "luxury", "ev", "mpv"])
    .optional(),
  fuelType: z
    .enum(["petrol", "diesel", "electric", "hybrid", "cng"])
    .optional(),
  transmission: z.enum(["manual", "automatic"]).optional(),
  minSeats: z.coerce.number().int().min(2).optional(),
  maxPrice: z.coerce.number().int().positive().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  features: z.array(z.string()).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().positive().default(10),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sortBy: z
    .enum(["price", "distance", "rating", "relevance"])
    .default("relevance"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(500).default(20),
});

export const createBookingSchema = z
  .object({
    vehicleId: z.string().uuid(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    pickupLatitude: z.number().min(-90).max(90).optional(),
    pickupLongitude: z.number().min(-180).max(180).optional(),
    pickupAddress: z.string().optional(),
    dropoffLatitude: z.number().min(-90).max(90).optional(),
    dropoffLongitude: z.number().min(-180).max(180).optional(),
    dropoffAddress: z.string().optional(),
    protectionPlan: z.enum(["basic", "standard", "premium"]).default("basic"),
    couponCode: z.string().optional(),
    notes: z.string().max(500).optional(),
    addons: z
      .array(
        z.object({ type: z.string(), quantity: z.number().int().positive() })
      )
      .optional(),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: "End date must be after start date",
    path: ["endDate"],
  });

export const cancelBookingSchema = z.object({
  bookingId: z.string().uuid(),
  reason: z.string().min(1).max(500),
});

export const modifyBookingSchema = z
  .object({
    bookingId: z.string().uuid(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    pickupAddress: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) > new Date(data.startDate);
      }
      return true;
    },
    { message: "End date must be after start date", path: ["endDate"] }
  );

export const createVehicleSchema = z.object({
  make: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
  year: z.number().int().min(2000).max(2030),
  variant: z.string().max(100).optional(),
  vehicleType: z.enum(["sedan", "suv", "hatchback", "luxury", "ev", "mpv"]),
  fuelType: z.enum(["petrol", "diesel", "electric", "hybrid", "cng"]),
  transmission: z.enum(["manual", "automatic"]),
  seats: z.number().int().min(2).max(12),
  color: z.string().max(50).optional(),
  registrationNumber: z.string().min(1).max(30),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().optional(),
  city: z.string().min(1).max(100),
  country: z.string().length(2).default("IN"),
  currency: z.string().length(3).default("INR"),
  baseDailyRate: z.number().int().positive(),
  weekendRate: z.number().int().positive().optional(),
  weeklyDiscountPct: z.number().int().min(0).max(80).optional(),
  monthlyDiscountPct: z.number().int().min(0).max(80).optional(),
  description: z.string().max(2000).optional(),
  features: z.array(z.string()).optional(),
  rules: z.record(z.unknown()).optional(),
  photos: z
    .array(
      z.object({
        url: z.string().url(),
        thumbnailUrl: z.string().url().optional(),
        position: z.number().int().min(0),
        isPrimary: z.boolean().default(false),
      })
    )
    .optional(),
  instantBooking: z.boolean().default(false),
});

export const createReviewSchema = z.object({
  bookingId: z.string().uuid(),
  vehicleId: z.string().uuid().optional(),
  type: z.enum(["renter_to_host", "host_to_renter", "renter_to_vehicle"]),
  rating: z.number().int().min(1).max(5),
  subRatings: z
    .object({
      cleanliness: z.number().int().min(1).max(5).optional(),
      accuracy: z.number().int().min(1).max(5).optional(),
      communication: z.number().int().min(1).max(5).optional(),
      value: z.number().int().min(1).max(5).optional(),
    })
    .optional(),
  text: z.string().max(2000).optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// Payment schemas
export const createPaymentOrderSchema = z.object({
  bookingId: z.string().uuid(),
});

export const verifyPaymentSchema = z.object({
  bookingId: z.string().uuid(),
  razorpay_payment_id: z.string().min(1),
  razorpay_order_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export const refundPaymentSchema = z.object({
  bookingId: z.string().uuid(),
  amount: z.number().int().positive().optional(),
  reason: z.string().min(1).max(500),
});

// Booking action schema (accept/reject/cancel)
export const bookingActionSchema = z.object({
  action: z.enum(["cancel", "accept", "reject"]),
  reason: z.string().min(1).max(500).optional(),
});

// Trip schemas
export const startTripSchema = z.object({
  bookingId: z.string().uuid(),
  odometer: z.number().int().nonnegative(),
  fuelLevel: z.number().min(0).max(1),
  preInspection: z.record(z.unknown()),
});

export const endTripSchema = z.object({
  odometer: z.number().int().nonnegative(),
  fuelLevel: z.number().min(0).max(1),
  postInspection: z.record(z.unknown()),
});

export const tripLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  speed: z.number().min(0).optional(),
  heading: z.number().min(0).max(360).optional(),
  recordedAt: z.string().datetime(),
});

// Pricing schemas
export const priceEstimateSchema = z.object({
  vehicleId: z.string().uuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  protectionPlan: z.enum(["basic", "standard", "premium"]).default("basic"),
});

export type PriceEstimateInput = z.infer<typeof priceEstimateSchema>;

// Type exports
export type VehicleSearchParams = z.infer<typeof vehicleSearchSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type CreatePaymentOrderInput = z.infer<typeof createPaymentOrderSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type RefundPaymentInput = z.infer<typeof refundPaymentSchema>;
export type BookingActionInput = z.infer<typeof bookingActionSchema>;
export type StartTripInput = z.infer<typeof startTripSchema>;
export type EndTripInput = z.infer<typeof endTripSchema>;
export type TripLocationInput = z.infer<typeof tripLocationSchema>;
