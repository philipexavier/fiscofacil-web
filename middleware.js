import { NextResponse } from 'next/server'

// O Supabase v2 não usa o cookie `sb-access-token` (Supabase v1).
// A proteção de sessão é feita no lado do cliente (client-side) em cada página
// via supabase.auth.getSession(). O middleware apenas faz pass-through.
export function middleware() {
  return NextResponse.next()
}

export const config = {
  matcher: ['/jurema-chat', '/admin/:path*'],
}
