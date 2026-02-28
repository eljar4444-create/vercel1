/**
 * Отправка сообщения в Telegram через Bot API.
 * Не бросает ошибки наружу — сбои Telegram не должны ломать основной поток (например, бронирование).
 */
export async function sendTelegramMessage(chatId: string, message: string): Promise<void> {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token?.trim() || !chatId?.trim()) {
        return;
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId.trim(),
                text: message,
                parse_mode: 'HTML',
            }),
        });

        if (!res.ok) {
            const errBody = await res.text();
            console.error('[Telegram] sendMessage failed:', res.status, errBody);
        }
    } catch (err) {
        console.error('[Telegram] sendMessage error:', err);
    }
}
