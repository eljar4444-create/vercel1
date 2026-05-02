/**
 * Transactional email via Resend.
 * @see https://resend.com/docs/send-with-nextjs
 */

interface SendEmailParams {
    to: string;
    subject: string;
    html: string;
    from?: string;
}

interface SendEmailResult {
    success: boolean;
    id?: string;
    error?: string;
}

const DEFAULT_FROM = 'SVOI.de <noreply@svoi.de>';

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
        if (process.env.NODE_ENV === 'development') {
            console.warn('[Email] No RESEND_API_KEY — logging email to console');
            console.log('─── EMAIL ───');
            console.log(`To: ${params.to}`);
            console.log(`Subject: ${params.subject}`);
            console.log(`Body: ${params.html}`);
            console.log('─────────────');
            return { success: true, id: 'dev-mock' };
        }
        console.error('[Email] RESEND_API_KEY is not set');
        return { success: false, error: 'Email service not configured' };
    }

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                from: params.from || DEFAULT_FROM,
                to: [params.to],
                subject: params.subject,
                html: params.html,
            }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`[Email] Resend API error ${response.status}:`, errorBody);
            return { success: false, error: `Resend API error: ${response.status}` };
        }

        const data = await response.json();
        return { success: true, id: data.id };
    } catch (error: any) {
        console.error('[Email] Send error:', error);
        return { success: false, error: error.message || 'Failed to send email' };
    }
}

/**
 * Build the OTP email HTML template.
 */
export function buildOtpEmailHtml(code: string, expiryMinutes: number): string {
    return `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Код подтверждения</title>
</head>
<body style="margin:0; padding:0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#f5f2ed;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f2ed; padding:40px 20px;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width:460px; background:#ffffff; border-radius:16px; box-shadow:0 1px 3px rgba(0,0,0,0.06); overflow:hidden;">
                    <tr>
                        <td style="padding:32px 32px 0;">
                            <h1 style="margin:0; font-size:20px; font-weight:600; color:#1c1917; letter-spacing:-0.02em;">
                                SVOI.de
                            </h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:24px 32px;">
                            <p style="margin:0 0 8px; font-size:15px; color:#57534e; line-height:1.5;">
                                Ваш код подтверждения:
                            </p>
                            <div style="margin:16px 0; padding:20px; background:#f5f2ed; border-radius:12px; text-align:center;">
                                <span style="font-size:36px; font-weight:700; letter-spacing:8px; color:#1c1917; font-family:'SF Mono', 'Cascadia Code', 'Fira Code', monospace;">
                                    ${code}
                                </span>
                            </div>
                            <p style="margin:16px 0 0; font-size:13px; color:#a8a29e; line-height:1.5;">
                                Код действителен ${expiryMinutes} минут. Не передавайте его третьим лицам.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:0 32px 32px;">
                            <hr style="border:none; border-top:1px solid #e7e5e4; margin:0 0 16px;">
                            <p style="margin:0; font-size:12px; color:#a8a29e;">
                                Если вы не запрашивали этот код, просто проигнорируйте это письмо.
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
