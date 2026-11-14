import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCampaignAccess } from '@/lib/queries/access'
import { tokenArtPath } from '@/lib/maps/token-art'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const db = await createClient()
  const missing = () =>
    NextResponse.json(
      { error: 'Not found' },
      { status: 404, headers: { 'Cache-Control': 'private, no-store' } }
    )
  const { data: token, error } = await db
    .from('tokens')
    .select('id, scene_id, campaign_id, image_url, is_hidden')
    .eq('id', id)
    .maybeSingle()
  if (error || !token?.image_url) return missing()
  const { isMember, isDm } = await getCampaignAccess(token.campaign_id)
  if (!isMember || (token.is_hidden && !isDm)) return missing()
  const path = tokenArtPath(token.image_url, token.campaign_id, token.scene_id, token.id)
  if (!path) return missing()
  const { data, error: signError } = await db.storage.from('token-art').createSignedUrl(path, 60)
  if (signError || !data?.signedUrl) return missing()
  return NextResponse.redirect(data.signedUrl, {
    status: 302,
    headers: {
      'Cache-Control': 'private, no-store, max-age=0',
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
