export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-black p-4">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-6 inline-flex min-h-11 items-center text-slate-200 hover:text-white"
        >
          ← DM Workspace
        </Link>
        {children}
      </div>
    </div>
  )
}
import Link from 'next/link'
