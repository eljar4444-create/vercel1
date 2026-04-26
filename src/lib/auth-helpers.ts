import prisma from '@/lib/prisma';

export async function requireProviderProfile(userId: string) {
  const profile = await prisma.profile.findFirst({
    where: { user_id: userId },
  });

  if (!profile) {
    throw new Error('PROFILE_NOT_FOUND');
  }

  return profile;
}
