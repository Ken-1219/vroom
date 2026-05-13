import { NextRequest } from "next/server";
import { paymentService } from "@/services/payment";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { registerEventHandlers } from "@/lib/event-handlers";

registerEventHandlers();

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
    const event = raw?.event;
    const payload = raw?.payload;

    if (!event || typeof event !== "string" || !payload) {
      return Response.json({ error: "Invalid webhook payload" }, { status: 400 });
    }

    await paymentService.handleWebhookEvent(event, payload);

    return Response.json({ status: "ok" });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return Response.json({ status: "ok" });
  }
}
