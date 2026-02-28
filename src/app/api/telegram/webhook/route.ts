import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { sendTelegramMessage } from '@/lib/telegram';

const CONFIRM_MESSAGE =
    '✅ Отлично! Ваш профиль успешно привязан. Теперь вы будете получать сюда уведомления о новых записях.';

export async function POST(request: NextRequest) {
    try {
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

        const payload = text.slice(7).trim();
        if (!payload) {
            return Response.json({ ok: true });
        }

        const profile = await prisma.profile.findFirst({
            where: { user_id: payload },
            select: { id: true },
        });

        if (!profile) {
            return Response.json({ ok: true });
        }

        await prisma.profile.update({
            where: { id: profile.id },
            data: { telegramChatId: String(chatId) },
        });

        await sendTelegramMessage(String(chatId), CONFIRM_MESSAGE);
        return Response.json({ ok: true });
    } catch (err) {
        console.error('[Telegram webhook] error:', err);
        return Response.json({ ok: true });
    }
}
