import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { appendFile, mkdtemp, readFile, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { randomBytes } from 'node:crypto'
import pg from 'pg'

export function command(binary, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, args, {
      env,
      windowsHide: true,
      shell: false,
      timeout: 30000,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let output = ''
    child.stdout.on('data', (chunk) => {
      output += chunk
    })
    child.stderr.on('data', (chunk) => {
      output += chunk
    })
    child.on('error', reject)
    const finish = (code) =>
      code === 0
        ? resolve(output)
        : reject(new Error(`${path.basename(binary)} exited ${code}: ${output}`))
    if (path.basename(binary).startsWith('pg_ctl')) {
      // Windows postgres can inherit pg_ctl's pipe handles after pg_ctl exits.
      // Waiting for "close" would wait for server shutdown before connecting.
      child.on('exit', (code) => {
        child.stdout.destroy()
        child.stderr.destroy()
        finish(code)
      })
    } else {
      child.on('close', finish)
    }
  })
}

export async function startCluster(binDir) {
  const dir = await mkdtemp(path.join(tmpdir(), 'dm-hp-lab-'))
  const data = path.join(dir, 'data')
  const exe = (name) => path.join(binDir, name + (process.platform === 'win32' ? '.exe' : ''))
  // Allow only OS runtime variables. PG*, database URLs and Supabase credentials
  // are never passed to subprocesses. No .env or user PostgreSQL config is read.
  const env = Object.fromEntries(
    ['PATH', 'SystemRoot', 'WINDIR', 'TEMP', 'TMP', 'LANG', 'LC_ALL']
      .filter((key) => process.env[key] !== undefined)
      .map((key) => [key, process.env[key]])
  )
  env.LC_ALL = 'C'
  if (process.platform === 'linux') env.LD_LIBRARY_PATH = path.resolve(binDir, '../lib')
  const version = (await command(exe('postgres'), ['--version'], env)).trim()
  if (!/PostgreSQL\) 17\./.test(version)) throw new Error('This fixture requires PostgreSQL 17')
  const reservation = createServer()
  await new Promise((resolve, reject) => {
    reservation.once('error', reject)
    reservation.listen(0, '127.0.0.1', resolve)
  })
  const port = reservation.address().port
  await new Promise((resolve) => reservation.close(resolve))
  const database = 'hp_lab_' + randomBytes(8).toString('hex')
  const user = 'hp_lab_bootstrap'
  const clients = new Set()
  let started = false
  const ctl = (...args) => command(exe('pg_ctl'), ['-D', data, ...args], env)
  async function stop() {
    await Promise.allSettled([...clients].map((client) => client.end()))
    clients.clear()
    if (!started) {
      // A startup timeout can leave the owned server running. Inspect its own
      // data directory before deciding whether cleanup is required.
      try {
        await ctl('status')
        started = true
      } catch {
        /* no owned server */
      }
    }
    if (started) {
      await ctl('-m', 'fast', '-w', '-t', '20', 'stop')
      started = false
    }
  }
  async function connect(name = 'hp-lab', db = database) {
    // Explicit connection fields prevent libpq/pg environment defaults or URLs
    // from selecting any other database. The caller cannot supply a host/port.
    const client = new pg.Client({
      host: '127.0.0.1',
      port,
      user,
      database: db,
      password: () => '',
      ssl: false,
      application_name: name,
      connectionTimeoutMillis: 5000,
      options: '-c statement_timeout=10000',
      client_encoding: 'UTF8',
      statement_timeout: 10000,
      query_timeout: 15000,
    })
    await client.connect()
    clients.add(client)
    return client
  }
  try {
    await command(
      exe('initdb'),
      ['-D', data, '-U', user, '-A', 'trust', '--encoding=UTF8', '--locale=C', '--no-instructions'],
      env
    )
    // Write PostgreSQL configuration directly: shell quoting of pg_ctl -o is
    // different on Windows. The server exposes TCP on loopback only, no socket.
    await appendFile(
      path.join(data, 'postgresql.conf'),
      `\nlisten_addresses = '127.0.0.1'\nport = ${port}\nunix_socket_directories = ''\n`
    )
    await ctl('-l', path.join(dir, 'postgres.log'), '-w', '-t', '20', 'start')
    started = true
    const admin = await connect('hp-lab-bootstrap', 'postgres')
    // Before any database mutation, establish that this is our newly initialized
    // cluster, rather than another local server that won the port race.
    const identity = (
      await admin.query(
        "SELECT current_user, current_setting('data_directory') AS directory, host(inet_server_addr()) AS address"
      )
    ).rows[0]
    const actual = await stat(identity.directory, { bigint: true })
    const expected = await stat(data, { bigint: true })
    // File identity handles Windows short/long aliases without weakening the
    // comparison to a case-insensitive string on other operating systems.
    if (
      identity.current_user !== user ||
      identity.address !== '127.0.0.1' ||
      actual.ino !== expected.ino ||
      actual.dev !== expected.dev
    ) {
      throw new Error('Refusing cluster identity mismatch')
    }
    await admin.query(`CREATE DATABASE ${database}`)
    await admin.end()
    clients.delete(admin)
    const db = await connect('hp-lab-admin')
    await db.query("SELECT set_config('hp_lab.isolated', current_database(), false)")
    await db.query(await readFile(new URL('./fixture.sql', import.meta.url), 'utf8'))
    await writeFile(
      path.join(dir, 'identity.json'),
      JSON.stringify({ database, port, version, data }, null, 2)
    )
    return { db, connect, stop, database, version, directory: dir }
  } catch (error) {
    await stop()
    error.message += ` (local cluster diagnostics: ${dir})`
    throw error
  }
}
