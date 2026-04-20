import { inngest } from "../client";
import prisma from "@/lib/prisma";

export const scheduleReviewRequest = inngest.createFunction(
  { id: "schedule-review-request", triggers: [{ event: "booking.completed.review_request" }] },
  async ({ event, step }: any) => {
    const { bookingId } = event.data;

    const booking = await step.run("fetch-booking-time", async () => {
      return prisma.booking.findUnique({
        where: { id: bookingId },
        select: { date: true, time: true, status: true, service: { select: { duration_min: true } } }
      });
    });

    if (!booking) return { error: "Booking not found" };

    // Calculate appointment end time + 2 hours
    const [hours, minutes] = booking.time.split(':').map(Number);
    const endTime = new Date(booking.date);
    const duration = booking.service?.duration_min || 60;
    endTime.setHours(hours, minutes + duration + 120);

    // Sleep until 2 hours after the appointment
    await step.sleepUntil("wait-until-post-appointment", endTime);

    // Verify booking is still valid and no review exists yet
    const verification = await step.run("verify-booking-status", async () => {
      const b = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
            profile: { select: { name: true, telegramChatId: true } },
            user: { select: { name: true, email: true } }
        }
      });
      if (!b) return { isValid: false, hasReview: false };

      const review = await prisma.review.findUnique({ where: { bookingId } });
      
      return { 
          booking: b, 
          hasReview: !!review, 
          isValid: b.status !== 'CANCELED' && b.status !== 'NO_SHOW' && !b.reviewRequestedAt
      };
    });

    if (!verification.isValid || verification.hasReview) {
      return { status: "Skipped or already reviewed" };
    }

    // Mark as requested to prevent duplicate workflows
    await step.run("mark-review-requested", async () => {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { reviewRequestedAt: new Date() }
      });
    });

    // Dispatch Notification
    await step.run("send-review-email", async () => {
      const b = verification.booking;
      const reviewUrl = `https://svoi.de/reviews/new/${bookingId}`;
      console.log(`[REVIEW DISPATCH] Sending review request to ${b?.user?.email} for appointment with ${b?.profile?.name}. Link: ${reviewUrl}`);
      // In production, we would integrate Resend or Telegram here
    });

    return { success: true, requested: true, bookingId };
  }
);
