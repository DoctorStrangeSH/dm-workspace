import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const BASE_URL = 'https://api.open5e.com/v2'
const DOCUMENT_KEY = 'srd-2024'

async function check(endpoint: string, label: string) {
  const url = `${BASE_URL}${endpoint}?document__key=${DOCUMENT_KEY}&limit=1`
  const res = await fetch(url)
  const data = await res.json()
  console.log(`\n=== ${label} ===`)
  console.log(JSON.stringify(data.results[0], null, 2))
}

async function main() {
  await check('/spells/', 'SPELL')
  await check('/creatures/', 'CREATURE')
}

main()
