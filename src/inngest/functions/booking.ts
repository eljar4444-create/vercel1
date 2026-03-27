import { inngest } from "../client";
import prisma from "@/lib/prisma";
import { sendTelegramMessage } from "@/lib/telegram";

export const sendBookingNotifications = inngest.createFunction(
  { id: "send-booking-notifications" },
  { event: "booking/created" },
  async ({ event, step }: any) => {
    const { bookingId } = event.data;

    // Safely retrieve the booking data outside of the UI thread
    const booking = await step.run("fetch-booking", async () => {
      return prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          profile: { select: { telegramChatId: true } },
          service: { select: { title: true } }
        }
      });
    });

    if (!booking) return { error: "Booking not found" };

    // Offload the heavy Telegram API call to Vercel/Inngest retries
    const telegramChatId = booking.profile?.telegramChatId;
    if (telegramChatId) {
      await step.run("send-telegram-ping", async () => {
        const serviceTitle = booking.service?.title || 'Услуга уточняется';
        const dateStr = new Date(booking.date).toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
        
        const escapeHtml = (s: string) =>
          String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
            
        const message =
          '🎉 <b>Новая запись!</b>\n' +
          `👤 Клиент: ${escapeHtml(booking.user_name)}\n` +
          `📱 Телефон: ${escapeHtml(booking.user_phone)}\n` +
          `✂️ Услуга: ${escapeHtml(serviceTitle)}\n` +
          `🗓 Время: ${dateStr}, ${escapeHtml(booking.time)}`;
          
        await sendTelegramMessage(telegramChatId, message);
      });
    }

    // TODO: Add email notifications step here in future sprints

    return { success: true, bookingId };
  }
);
