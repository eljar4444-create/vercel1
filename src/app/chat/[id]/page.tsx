import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getMyConversations } from '@/app/actions/chat';
import { MessengerClient } from '@/components/chat/MessengerClient';

export const dynamic = 'force-dynamic';

export default async function ChatByIdPage({
    params,
}: {
    params: { id: string };
}) {
    const session = await auth();
    if (!session?.user?.id) {
        redirect(`/auth/login?callbackUrl=/chat/${params.id}`);
    }

    const result = await getMyConversations();
    const conversations = result.success ? result.conversations : [];
    const hasAccess = conversations.some((conversation) => conversation.id === params.id);

    return (
        <MessengerClient
            initialConversations={conversations}
            initialConversationId={hasAccess ? params.id : null}
            currentUserId={session.user.id}
        />
    );
}
