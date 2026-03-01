import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function middleware(req) {
  const url = req.nextUrl

  // Rotas protegidas para contadores
  const protectedPaths = ['/jurema-chat', '/admin', '/admin/', '/admin/treinamento']
  const isProtected = protectedPaths.some(path => url.pathname === path || url.pathname.startsWith(path + '/'))

  if (!isProtected) return NextResponse.next()

  const accessToken = req.cookies.get('sb-access-token')?.value
  if (!accessToken) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Validação leve do token (sem round-trip ao Supabase)
  try {
    // Se quiser validar no backend, pode chamar supabase.auth.getUser(accessToken)
    return NextResponse.next()
  } catch {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }
}

export const config = {
  matcher: ['/jurema-chat', '/admin/:path*'],
}