import { randomUUID } from 'crypto';
import prisma from '@/lib/prisma';

const TELEGRAM_TOKEN_TTL_MS = 60 * 60 * 1000;

export async function createTelegramConnectLink(profileId: number, botUsername: string) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TELEGRAM_TOKEN_TTL_MS);
  const token = randomUUID();

  await prisma.$executeRaw`
    DELETE FROM "TelegramToken"
    WHERE "profileId" = ${profileId} OR "expiresAt" <= ${now}
  `;

  await prisma.$executeRaw`
    INSERT INTO "TelegramToken" ("id", "token", "profileId", "expiresAt", "createdAt")
    VALUES (${randomUUID()}, ${token}, ${profileId}, ${expiresAt}, ${now})
  `;

  return `https://t.me/${botUsername}?start=${token}`;
}
