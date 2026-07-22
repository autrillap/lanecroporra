import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ALLOWED_HOSTS, ALLOWED_REDIRECT_PATHS, SITE_URL } from '@/lib/config'

function isSafeRedirect(path: string): boolean {
  if (!path || path === '/') return true
  if (path.startsWith('/') && !path.startsWith('//')) {
    return ALLOWED_REDIRECT_PATHS.some(p => path === p || path.startsWith(p + '/'))
  }
  try {
    const url = new URL(path)
    return ALLOWED_HOSTS.includes(url.hostname)
  } catch {
    return false
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const safeNext = isSafeRedirect(next) ? next : '/dashboard'

      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${safeNext}`)
      }

      const baseUrl = SITE_URL.replace(/\/+$/, '')
      return NextResponse.redirect(`${baseUrl}${safeNext}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
