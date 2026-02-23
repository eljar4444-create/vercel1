import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/prisma"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" },
    providers: [
        ...authConfig.providers,
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                if (!credentials?.email || !credentials?.password) {
                    return null
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email as string },
                })

                if (!user || !user.password) {
                    // User might exist but signed up with a provider, or user doesn't exist
                    return null
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password as string,
                    user.password
                )

                if (!isPasswordValid) {
                    return null
                }

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    image: user.image,
                }
            },
        }),
    ],
    events: {
        /**
         * Срабатывает один раз при создании нового пользователя через OAuth.
         * Читает технически необходимые куки (DSGVO compliant), чтобы
         * понять, регистрируется ли пользователь как мастер/салон.
         */
        async createUser({ user }) {
            try {
                const cookieStore = await cookies();

                // New cookie names (from /auth/login page)
                const onboardingRole = cookieStore.get('onboarding_role')?.value;
                const onboardingType = cookieStore.get('onboarding_type')?.value;

                // Legacy cookie name (backward compat)
                const legacyRole = cookieStore.get('new-user-role')?.value;

                const role = onboardingRole === 'provider' ? 'PROVIDER'
                    : (legacyRole === 'PROVIDER' || legacyRole === 'CLIENT') ? legacyRole
                        : 'CLIENT';

                await prisma.user.update({
                    where: { id: user.id },
                    data: { role },
                });

                // Log provider type for future profile creation
                if (role === 'PROVIDER' && onboardingType) {
                    console.log(`[createUser] New provider: ${user.id}, type: ${onboardingType}`);
                }
            } catch (error) {
                console.error('createUser role sync error:', error);
            }
        },
    },
    callbacks: {
        async jwt({ token, user, trigger, session }: any) {
            const syncProviderProfileId = async () => {
                const role = token.role as string | undefined;
                const userId = token.id as string | undefined;
                const email = token.email as string | undefined;

                if (!userId || (role !== 'PROVIDER' && role !== 'ADMIN')) {
                    token.profileId = null;
                    return;
                }

                const profile = await prisma.profile.findFirst({
                    where: {
                        OR: [
                            { user_id: userId },
                            ...(email ? [{ user_email: email }] : []),
                        ],
                    },
                    select: { id: true },
                });

                token.profileId = profile?.id ?? null;
            };

            // Initial sign in
            if (user) {
                token.role = user.role
                token.id = user.id
                token.picture = user.image
                token.email = user.email
            }

            // Ensure token has user id for every request
            if (!token.id && token.sub) {
                token.id = token.sub;
            }

            // Keep token in sync with DB so provider links always resolve to profile id.
            if (token.id) {
                try {
                    const freshUser = await prisma.user.findUnique({
                        where: { id: token.id as string },
                        select: { image: true, role: true, id: true, email: true },
                    });

                    if (freshUser) {
                        token.picture = freshUser.image;
                        token.role = freshUser.role;
                        token.id = freshUser.id;
                        token.email = freshUser.email;
                    }
                } catch (error) {
                    console.error("Error fetching fresh user data in JWT callback:", error);
                }
            }

            await syncProviderProfileId();

            // Handle client-side update trigger (backup)
            if (trigger === "update" && session?.image) {
                token.picture = session.image;
            }
            return token
        },
        async session({ session, token }: any) {
            if (session.user) {
                session.user.role = token.role
                session.user.id = token.id
                session.user.image = token.picture
                session.user.profileId = token.profileId
            }
            return session
        }
    }
})
