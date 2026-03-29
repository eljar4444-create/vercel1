import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { sendBookingNotifications } from "@/inngest/functions/booking";

import { scheduleReviewRequest } from "@/inngest/functions/review";

// Standard Next.js Route Handlers exposing the Inngest API endpoint
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    sendBookingNotifications,
    scheduleReviewRequest,
  ],
});
