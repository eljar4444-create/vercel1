# INTEGRATIONS.md

## Authentication
- **NextAuth.js (v5 beta)**: Manages authentication, utilizing `@auth/prisma-adapter` for database sessions.
- **OAuth Providers**: Configured to support Google and Apple (via `next-auth/providers`).
- **Credentials Provider**: Custom email/password authentication using `bcryptjs`.

## Storage and Asset Management
- **Vercel Blob**: Utilized for file and image uploads within the Vercel ecosystem (`@vercel/blob`).

## Database
- **Neon Serverless**: Serverless Postgres database integration (`@neondatabase/serverless`).

## Maps & Geolocation
- **Google Maps API**: Integrated via `@react-google-maps/api` and `use-places-autocomplete` for location auto-complete features.
- **Leaflet**: Open-source mapping integration (`react-leaflet`, `leaflet-defaulticon-compatibility`) likely used as an alternative or complement to Google Maps.

## Messaging / Notifications
- **Telegram**: Basic integration implied through the database schema (`TelegramToken` model and `telegramChatId` on profiles).

## Payments (Implied / Future)
- **Stripe**: The database schema contains `stripeCustomerId` and `stripeSubscriptionId`, indicating a Stripe integration exists or is planned for subscriptions and billing.
