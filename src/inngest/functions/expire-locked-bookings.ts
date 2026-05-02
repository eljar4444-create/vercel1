import { inngest } from '../client';
import prisma from '@/lib/prisma';

/**
 * Cron job: expire LOCKED bookings whose lockExpiresAt has passed.
 * Runs every 2 minutes. Releases slots back to the pool.
 */
export const expireLockedBookings = inngest.createFunction(
    { id: 'expire-locked-bookings', triggers: [{ cron: '*/2 * * * *' }] },
    async ({ step }: any) => {
        const result = await step.run('cleanup-expired-locks', async () => {
            const expired = await prisma.booking.updateMany({
                where: {
                    status: 'LOCKED',
                    lockExpiresAt: { lt: new Date() },
                },
                data: {
                    status: 'CANCELED',
                    canceledBy: 'SYSTEM',
                },
            });

            if (expired.count > 0) {
                console.log(`[Lock Expiry] Canceled ${expired.count} expired locked booking(s)`);
            }

            return { expired: expired.count };
        });

        // Also clean up expired OTP records (older than 24 hours) to keep the table lean
        await step.run('cleanup-stale-otps', async () => {
            const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const deleted = await prisma.otpVerification.deleteMany({
                where: {
                    createdAt: { lt: cutoff },
                },
            });

            return { deletedOtps: deleted.count };
        });

        return result;
    }
);
