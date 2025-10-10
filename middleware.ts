import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Middleware doesn't handle auth checks anymore
  // All auth/role checks are done at the page level using requireAuth() and requireRole()
  // This avoids edge runtime issues with Prisma
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Skip all paths that should not be checked
    '/((?!api/auth|_next/static|_next/image|favicon.ico|images|themes).*)',
  ],
}

