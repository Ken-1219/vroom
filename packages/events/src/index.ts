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
  "review.auto_flagged": { reviewId: string; reason: string };
  "review.flagged": { reviewId: string; reason: string };
  "review.hidden": { reviewId: string; reason: string };
  "review.published": { reviewId: string };

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
  private handlers = new Map<string, ((data: any) => Promise<void>)[]>();

  async publish<E extends EventName>(event: E, data: EventMap[E]): Promise<void> {
    const fns = this.handlers.get(event) ?? [];
    if (fns.length === 0) return;
    const results = await Promise.allSettled(fns.map(fn => fn(data)));
    const failures = results.filter(
      (r): r is PromiseRejectedResult => r.status === "rejected"
    );
    if (failures.length > 0) {
      throw new AggregateError(
        failures.map(f => f.reason),
        `${failures.length} handler(s) failed for event "${event}"`
      );
    }
  }

  subscribe<E extends EventName>(
    event: E,
    handler: (data: EventMap[E]) => void | Promise<void>
  ): () => void {
    const asyncHandler = async (data: EventMap[E]) => {
      await handler(data);
    };
    const fns = this.handlers.get(event) ?? [];
    fns.push(asyncHandler as (data: any) => Promise<void>);
    this.handlers.set(event, fns);
    return () => {
      const current = this.handlers.get(event) ?? [];
      this.handlers.set(event, current.filter(f => f !== asyncHandler));
    };
  }
}

export const eventBus = new TypedEventBus();
export type { EventName };
