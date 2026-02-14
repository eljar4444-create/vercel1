import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
// import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/prisma"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    // adapter: PrismaAdapter(prisma), // Disabled due to missing Account/Session tables
    session: { strategy: "jwt" },
    // events: {
    //     async createUser({ user }) {
    //         // Legacy profile creation removed
    //     },
    // },
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
    callbacks: {
        async jwt({ token, user, trigger, session }: any) {
            // Initial sign in
            if (user) {
                token.role = user.role
                token.id = user.id
                token.picture = user.image
            }

            // On subsequent calls, fetch fresh data from DB to ensure sync
            // Note: Use 'sub' to fetch user if needed, but be careful of performance
            if (!user && token.sub) {
                try {
                    const freshUser = await prisma.user.findUnique({
                        where: { id: token.sub },
                        select: { image: true, role: true }
                    });

                    if (freshUser) {
                        token.picture = freshUser.image;
                        token.role = freshUser.role;
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
            }
            return session
        }
    }
})
