import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCampaignAccess } from '@/lib/queries/access'

function getTrackPath(audioUrl: string, campaignId: string): string | null {
  let path = audioUrl
  if (/^https?:\/\//i.test(audioUrl)) {
    try {
      const parsed = new URL(audioUrl)
      const configured = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!configured || parsed.origin !== new URL(configured).origin) return null
      const prefix = '/storage/v1/object/public/music/'
      if (!parsed.pathname.startsWith(prefix)) return null
      path = decodeURIComponent(parsed.pathname.slice(prefix.length))
    } catch {
      return null
    }
  }
  if (!/^[0-9a-f-]{36}$/i.test(campaignId) || !path.startsWith(campaignId + '/')) return null
  const filename = path.slice(campaignId.length + 1)
  return /^[a-f0-9-]{36}\.(mp3|wav|ogg|m4a|aac|flac|webm)$/i.test(filename) ? path : null
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const supabase = await createClient()
  const { data: track, error } = await supabase
    .from('tracks')
    .select('id, campaign_id, audio_url')
    .eq('id', id)
    .maybeSingle()

  if (error || !track) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const { isMember } = await getCampaignAccess(track.campaign_id)
  if (!isMember) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const path = getTrackPath(track.audio_url, track.campaign_id)
  if (!path) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data, error: signError } = await supabase.storage.from('music').createSignedUrl(path, 3600)
  if (signError || !data?.signedUrl) return NextResponse.json({ error: 'Audio unavailable' }, { status: 404 })

  return NextResponse.redirect(data.signedUrl, {
    status: 302,
    headers: {
      'Cache-Control': 'private, no-store, max-age=0',
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
