function layout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vroom</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAFAF8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FAFAF8; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
          <!-- Header -->
          <tr>
            <td style="background-color: #0D0D0D; padding: 24px 32px; border-radius: 16px 16px 0 0;">
              <span style="font-size: 24px; font-weight: 800; color: #FF4D00; letter-spacing: -0.5px;">vroom</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background-color: #FFFFFF; padding: 32px; border: 1px solid #E8E6E1; border-top: none;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #FAFAF8; padding: 24px 32px; border: 1px solid #E8E6E1; border-top: none; border-radius: 0 0 16px 16px;">
              <p style="margin: 0; font-size: 12px; color: #999; text-align: center;">
                &copy; ${new Date().getFullYear()} Vroom. Self-drive car rentals in Bangalore.
              </p>
              <p style="margin: 8px 0 0; font-size: 12px; color: #999; text-align: center;">
                This is an automated email. Please do not reply.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

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
  const subject = `Booking Confirmed — ${data.vehicleName}`;

  const html = layout(`
    <h1 style="margin: 0 0 8px; font-size: 22px; color: #1A1A1A;">Booking Confirmed!</h1>
    <p style="margin: 0 0 24px; font-size: 15px; color: #6B6B6B;">
      Hi ${data.renterName}, your booking has been confirmed. Here are your trip details.
    </p>

    <!-- Vehicle -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background: #FAFAF8; border: 1px solid #E8E6E1; border-radius: 12px; margin-bottom: 20px;">
      <tr>
        <td style="padding: 16px 20px;">
          <p style="margin: 0 0 4px; font-size: 17px; font-weight: 700; color: #1A1A1A;">${data.vehicleName}</p>
          <p style="margin: 0; font-size: 13px; color: #6B6B6B;">${data.vehicleYear} &middot; Bangalore</p>
        </td>
      </tr>
    </table>

    <!-- Dates -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
      <tr>
        <td width="50%" style="padding: 12px 16px; background: #FAFAF8; border: 1px solid #E8E6E1; border-radius: 12px 0 0 12px;">
          <p style="margin: 0 0 4px; font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 0.5px;">Pick-up</p>
          <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1A1A1A;">${data.pickupDate}</p>
        </td>
        <td width="50%" style="padding: 12px 16px; background: #FAFAF8; border: 1px solid #E8E6E1; border-left: none; border-radius: 0 12px 12px 0;">
          <p style="margin: 0 0 4px; font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 0.5px;">Drop-off</p>
          <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1A1A1A;">${data.dropoffDate}</p>
        </td>
      </tr>
    </table>

    <!-- Pickup Location -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background: #FAFAF8; border: 1px solid #E8E6E1; border-radius: 12px; margin-bottom: 20px;">
      <tr>
        <td style="padding: 16px 20px;">
          <p style="margin: 0 0 4px; font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 0.5px;">Pickup Location</p>
          <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1A1A1A;">${data.pickupAddress}</p>
        </td>
      </tr>
    </table>

    <!-- OTP -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background: #FFF1EB; border: 2px solid #FF4D00; border-radius: 12px; margin-bottom: 20px;">
      <tr>
        <td style="padding: 20px; text-align: center;">
          <p style="margin: 0 0 8px; font-size: 13px; color: #E64500; font-weight: 600;">YOUR PICKUP OTP</p>
          <p style="margin: 0; font-size: 36px; font-weight: 800; color: #FF4D00; letter-spacing: 8px; font-family: monospace;">${data.pickupOtp}</p>
          <p style="margin: 12px 0 0; font-size: 12px; color: #E64500;">
            Share this OTP with the host at pickup to start your trip
          </p>
        </td>
      </tr>
    </table>

    <!-- Total -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background: #0D0D0D; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 16px 20px;">
          <table width="100%"><tr>
            <td style="font-size: 14px; color: #999;">Total Paid</td>
            <td align="right" style="font-size: 20px; font-weight: 700; color: #FFFFFF;">${data.totalAmount}</td>
          </tr></table>
        </td>
      </tr>
    </table>

    <!-- CTA -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding: 0 0 8px;">
          <a href="${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/bookings/${data.bookingId}"
             style="display: inline-block; padding: 14px 32px; background-color: #FF4D00; color: #FFFFFF; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 50px;">
            View Booking Details
          </a>
        </td>
      </tr>
    </table>

    <!-- Instructions -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px; border-top: 1px solid #E8E6E1; padding-top: 20px;">
      <tr>
        <td>
          <p style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #1A1A1A;">Pickup Instructions</p>
          <ol style="margin: 0; padding-left: 20px; font-size: 13px; color: #6B6B6B; line-height: 1.8;">
            <li>Go to the pickup location on your start date</li>
            <li>Meet the host and share your <strong style="color: #FF4D00;">pickup OTP</strong></li>
            <li>Complete the pre-trip inspection together</li>
            <li>Host will start the trip — you're good to go!</li>
          </ol>
          <p style="margin: 16px 0 0; font-size: 13px; color: #6B6B6B; line-height: 1.8;">
            <strong>Returning the car:</strong> Drive back to the pickup location by your drop-off date. The host will inspect the car and complete the trip.
          </p>
        </td>
      </tr>
    </table>
  `);

  const text = `Booking Confirmed — ${data.vehicleName}

Hi ${data.renterName},

Your booking has been confirmed!

Vehicle: ${data.vehicleName} (${data.vehicleYear})
Pick-up: ${data.pickupDate}
Drop-off: ${data.dropoffDate}
Location: ${data.pickupAddress}
Total Paid: ${data.totalAmount}

YOUR PICKUP OTP: ${data.pickupOtp}
Share this OTP with the host at pickup to start your trip.

View booking: ${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/bookings/${data.bookingId}

— Vroom`;

  return { subject, html, text };
}

export function tripStartedEmail(data: {
  renterName: string;
  vehicleName: string;
  bookingId: string;
}): { subject: string; html: string; text: string } {
  const subject = `Trip Started — ${data.vehicleName}`;

  const html = layout(`
    <h1 style="margin: 0 0 8px; font-size: 22px; color: #1A1A1A;">Your Trip Has Started!</h1>
    <p style="margin: 0 0 24px; font-size: 15px; color: #6B6B6B;">
      Hi ${data.renterName}, your trip with the ${data.vehicleName} is now active. Drive safe!
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background: #FFF1EB; border: 1px solid #FF4D00; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 16px 20px; font-size: 13px; color: #E64500;">
          <strong>Remember:</strong> Return the car to the pickup location by your drop-off date. The host will complete a post-trip inspection.
        </td>
      </tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <a href="${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/bookings/${data.bookingId}"
             style="display: inline-block; padding: 14px 32px; background-color: #FF4D00; color: #FFFFFF; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 50px;">
            View Trip Details
          </a>
        </td>
      </tr>
    </table>
  `);

  const text = `Trip Started — ${data.vehicleName}\n\nHi ${data.renterName}, your trip is now active. Drive safe!\n\nRemember to return the car by your drop-off date.\n\n— Vroom`;

  return { subject, html, text };
}

export function tripCompletedEmail(data: {
  renterName: string;
  vehicleName: string;
  bookingId: string;
}): { subject: string; html: string; text: string } {
  const subject = `Trip Completed — ${data.vehicleName}`;

  const html = layout(`
    <h1 style="margin: 0 0 8px; font-size: 22px; color: #1A1A1A;">Trip Completed!</h1>
    <p style="margin: 0 0 24px; font-size: 15px; color: #6B6B6B;">
      Hi ${data.renterName}, your trip with the ${data.vehicleName} is complete. We hope you had a great drive!
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <a href="${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/bookings/${data.bookingId}/review"
             style="display: inline-block; padding: 14px 32px; background-color: #FF4D00; color: #FFFFFF; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 50px;">
            Leave a Review
          </a>
        </td>
      </tr>
    </table>
  `);

  const text = `Trip Completed — ${data.vehicleName}\n\nHi ${data.renterName}, your trip is complete! Leave a review to help others.\n\n— Vroom`;

  return { subject, html, text };
}
