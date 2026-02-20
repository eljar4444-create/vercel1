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
        async createUser({ user }) {
            try {
                const cookieStore = await cookies();
                const preferredRole = cookieStore.get('new-user-role')?.value;
                if (preferredRole === 'PROVIDER' || preferredRole === 'CLIENT') {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { role: preferredRole },
                    });
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
                await syncProviderProfileId();
            }

            // On subsequent calls, fetch fresh data from DB to ensure sync
            // Note: Use 'sub' to fetch user if needed, but be careful of performance
            if (!user && token.sub) {
                try {
                    const freshUser = await prisma.user.findUnique({
                        where: { id: token.sub },
                        select: { image: true, role: true, id: true }
                    });

                    if (freshUser) {
                        token.picture = freshUser.image;
                        token.role = freshUser.role;
                        token.id = freshUser.id;
                        await syncProviderProfileId();
                    }
                } catch (error) {
                    console.error("Error fetching fresh user data in JWT callback:", error);
                }
            }

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
