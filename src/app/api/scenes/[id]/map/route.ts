import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCampaignAccess } from '@/lib/queries/access'

function getMapPath(imageUrl: string, campaignId: string, sceneId: string): string | null {
  let path = imageUrl
  if (/^https?:\/\//i.test(imageUrl)) {
    try {
      const parsed = new URL(imageUrl)
      const configured = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!configured || parsed.origin !== new URL(configured).origin) return null
      const prefix = '/storage/v1/object/public/scene-maps/'
      if (!parsed.pathname.startsWith(prefix)) return null
      path = decodeURIComponent(parsed.pathname.slice(prefix.length))
    } catch {
      return null
    }
  }
  if (!/^[0-9a-f-]{36}$/i.test(campaignId) || !/^[0-9a-f-]{36}$/i.test(sceneId)) return null
  const prefix = campaignId + '/' + sceneId + '-'
  if (!path.startsWith(prefix)) return null
  return /^[a-f0-9-]{36}\.(png|jpg|webp)$/i.test(path.slice(prefix.length)) ? path : null
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const supabase = await createClient()
  const { data: scene, error } = await supabase
    .from('scenes')
    .select('id, campaign_id, image_url')
    .eq('id', id)
    .maybeSingle()

  if (error || !scene?.image_url) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const { isMember } = await getCampaignAccess(scene.campaign_id)
  if (!isMember) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const path = getMapPath(scene.image_url, scene.campaign_id, scene.id)
  if (!path) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data, error: signError } = await supabase.storage.from('scene-maps').createSignedUrl(path, 900)
  if (signError || !data?.signedUrl) return NextResponse.json({ error: 'Map unavailable' }, { status: 404 })

  return NextResponse.redirect(data.signedUrl, {
    status: 302,
    headers: {
      'Cache-Control': 'private, no-store, max-age=0',
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
