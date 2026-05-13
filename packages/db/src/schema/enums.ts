import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["renter", "host", "admin"]);
export const userStatusEnum = pgEnum("user_status", ["active", "suspended", "banned"]);

export const vehicleTypeEnum = pgEnum("vehicle_type", ["sedan", "suv", "hatchback", "luxury", "ev", "mpv"]);
export const fuelTypeEnum = pgEnum("fuel_type", ["petrol", "diesel", "electric", "hybrid", "cng"]);
export const transmissionEnum = pgEnum("transmission", ["manual", "automatic"]);
export const vehicleStatusEnum = pgEnum("vehicle_status", ["draft", "listed", "delisted"]);

export const bookingStatusEnum = pgEnum("booking_status", ["pending", "confirmed", "active", "completed", "cancelled"]);

export const paymentTypeEnum = pgEnum("payment_type", ["charge", "refund"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "authorized", "captured", "failed", "refunded"]);
export const paymentMethodEnum = pgEnum("payment_method", ["upi", "card", "netbanking", "wallet"]);

export const tripStatusEnum = pgEnum("trip_status", ["pending", "active", "completed"]);

export const reviewTypeEnum = pgEnum("review_type", ["renter_to_vehicle", "renter_to_host", "host_to_renter"]);
export const reviewStatusEnum = pgEnum("review_status", ["published", "hidden", "flagged"]);

export const pricingScopeEnum = pgEnum("pricing_scope", ["global", "country", "city", "vehicle_type", "vehicle"]);
export const pricingRuleTypeEnum = pgEnum("pricing_rule_type", ["demand_surge", "weekend", "seasonal", "event", "time_decay", "duration"]);

export const notificationChannelEnum = pgEnum("notification_channel", ["in_app", "email", "push", "sms"]);

export const geofenceTypeEnum = pgEnum("geofence_type", ["operating_zone", "restricted_zone"]);

export const vehicleAvailabilityEnum = pgEnum("vehicle_availability_type", ["available", "blocked", "maintenance"]);

export const actorTypeEnum = pgEnum("actor_type", ["user", "system"]);

export const payoutStatusEnum = pgEnum("payout_status", ["pending", "processing", "completed", "failed"]);
