interface RazorpayInstance {
  on(event: string, handler: (response: { error?: { description?: string } }) => void): void;
  open(): void;
}

interface RazorpayConstructor {
  new (options: Record<string, unknown>): RazorpayInstance;
}

declare global {
  interface Window {
    Razorpay: RazorpayConstructor;
  }
}

let loadPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
    document.head.appendChild(script);
  });

  return loadPromise;
}

export interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export async function openRazorpayCheckout(
  options: RazorpayCheckoutOptions
): Promise<RazorpayResponse> {
  await loadScript();

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      ...options,
      handler: (response: RazorpayResponse) => resolve(response),
      modal: {
        ondismiss: () => reject(new Error("Payment cancelled by user")),
      },
    });
    rzp.on("payment.failed", (response: { error?: { description?: string } }) => {
      reject(
        new Error(response.error?.description ?? "Payment failed")
      );
    });
    rzp.open();
  });
}
