import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/prisma"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    trustHost: true,
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
                    onboardingCompleted: user.onboardingCompleted,
                    onboardingType: user.onboardingType,
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

                const role = legacyRole === 'ADMIN' ? 'ADMIN' : 'USER';

                const providerTypeMap: Record<string, 'SALON' | 'INDIVIDUAL'> = {
                    SALON: 'SALON',
                    INDIVIDUAL: 'INDIVIDUAL',
                };

                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        role,
                        ...(onboardingRole === 'provider' && onboardingType && providerTypeMap[onboardingType]
                            ? {
                                providerType: providerTypeMap[onboardingType],
                                onboardingCompleted: false,
                                onboardingType,
                            }
                            : {}),
                    },
                });
            } catch (error) {
                console.error('createUser role sync error:', error);
            }
        },
    },
    callbacks: {
        async jwt({ token, user, trigger, session }: any) {
            const syncProviderProfileState = async () => {
                const userId = token.id as string | undefined;
                const email = token.email as string | undefined;

                if (!userId) {
                    token.profileId = null;
                    token.profileSlug = null;
                    token.profileStatus = null;
                    return;
                }

                const profile = await prisma.profile.findFirst({
                    where: {
                        OR: [
                            { user_id: userId },
                            ...(email ? [{ user_email: email }] : []),
                        ],
                    },
                    select: { id: true, image_url: true, slug: true, status: true },
                });

                token.profileId = profile?.id ?? null;
                token.profileSlug = profile?.slug ?? null;
                token.profileStatus = profile?.status ?? null;

                // Use profile image as fallback when user has no avatar
                if (!token.picture && profile?.image_url) {
                    token.picture = profile.image_url;
                }
            };

            // Initial sign in
            if (user) {
                token.role = user.role
                token.id = user.id
                token.picture = user.image
                token.email = user.email
                token.onboardingCompleted = user.onboardingCompleted ?? false
                token.onboardingType = user.onboardingType ?? null
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
                        select: {
                            image: true,
                            role: true,
                            id: true,
                            email: true,
                            isBanned: true,
                            onboardingCompleted: true,
                            onboardingType: true,
                        },
                    });

                    if (freshUser) {
                        token.picture = freshUser.image;
                        token.role = freshUser.role;
                        token.id = freshUser.id;
                        token.email = freshUser.email;
                        token.isBanned = freshUser.isBanned;
                        token.onboardingCompleted = freshUser.onboardingCompleted;
                        token.onboardingType = freshUser.onboardingType;
                    }
                } catch (error) {
                    console.error("Error fetching fresh user data in JWT callback:", error);
                }
            }

            await syncProviderProfileState();

            if ((trigger === 'update' || !token.onboardingCompleted) && token.id) {
                try {
                    const onboardingState = await prisma.user.findUnique({
                        where: { id: token.id as string },
                        select: { onboardingCompleted: true, onboardingType: true },
                    });

                    if (onboardingState) {
                        token.onboardingCompleted = onboardingState.onboardingCompleted;
                        token.onboardingType = onboardingState.onboardingType;
                    }
                } catch (error) {
                    console.error('Error refreshing onboarding state in JWT callback:', error);
                }
            }

            // Handle client-side update trigger
            if (trigger === "update") {
                if (session?.image) {
                    token.picture = session.image;
                }
                if (typeof session?.onboardingCompleted === 'boolean') {
                    token.onboardingCompleted = session.onboardingCompleted;
                }
                if (
                    typeof session?.onboardingType === 'string' ||
                    session?.onboardingType === null
                ) {
                    token.onboardingType = session.onboardingType;
                }
                if (typeof session?.profileId === 'number' || session?.profileId === null) {
                    token.profileId = session.profileId;
                }
                if (
                    typeof session?.profileStatus === 'string' ||
                    session?.profileStatus === null
                ) {
                    token.profileStatus = session.profileStatus;
                }
                if (
                    typeof session?.profileSlug === 'string' ||
                    session?.profileSlug === null
                ) {
                    token.profileSlug = session.profileSlug;
                }
            }
            return token
        },
        async session({ session, token }: any) {
            if (session.user) {
                session.user.role = token.role
                session.user.id = token.id
                session.user.image = token.picture
                session.user.isBanned = token.isBanned ?? false
                session.user.profileId = token.profileId
                session.user.profileSlug = token.profileSlug ?? null
                session.user.profileStatus = token.profileStatus ?? null
                session.user.onboardingCompleted = token.onboardingCompleted ?? false
                session.user.onboardingType = token.onboardingType ?? null
            }
            return session
        }
    }
})
