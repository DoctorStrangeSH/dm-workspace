import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { handoutStoragePath } from '@/lib/handouts/storage'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return new NextResponse(null, { status: 404 })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return new NextResponse(null, { status: 404 })

  // RLS determines whether this user may access this handout:
  // visible campaign handouts for members, all handouts for the DM.
  const { data: handout, error } = await supabase
    .from('handouts')
    .select('image_url')
    .eq('id', id)
    .maybeSingle()
  if (error || !handout) return new NextResponse(null, { status: 404 })

  const path = handoutStoragePath(handout.image_url)
  if (!path) return new NextResponse(null, { status: 404 })

  const { data, error: signingError } = await supabase.storage
    .from('handouts')
    .createSignedUrl(path, 60)
  if (signingError || !data?.signedUrl) return new NextResponse(null, { status: 404 })

  return NextResponse.redirect(data.signedUrl, {
    status: 302,
    headers: {
      'Cache-Control': 'private, no-store',
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
