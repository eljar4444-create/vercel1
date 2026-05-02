import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { sendBookingNotifications } from "@/inngest/functions/booking";
import { scheduleReviewRequest } from "@/inngest/functions/review";
import { sendOtpEmail } from "@/inngest/functions/otp-send";
import { expireLockedBookings } from "@/inngest/functions/expire-locked-bookings";

// Standard Next.js Route Handlers exposing the Inngest API endpoint
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    sendBookingNotifications,
    scheduleReviewRequest,
    sendOtpEmail,
    expireLockedBookings,
  ],
});
