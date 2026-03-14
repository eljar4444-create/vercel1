import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { sendTelegramMessage } from '@/lib/telegram';

const CONFIRM_MESSAGE =
    '✅ Отлично! Ваш профиль успешно привязан. Теперь вы будете получать сюда уведомления о новых записях.';

export async function POST(request: NextRequest) {
    try {
        const configuredSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
        const secret = request.headers.get('x-telegram-bot-api-secret-token');

        if (!configuredSecret || secret !== configuredSecret) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const message = body?.message;
        const text = typeof message?.text === 'string' ? message.text.trim() : '';
        const chatId = message?.chat?.id;

        if (!text || chatId == null) {
            return Response.json({ ok: true });
        }

        if (!text.startsWith('/start ')) {
            return Response.json({ ok: true });
        }

        const token = text.slice(7).trim();
        if (!token) {
            return Response.json({ ok: true });
        }

        const rows = await prisma.$queryRaw<Array<{
            id: string;
            profileId: number;
            expiresAt: Date;
        }>>`
            SELECT "id", "profileId", "expiresAt"
            FROM "TelegramToken"
            WHERE "token" = ${token}
            LIMIT 1
        `;
        const telegramToken = rows[0];

        if (!telegramToken) {
            return Response.json({ ok: true });
        }

        if (telegramToken.expiresAt <= new Date()) {
            await prisma.$executeRaw`
                DELETE FROM "TelegramToken"
                WHERE "id" = ${telegramToken.id}
            `;
            return Response.json({ ok: true });
        }

        await prisma.$transaction(async (tx) => {
            await tx.profile.update({
                where: { id: telegramToken.profileId },
                data: { telegramChatId: String(chatId) },
            });

            await tx.$executeRaw`
                DELETE FROM "TelegramToken"
                WHERE "id" = ${telegramToken.id}
            `;
        });

        await sendTelegramMessage(String(chatId), CONFIRM_MESSAGE);
        return Response.json({ ok: true });
    } catch (err) {
        console.error('[Telegram webhook] error:', err);
        return Response.json({ ok: true });
    }
}
