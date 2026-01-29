import type { NextAuthConfig } from "next-auth"

import Google from "next-auth/providers/google"
import Apple from "next-auth/providers/apple"

export const authConfig = {
    pages: {
        signIn: "/auth/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnAuth = nextUrl.pathname.startsWith('/auth');

            if (isOnAuth) {
                if (isLoggedIn) return Response.redirect(new URL('/', nextUrl));
                return true;
            }

            return isLoggedIn;
        },
    },
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
                params: {
                    prompt: "select_account",
                    access_type: "offline",
                    response_type: "code"
                }
            }
        }),
        ...(process.env.APPLE_ID ? [
            Apple({
                clientId: process.env.APPLE_ID,
                // @ts-ignore
                teamId: process.env.APPLE_TEAM_ID,
                keyId: process.env.APPLE_KEY_ID,
                privateKey: process.env.APPLE_PRIVATE_KEY ? process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
            })
        ] : []),
    ],
} satisfies NextAuthConfig
