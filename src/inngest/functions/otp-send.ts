import { inngest } from '../client';
import { sendEmail, buildOtpEmailHtml } from '@/lib/email';
import { OTP_EXPIRY_MINUTES } from '@/lib/otp';

export const sendOtpEmail = inngest.createFunction(
    { id: 'send-otp-email', retries: 2, triggers: [{ event: 'otp/send' }] },
    async ({ event, step }: any) => {
        const { email, code, otpSessionId } = event.data;

        if (!email || !code) {
            return { error: 'Missing email or code' };
        }

        const result = await step.run('deliver-otp-email', async () => {
            const html = buildOtpEmailHtml(code, OTP_EXPIRY_MINUTES);
            return sendEmail({
                to: email,
                subject: `Ваш код подтверждения: ${code}`,
                html,
            });
        });

        if (!result.success) {
            console.error(`[OTP Email] Failed for ${email}:`, result.error);
            throw new Error(`OTP email delivery failed: ${result.error}`);
        }

        return { success: true, emailId: result.id, otpSessionId };
    }
);
