import type { Token } from '@/lib/types'

export const TOKEN_ART_LIMIT = 2 * 1024 * 1024
const uuid = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
const artPath = new RegExp(`^${uuid}/${uuid}/${uuid}/${uuid}\\.(png|jpg|webp)$`, 'i')

export function tokenArtPath(value: string, campaignId: string, sceneId: string, tokenId: string) {
  return artPath.test(value) && value.startsWith(`${campaignId}/${sceneId}/${tokenId}/`)
    ? value
    : null
}

export function tokenArtSrc(token: Pick<Token, 'id' | 'scene_id' | 'image_url'>) {
  if (!token.image_url) return null
  if (tokenArtPath(token.image_url, token.image_url.split('/')[0], token.scene_id, token.id)) {
    return `/api/tokens/${token.id}/art?v=${encodeURIComponent(token.image_url.split('/').at(-1)!)}`
  }
  if (
    token.image_url.length <= TOKEN_ART_LIMIT * 1.4 &&
    /^data:image\/(png|jpeg|webp);base64,[a-z0-9+/]+=*$/i.test(token.image_url)
  )
    return token.image_url
  // Preserve existing externally hosted portraits, but never interpret an arbitrary path as a URL.
  try {
    const url = new URL(token.image_url)
    return ['https:', 'http:'].includes(url.protocol) ? token.image_url : null
  } catch {
    return null
  }
}

export function tokenArtFormat(bytes: Uint8Array, mime: string): 'png' | 'jpg' | 'webp' | null {
  if (mime === 'image/png' && [137, 80, 78, 71, 13, 10, 26, 10].every((b, i) => bytes[i] === b))
    return 'png'
  if (mime === 'image/jpeg' && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255)
    return 'jpg'
  if (
    mime === 'image/webp' &&
    String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
  )
    return 'webp'
  return null
}
