import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
    const { nextUrl } = req
    const session = req.auth
    const isLoggedIn = !!session?.user
    const role = session?.user?.role

    const isApiRoute = nextUrl.pathname.startsWith('/api')
    const isStatic = nextUrl.pathname.startsWith('/_next') || nextUrl.pathname.includes('.') // images, etc
    const isAuthPage = nextUrl.pathname.startsWith('/auth')
    const isAdminPage = nextUrl.pathname.startsWith('/admin')
    const isClientPortal = nextUrl.pathname.startsWith('/my-bookings')
    const isDashboard = nextUrl.pathname.startsWith('/dashboard/')
    const isProviderArea = nextUrl.pathname.startsWith('/provider')

    // Always allow API, Static files, and Auth pages (Login/Register must work)
    if (isApiRoute || isStatic || isAuthPage) {
        return NextResponse.next();
    }

    if (isAdminPage) {
        if (!isLoggedIn) {
            return NextResponse.redirect(new URL('/auth/login', nextUrl));
        }
        if (role !== 'ADMIN') {
            return NextResponse.redirect(new URL('/', nextUrl));
        }
    }

    if (isClientPortal) {
        if (!isLoggedIn) {
            return NextResponse.redirect(new URL('/auth/login', nextUrl));
        }
        if (role !== 'CLIENT' && role !== 'ADMIN') {
            return NextResponse.redirect(new URL('/', nextUrl));
        }
    }

    if (isDashboard || isProviderArea) {
        if (!isLoggedIn) {
            return NextResponse.redirect(new URL('/auth/login', nextUrl));
        }
        if (role !== 'PROVIDER' && role !== 'ADMIN') {
            return NextResponse.redirect(new URL('/', nextUrl));
        }
    }

    return NextResponse.next()
})

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
