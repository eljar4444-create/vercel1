CREATE TABLE IF NOT EXISTS "TelegramToken" (
  "id" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "profileId" INTEGER NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TelegramToken_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TelegramToken_profileId_fkey"
    FOREIGN KEY ("profileId")
    REFERENCES "Profile"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "TelegramToken_token_key"
  ON "TelegramToken"("token");
