import { lstat, readFile, realpath, symlink } from 'node:fs/promises'
import path from 'node:path'

// npm --ignore-scripts intentionally skips the binary package's postinstall.
// Restore only its bundled Linux library links, with no network or shell call.
export async function prepareBundledLinux(packageDir) {
  const lib = await realpath(path.join(packageDir, 'native/lib'))
  const links = JSON.parse(await readFile(path.join(packageDir, 'native/pg-symlinks.json'), 'utf8'))
  for (const { source, target } of links) {
    if (
      ![source, target].every(
        (value) => typeof value === 'string' && /^native\/lib\/[a-zA-Z0-9_.-]+$/.test(value)
      )
    )
      throw new Error('Unsafe bundled library path')
    const from = await realpath(path.join(packageDir, source)),
      to = path.join(packageDir, target)
    if (path.dirname(from) !== lib) throw new Error('Bundled library escaped its package')
    const existing = await lstat(to).catch((error) => {
      if (error.code === 'ENOENT') return null
      throw error
    })
    if (existing) {
      if ((await realpath(to)) !== from) throw new Error('Unexpected bundled library link')
    } else {
      await symlink(path.relative(path.dirname(to), from), to)
    }
  }
}
