import { EventEmitter } from "events";

export type EventMap = {
  "booking.created": { bookingId: string; vehicleId: string; renterId: string; hostId: string };
  "booking.confirmed": { bookingId: string; vehicleId: string; renterId: string; hostId: string };
  "booking.cancelled": {
    bookingId: string;
    vehicleId: string;
    renterId: string;
    hostId: string;
    reason: string;
    refundAmount: number;
  };
  "booking.completed": { bookingId: string; vehicleId: string; renterId: string; hostId: string };
  "booking.modified": { bookingId: string; changes: Record<string, unknown> };

  "vehicle.created": { vehicleId: string; hostId: string };
  "vehicle.updated": { vehicleId: string; changes: Record<string, unknown> };
  "vehicle.listed": { vehicleId: string };
  "vehicle.unlisted": { vehicleId: string };

  "trip.started": { tripId: string; bookingId: string };
  "trip.location_updated": {
    tripId: string;
    latitude: number;
    longitude: number;
    speed: number | null;
  };
  "trip.completed": { tripId: string; bookingId: string };

  "payment.captured": { paymentId: string; bookingId: string; amount: number };
  "payment.refunded": { paymentId: string; bookingId: string; amount: number };
  "payment.failed": { paymentId: string; bookingId: string; error: string };

  "review.created": {
    reviewId: string;
    bookingId: string;
    vehicleId: string | null;
    rating: number;
  };

  "pricing.demand_updated": { h3Index: string; demandScore: number };

  "notification.send": {
    userId: string;
    type: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
  };
};

type EventName = keyof EventMap;

class TypedEventBus {
  private emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(50);
  }

  /** Dispatch an event locally (used by the outbox processor to invoke registered handlers). */
  publish<E extends EventName>(event: E, data: EventMap[E]): void {
    this.emitter.emit(event, data);
  }

  subscribe<E extends EventName>(
    event: E,
    handler: (data: EventMap[E]) => void | Promise<void>
  ): () => void {
    const wrappedHandler = async (data: EventMap[E]) => {
      try {
        await handler(data);
      } catch (error) {
        console.error(`Event handler error for ${event}:`, error);
      }
    };
    this.emitter.on(event, wrappedHandler);
    return () => this.emitter.off(event, wrappedHandler);
  }
}

export const eventBus = new TypedEventBus();
export type { EventName };
