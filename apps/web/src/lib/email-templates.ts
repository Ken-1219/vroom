const BASE_URL = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "https://vroom-cars.vercel.app";

function layout(content: string, previewText = ""): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Vroom</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    @media only screen and (max-width: 620px) {
      .container { width: 100% !important; }
      .col-half { width: 100% !important; display: block !important; }
      .mobile-pad { padding: 24px 20px !important; }
      .otp-text { font-size: 40px !important; letter-spacing: 10px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#F0EFEC;-webkit-font-smoothing:antialiased;">
  ${previewText ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${previewText}&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;</div>` : ""}
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#F0EFEC;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table class="container" width="580" cellpadding="0" cellspacing="0" role="presentation" style="max-width:580px;width:100%;">

          <!-- Logo Bar -->
          <tr>
            <td style="padding:0 0 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td>
                    <span style="font-size:22px;font-weight:900;color:#1A1A1A;letter-spacing:-0.5px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                      <span style="color:#FF4D00;">▲</span> vroom
                    </span>
                  </td>
                  <td align="right" style="font-size:12px;color:#999;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                    Self-drive car rentals
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td style="background-color:#FFFFFF;border-radius:20px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

              <!-- Orange accent strip -->
              <div style="height:4px;background:linear-gradient(90deg,#FF4D00 0%,#FF8C00 100%);"></div>

              <!-- Body -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td class="mobile-pad" style="padding:40px 40px 32px;">
                    ${content}
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 8px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center" style="font-size:12px;color:#999;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.8;">
                    <p style="margin:0 0 4px;">&copy; ${new Date().getFullYear()} Vroom Technologies. All rights reserved.</p>
                    <p style="margin:0 0 4px;">Self-drive car rentals across India &middot; <a href="${BASE_URL}" style="color:#FF4D00;text-decoration:none;">vroom-cars.vercel.app</a></p>
                    <p style="margin:8px 0 0;color:#BBB;">This is an automated email — please do not reply directly.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function statusBadge(label: string, color: string, bg: string): string {
  return `<table cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:24px;">
    <tr>
      <td style="background-color:${bg};border-radius:50px;padding:6px 14px;">
        <span style="font-size:12px;font-weight:700;color:${color};letter-spacing:0.5px;text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${label}</span>
      </td>
    </tr>
  </table>`;
}

function divider(): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:24px 0;">
    <tr><td style="height:1px;background-color:#F0EFEC;"></td></tr>
  </table>`;
}

function ctaButton(label: string, href: string): string {
  return `<table cellpadding="0" cellspacing="0" role="presentation" style="margin-top:32px;">
    <tr>
      <td style="border-radius:50px;background-color:#FF4D00;">
        <a href="${href}" style="display:inline-block;padding:14px 36px;font-size:14px;font-weight:700;color:#FFFFFF;text-decoration:none;letter-spacing:0.2px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${label} &rarr;</a>
      </td>
    </tr>
  </table>`;
}

function infoRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:10px 0;border-bottom:1px solid #F5F5F0;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td style="font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.5px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${label}</td>
          <td align="right" style="font-size:14px;font-weight:600;color:#1A1A1A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${value}</td>
        </tr>
      </table>
    </td>
  </tr>`;
}

// ── Templates ────────────────────────────────────────────────────────────────

export function bookingConfirmedEmail(data: {
  renterName: string;
  vehicleName: string;
  vehicleYear: number;
  pickupDate: string;
  dropoffDate: string;
  pickupAddress: string;
  totalAmount: string;
  pickupOtp: string;
  bookingId: string;
  vehicleId: string;
}): { subject: string; html: string; text: string } {
  const subject = `Your ${data.vehicleName} booking is confirmed ✓`;

  const firstName = data.renterName.split(" ")[0];

  const html = layout(`
    ${statusBadge("✓ Booking Confirmed", "#16A34A", "#F0FDF4")}

    <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#1A1A1A;letter-spacing:-0.5px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.2;">
      You're all set, ${firstName}!
    </h1>
    <p style="margin:0 0 32px;font-size:15px;color:#6B6B6B;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      Your booking has been confirmed and payment received. Here are your trip details.
    </p>

    <!-- Vehicle Card -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#FAFAF8;border:1px solid #E8E6E1;border-radius:14px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td>
                <p style="margin:0 0 2px;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Your Vehicle</p>
                <p style="margin:0;font-size:20px;font-weight:800;color:#1A1A1A;letter-spacing:-0.3px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${data.vehicleName}</p>
                <p style="margin:4px 0 0;font-size:13px;color:#999;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${data.vehicleYear}</p>
              </td>
              <td align="right" valign="middle">
                <span style="font-size:32px;">🚗</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Trip Details -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:24px;">
      ${infoRow("Pick-up", data.pickupDate)}
      ${infoRow("Drop-off", data.dropoffDate)}
      ${infoRow("Location", data.pickupAddress)}
      ${infoRow("Amount Paid", `<span style="color:#16A34A;">${data.totalAmount}</span>`)}
    </table>

    <!-- OTP Box -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#0D0D0D;border-radius:16px;margin-bottom:8px;">
      <tr>
        <td style="padding:28px 24px;text-align:center;">
          <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#FF4D00;text-transform:uppercase;letter-spacing:1.5px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Pickup OTP</p>
          <p class="otp-text" style="margin:0;font-size:48px;font-weight:900;color:#FFFFFF;letter-spacing:14px;font-family:'Courier New',Courier,monospace;line-height:1;">${data.pickupOtp}</p>
          <p style="margin:14px 0 0;font-size:12px;color:#666;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.5;">
            Show this to the host when you pick up the car.<br/>Keep it private — do not share with anyone else.
          </p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 32px;font-size:11px;color:#BBB;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      OTP is valid for the duration of your booking
    </p>

    ${divider()}

    <!-- How it works -->
    <p style="margin:0 0 16px;font-size:14px;font-weight:700;color:#1A1A1A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">How pickup works</p>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      ${[
        ["1", "Go to the pickup location on your start date"],
        ["2", "Meet the host and share your pickup OTP"],
        ["3", "Complete the pre-trip inspection together"],
        ["4", "Host starts the trip — you're good to go!"],
      ].map(([num, text]) => `
      <tr>
        <td valign="top" style="width:28px;padding:0 12px 14px 0;">
          <div style="width:24px;height:24px;border-radius:50%;background:#FF4D00;text-align:center;line-height:24px;font-size:11px;font-weight:700;color:#FFFFFF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${num}</div>
        </td>
        <td style="padding:0 0 14px;font-size:14px;color:#4A4A4A;line-height:1.5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${text}</td>
      </tr>`).join("")}
    </table>

    ${ctaButton("View Booking Details", `${BASE_URL}/bookings/${data.bookingId}`)}
  `, `Your ${data.vehicleName} is confirmed. Pickup OTP: ${data.pickupOtp}`);

  const text = `Booking Confirmed — ${data.vehicleName}

Hi ${firstName},

Your booking has been confirmed and payment received.

Vehicle: ${data.vehicleName} (${data.vehicleYear})
Pick-up: ${data.pickupDate}
Drop-off: ${data.dropoffDate}
Location: ${data.pickupAddress}
Amount Paid: ${data.totalAmount}

PICKUP OTP: ${data.pickupOtp}
Show this to the host at pickup. Keep it private.

View your booking: ${BASE_URL}/bookings/${data.bookingId}

— Vroom`;

  return { subject, html, text };
}

export function tripStartedEmail(data: {
  renterName: string;
  vehicleName: string;
  bookingId: string;
}): { subject: string; html: string; text: string } {
  const subject = `Your trip has started — drive safe! 🚗`;
  const firstName = data.renterName.split(" ")[0];

  const html = layout(`
    ${statusBadge("⚡ Trip Active", "#FF4D00", "#FFF1EB")}

    <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#1A1A1A;letter-spacing:-0.5px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.2;">
      The road is yours, ${firstName}!
    </h1>
    <p style="margin:0 0 32px;font-size:15px;color:#6B6B6B;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      Your trip with the <strong style="color:#1A1A1A;">${data.vehicleName}</strong> is now active. Enjoy the drive!
    </p>

    <!-- Reminder card -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#FAFAF8;border-left:3px solid #FF4D00;border-radius:0 12px 12px 0;margin-bottom:32px;">
      <tr>
        <td style="padding:16px 20px;">
          <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#1A1A1A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Reminder</p>
          <p style="margin:0;font-size:13px;color:#6B6B6B;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
            Return the car to the pickup location by your drop-off time. The host will do a quick post-trip inspection before completing the trip.
          </p>
        </td>
      </tr>
    </table>

    ${ctaButton("View Trip Details", `${BASE_URL}/bookings/${data.bookingId}`)}
  `, `Your trip with ${data.vehicleName} has started. Drive safe!`);

  const text = `Trip Started — ${data.vehicleName}\n\nHi ${firstName}, your trip is now active. Enjoy the drive!\n\nRemember to return the car by your drop-off time.\n\nView trip: ${BASE_URL}/bookings/${data.bookingId}\n\n— Vroom`;

  return { subject, html, text };
}

export function tripCompletedEmail(data: {
  renterName: string;
  vehicleName: string;
  bookingId: string;
}): { subject: string; html: string; text: string } {
  const subject = `Trip completed — thanks for riding with Vroom!`;
  const firstName = data.renterName.split(" ")[0];

  const html = layout(`
    ${statusBadge("✓ Trip Completed", "#16A34A", "#F0FDF4")}

    <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#1A1A1A;letter-spacing:-0.5px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.2;">
      Hope you had a great drive, ${firstName}!
    </h1>
    <p style="margin:0 0 32px;font-size:15px;color:#6B6B6B;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      Your trip with the <strong style="color:#1A1A1A;">${data.vehicleName}</strong> is complete. We'd love to know how it went.
    </p>

    <!-- Review prompt -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#FAFAF8;border:1px solid #E8E6E1;border-radius:14px;margin-bottom:32px;">
      <tr>
        <td style="padding:24px;text-align:center;">
          <p style="margin:0 0 4px;font-size:28px;">⭐</p>
          <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#1A1A1A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Leave a review</p>
          <p style="margin:0;font-size:13px;color:#6B6B6B;line-height:1.5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
            Your feedback helps other renters make better decisions and helps great hosts get recognised.
          </p>
        </td>
      </tr>
    </table>

    ${ctaButton("Rate Your Experience", `${BASE_URL}/bookings/${data.bookingId}/review`)}
  `, `Your trip with ${data.vehicleName} is complete. Leave a review!`);

  const text = `Trip Completed — ${data.vehicleName}\n\nHi ${firstName}, your trip is complete. Thanks for riding with Vroom!\n\nLeave a review: ${BASE_URL}/bookings/${data.bookingId}/review\n\n— Vroom`;

  return { subject, html, text };
}

export function bookingCancelledEmail(data: {
  renterName: string;
  vehicleName: string;
  bookingId: string;
  reason?: string;
  refundAmount?: string;
}): { subject: string; html: string; text: string } {
  const subject = `Your ${data.vehicleName} booking has been cancelled`;
  const firstName = data.renterName.split(" ")[0];

  const refundNote = data.refundAmount
    ? `<p style="margin:0 0 8px;font-size:15px;color:#6B6B6B;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        A refund of <strong style="color:#1A1A1A;">${data.refundAmount}</strong> is being processed and will be credited to your original payment method within 5–7 business days.
      </p>`
    : "";

  const reasonNote = data.reason
    ? `<p style="margin:0 0 24px;font-size:14px;color:#6B6B6B;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <strong style="color:#1A1A1A;">Reason:</strong> ${data.reason}
      </p>`
    : "";

  const html = layout(`
    ${statusBadge("✕ Booking Cancelled", "#DC2626", "#FEF2F2")}

    <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#1A1A1A;letter-spacing:-0.5px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.2;">
      Booking cancelled, ${firstName}
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6B6B6B;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      Your booking for the <strong style="color:#1A1A1A;">${data.vehicleName}</strong> has been cancelled.
    </p>

    ${reasonNote}
    ${refundNote}

    ${divider()}

    <p style="margin:0 0 8px;font-size:14px;color:#6B6B6B;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      Need another ride? Browse hundreds of cars available near you.
    </p>

    ${ctaButton("Browse Cars", `${BASE_URL}/search`)}
  `, `Your ${data.vehicleName} booking has been cancelled.`);

  const refundText = data.refundAmount ? `\nRefund: ${data.refundAmount} (5–7 business days)\n` : "";
  const reasonText = data.reason ? `\nReason: ${data.reason}\n` : "";

  const text = `Booking Cancelled — ${data.vehicleName}\n\nHi ${firstName}, your booking for ${data.vehicleName} has been cancelled.${reasonText}${refundText}\nBrowse cars: ${BASE_URL}/search\n\n— Vroom`;

  return { subject, html, text };
}

export function paymentCapturedEmail(data: {
  renterName: string;
  vehicleName: string;
  amount: string;
  bookingId: string;
}): { subject: string; html: string; text: string } {
  const subject = `Payment received — ${data.amount}`;
  const firstName = data.renterName.split(" ")[0];

  const html = layout(`
    ${statusBadge("✓ Payment Received", "#16A34A", "#F0FDF4")}

    <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#1A1A1A;letter-spacing:-0.5px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.2;">
      Payment confirmed, ${firstName}!
    </h1>
    <p style="margin:0 0 32px;font-size:15px;color:#6B6B6B;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      We've received your payment of <strong style="color:#1A1A1A;">${data.amount}</strong> for the <strong style="color:#1A1A1A;">${data.vehicleName}</strong>.
    </p>

    <!-- Payment summary -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:14px;margin-bottom:32px;">
      <tr>
        <td style="padding:20px 24px;text-align:center;">
          <p style="margin:0 0 4px;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Amount Paid</p>
          <p style="margin:0;font-size:28px;font-weight:900;color:#16A34A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${data.amount}</p>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 8px;font-size:14px;color:#6B6B6B;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      The host will review your booking shortly. You'll receive a confirmation email once your booking is accepted.
    </p>

    ${ctaButton("View Booking", `${BASE_URL}/bookings/${data.bookingId}`)}
  `, `Payment of ${data.amount} received for your ${data.vehicleName} booking.`);

  const text = `Payment Received — ${data.amount}\n\nHi ${firstName}, we've received your payment of ${data.amount} for ${data.vehicleName}.\n\nView booking: ${BASE_URL}/bookings/${data.bookingId}\n\n— Vroom`;

  return { subject, html, text };
}

export function refundProcessedEmail(data: {
  renterName: string;
  vehicleName: string;
  amount: string;
  bookingId: string;
}): { subject: string; html: string; text: string } {
  const subject = `Refund processed — ${data.amount}`;
  const firstName = data.renterName.split(" ")[0];

  const html = layout(`
    ${statusBadge("↩ Refund Processed", "#2563EB", "#EFF6FF")}

    <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#1A1A1A;letter-spacing:-0.5px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.2;">
      Your refund is on the way, ${firstName}
    </h1>
    <p style="margin:0 0 32px;font-size:15px;color:#6B6B6B;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      We've processed a refund of <strong style="color:#1A1A1A;">${data.amount}</strong> for your <strong style="color:#1A1A1A;">${data.vehicleName}</strong> booking.
    </p>

    <!-- Refund summary -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:14px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;text-align:center;">
          <p style="margin:0 0 4px;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Refund Amount</p>
          <p style="margin:0;font-size:28px;font-weight:900;color:#2563EB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${data.amount}</p>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#FAFAF8;border-left:3px solid #FF4D00;border-radius:0 12px 12px 0;margin-bottom:32px;">
      <tr>
        <td style="padding:16px 20px;">
          <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#1A1A1A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">When will I get my refund?</p>
          <p style="margin:0;font-size:13px;color:#6B6B6B;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
            The refund will be credited to your original payment method within 5–7 business days. Bank processing times may vary.
          </p>
        </td>
      </tr>
    </table>

    ${ctaButton("View Booking", `${BASE_URL}/bookings/${data.bookingId}`)}
  `, `Refund of ${data.amount} processed for your ${data.vehicleName} booking.`);

  const text = `Refund Processed — ${data.amount}\n\nHi ${firstName}, we've processed a refund of ${data.amount} for your ${data.vehicleName} booking.\n\nThe refund will be credited to your original payment method within 5–7 business days.\n\nView booking: ${BASE_URL}/bookings/${data.bookingId}\n\n— Vroom`;

  return { subject, html, text };
}
