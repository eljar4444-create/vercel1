# STACK.md

## Languages
- **TypeScript**: Primary language for the entire codebase.

## Runtime & Hosting
- **Node.js**: Expected runtime environment (based on `@types/node` dependency).
- **Vercel**: Target hosting platform, utilizing `@vercel/blob` for edge storage.

## Core Frameworks
- **Next.js**: Version `14.2.5`. Using the App Router (`src/app`) for routing and server components.
- **React**: Version 18. Used for building user interfaces.

## Database & ORM
- **PostgreSQL**: Primary database. Hosted on Neon (`@neondatabase/serverless`).
- **Prisma**: Version `5.22.0`. Used as the ORM for database migrations, schema definitions (`prisma/schema.prisma`), and data access.

## UI & Styling
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **shadcn/ui**: Component library built on top of Radix UI and Tailwind CSS.
- **Radix UI**: Unstyled, accessible UI primitives (`@radix-ui/react-*`).
- **Lucide React**: Icon library.
- **Framer Motion**: Animation library.

## State Management & Data Fetching
- **SWR**: Used for client-side data fetching and revalidation.
- **React Hook Form**: Form state management and validation.
- **Zod**: Schema declaration and runtime validation, heavily integrated with React Hook Form (`@hookform/resolvers`).

## Other Utilities
- **date-fns** & **date-fns-tz**: Date formatting and timezone utilities.
- **bcryptjs**: Password hashing for credential-based authentication.
- **react-leaflet** & **leaflet**: Map integration for geo-features.
- **recharts**: Charting library for dashboards/analytics.
