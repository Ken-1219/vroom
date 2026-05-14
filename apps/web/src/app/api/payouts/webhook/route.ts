import { NextRequest } from "next/server";
import { payoutService } from "@/services/payout";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      return Response.json({ error: "Missing signature" }, { status: 400 });
    }

    const isValid = verifyWebhookSignature(body, signature);
    if (!isValid) {
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }

    const raw = JSON.parse(body);
    const event = raw?.event as string | undefined;
    const payload = raw?.payload as Record<string, unknown> | undefined;

    if (!event || typeof event !== "string" || !payload) {
      return Response.json(
        { error: "Invalid webhook payload" },
        { status: 400 }
      );
    }

    // Only handle payout-related events
    if (event.startsWith("payout.")) {
      await payoutService.handleWebhookEvent(event, payload);
    } else {
      logger.info("Ignoring non-payout webhook event", { event });
    }

    return Response.json({ status: "ok" });
  } catch (error) {
    logger.error("Payout webhook handler error", {
      error: error instanceof Error ? error.message : String(error),
    });
    // Return 200 to prevent Razorpay from retrying on application errors
    return Response.json({ status: "ok" });
  }
}
