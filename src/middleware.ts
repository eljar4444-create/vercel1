import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
    const { nextUrl } = req
    const isLoggedIn = !!req.auth
    const hasSiteAccess = req.cookies.get('site_access') // Check for cookie

    const isApiRoute = nextUrl.pathname.startsWith('/api')
    const isStatic = nextUrl.pathname.startsWith('/_next') || nextUrl.pathname.includes('.') // images, etc
    const isLockPage = nextUrl.pathname === '/lock'
    const isAuthPage = nextUrl.pathname.startsWith('/auth')

    // Always allow API, Static files, and Auth pages (Login/Register must work)
    if (isApiRoute || isStatic || isAuthPage) {
        return NextResponse.next();
    }

    // Checking for Site Password
    if (!hasSiteAccess && !isLockPage) {
        // Redirect to Lock Screen
        return NextResponse.redirect(new URL('/lock', nextUrl))
    }

    // If on Lock page but already has access, go home
    if (hasSiteAccess && isLockPage) {
        // return NextResponse.redirect(new URL('/', nextUrl)) // Optional: Redirect if trying to access lock while unlocked
    }

    return NextResponse.next()
})

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
