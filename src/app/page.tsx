import { PublicLanding } from '@/components/landing/public-landing'

// The proxy keeps the authenticated dashboard redirect. This page has no user data.
export default function Home() {
  return <PublicLanding />
}
