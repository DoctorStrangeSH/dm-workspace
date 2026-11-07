export const DEFAULT_RETURN_PATH = '/dashboard'

export function isInviteCode(value: unknown): value is string {
  return typeof value === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(value)
}

/** Only known application pages may receive a post-auth navigation. */
export function safeReturnPath(value: unknown): string {
  if (
    typeof value !== 'string' ||
    value.length > 2048 ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    /[\\\u0000-\u001f\u007f]/.test(value)
  )
    return DEFAULT_RETURN_PATH
  try {
    const url = new URL(value, 'https://return-path.invalid')
    if (url.origin !== 'https://return-path.invalid') return DEFAULT_RETURN_PATH
    const path = url.pathname
    // IDs and route segments in these pages use literal ASCII. Encoded separators,
    // dot segments, auth loops and API destinations are intentionally not accepted.
    const rawPath = value.split(/[?#]/, 1)[0]
    if (rawPath !== path) return DEFAULT_RETURN_PATH
    if (
      !/^\/(?:dashboard|settings)\/?$/.test(path) &&
      !/^\/campaign\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*\/?$/.test(path) &&
      !/^\/join\/[a-zA-Z0-9_-]{1,128}\/?$/.test(path)
    )
      return DEFAULT_RETURN_PATH
    return path + url.search + url.hash
  } catch {
    return DEFAULT_RETURN_PATH
  }
}

export function inviteReturnPath(value: unknown) {
  const next = safeReturnPath(value)
  return /^\/join\//.test(next)
}

export function authPath(page: 'login' | 'signup', destination: unknown) {
  const next = safeReturnPath(destination)
  return `/${page}${next === DEFAULT_RETURN_PATH ? '' : `?next=${encodeURIComponent(next)}`}`
}
