import prisma from '@/lib/prisma';

export async function requireProviderProfile(userId: string, email?: string | null) {
  const profile = await prisma.profile.findFirst({
    where: {
      OR: [
        { user_id: userId },
        ...(email ? [{ user_email: email }] : []),
      ],
    },
  });

  if (!profile) {
    throw new Error('PROFILE_NOT_FOUND');
  }

  return profile;
}
