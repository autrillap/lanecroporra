const DEFAULT_SITE_URL = 'https://lanecroporra.com'

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL

export const ALLOWED_HOSTS = (process.env.ALLOWED_HOSTS || 'lanecroporra.com,localhost')
  .split(',')
  .map(h => h.trim())
  .filter(Boolean)

export const ALLOWED_REDIRECT_PATHS = ['/dashboard', '/', '/profile']
