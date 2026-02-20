import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getConversationBookingContext, getMyConversations } from '@/app/actions/chat';
import { MessengerClient } from '@/components/chat/MessengerClient';

export const dynamic = 'force-dynamic';

export default async function ChatPage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect('/auth/login?callbackUrl=/chat');
    }

    const result = await getMyConversations();
    const conversations = result.success ? result.conversations : [];
    const initialConversationId = conversations[0]?.id ?? null;
    const bookingContextResult = initialConversationId
        ? await getConversationBookingContext(initialConversationId)
        : { success: false, booking: null };

    return (
        <MessengerClient
            initialConversations={conversations}
            initialConversationId={initialConversationId}
            currentUserId={session.user.id}
            initialBookingContext={bookingContextResult.success ? bookingContextResult.booking : null}
        />
    );
}
