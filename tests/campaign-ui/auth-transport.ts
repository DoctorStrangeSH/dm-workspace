// Synthetic auth responses only: never opens a network connection.
export const authLab = {
  calls: [] as { kind: string; email: string }[],
  outcome: 'session' as 'session' | 'confirm' | 'error' | 'throw',
  pending: [] as (() => void)[],
  deferred: false,
}
Object.assign(window, { __authLab: authLab })
async function respond(kind: string, input: { email: string }) {
  authLab.calls.push({ kind, email: input.email })
  if (authLab.deferred) await new Promise<void>((resolve) => authLab.pending.push(resolve))
  if (authLab.outcome === 'throw') throw Error('Synthetic connection failure')
  return {
    data: { session: authLab.outcome === 'confirm' ? null : { user: { id: 'synthetic' } } },
    error: authLab.outcome === 'error' ? { message: 'Synthetic auth rejection' } : null,
  }
}
export const createClient = () => ({
  auth: {
    signInWithPassword: (input: { email: string }) => respond('login', input),
    signUp: (input: { email: string }) => respond('signup', input),
  },
})
