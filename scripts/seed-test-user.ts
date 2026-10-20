import 'dotenv/config'
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const PROD_URLS = ['klzziumdjpagqquihpks.supabase.co']
const DEV_URL = 'yoondivyeueyrtgeldja.supabase.co'

const TEST_EMAIL = 'test@dm-workspace.dev'
const TEST_PASSWORD = 'test-password-123'

async function main() {
  if (!SUPABASE_URL) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL не задан в .env.local')
    process.exit(1)
  }

  if (PROD_URLS.some((p) => SUPABASE_URL.includes(p))) {
    console.error('❌ ОТКАЗ: URL указывает на PROD-базу. Seed запрещён.')
    process.exit(1)
  }

  if (!SUPABASE_URL.includes(DEV_URL)) {
    console.warn(`⚠️  URL не совпадает с dev-проектом (${DEV_URL})`)
    console.warn(`   Текущий: ${SUPABASE_URL}`)
    console.warn('   Продолжаем через 5 секунд... (Ctrl+C чтобы отменить)')
    await new Promise((r) => setTimeout(r, 5000))
  }

  if (!SERVICE_ROLE_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY не задан в .env.local')
    process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log('🌱 Seeding into:', SUPABASE_URL)

  let userId: string
  const { data: existingUsers } = await supabase.auth.admin.listUsers()
  const existing = existingUsers?.users.find((u) => u.email === TEST_EMAIL)

  if (existing) {
    console.log('✓ Пользователь уже есть:', TEST_EMAIL)
    userId = existing.id
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: { display_name: 'Test User', username: 'testuser' },
    })
    if (error) throw error
    userId = data.user.id
    console.log('✓ Создан пользователь:', TEST_EMAIL)
  }

  await supabase.from('profiles').upsert({
    id: userId,
    display_name: 'Test User',
    username: 'testuser',
  })

  const { data: existingCampaigns } = await supabase
    .from('campaigns')
    .select('id')
    .eq('name', 'Test Campaign')
    .eq('owner_id', userId)
    .limit(1)

  let campaignId: string
  if (existingCampaigns?.[0]) {
    campaignId = existingCampaigns[0].id
    console.log('✓ Кампания уже есть:', campaignId)
  } else {
    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        name: 'Test Campaign',
        genre: 'Fantasy',
        description: 'Кампания для E2E-тестов',
        owner_id: userId,
        invite_code: 'TESTINVITE01',
      })
      .select('id')
      .single()
    if (error) throw error
    campaignId = data.id
    console.log('✓ Создана кампания:', campaignId)
  }

  await supabase
    .from('campaign_members')
    .upsert(
      { campaign_id: campaignId, user_id: userId, role: 'dm' },
      { onConflict: 'campaign_id,user_id' }
    )

  const { count: chapterCount } = await supabase
    .from('chapters')
    .select('id', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)

  if (!chapterCount) {
    await supabase.from('chapters').insert([
      {
        campaign_id: campaignId,
        title: 'Глава 1: Начало',
        content_md: '# Глава 1\n\nЭто тестовая глава для E2E.',
        order_index: 0,
        is_visible_to_players: true,
      },
      {
        campaign_id: campaignId,
        title: 'Глава 2: Приключение',
        content_md: '# Глава 2\n\nВторая тестовая глава.',
        order_index: 1,
        is_visible_to_players: true,
      },
    ])
    console.log('✓ Создано 2 главы')
  }

  const { count: entityCount } = await supabase
    .from('entities')
    .select('id', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)

  if (!entityCount) {
    await supabase.from('entities').insert([
      {
        campaign_id: campaignId,
        type: 'npc',
        name: 'Тестовый NPC',
        description: 'Дружелюбный трактирщик',
        data_json: { ac: 10, hp: 10, hp_max: 10 },
        is_visible_to_players: true,
      },
      {
        campaign_id: campaignId,
        type: 'location',
        name: 'Тестовая таверна',
        description: 'Место встречи',
        data_json: {},
        is_visible_to_players: true,
      },
      {
        campaign_id: campaignId,
        type: 'monster',
        name: 'Тестовый гоблин',
        description: 'Слабый враг',
        data_json: { ac: 15, hp: 7, hp_max: 7, cr: '1/4' },
        is_visible_to_players: false,
      },
    ])
    console.log('✓ Создано 3 сущности')
  }

  const { count: sceneCount } = await supabase
    .from('scenes')
    .select('id', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)

  if (!sceneCount) {
    await supabase.from('scenes').insert({
      campaign_id: campaignId,
      name: 'Тестовая сцена',
      grid_size: 50,
      width: 20,
      height: 20,
      grid_type: 'square',
      is_active: true,
      fog_enabled: false,
    })
    console.log('✓ Создана сцена')
  }

  const { count: charCount } = await supabase
    .from('characters')
    .select('id', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)

  if (!charCount) {
    await supabase.from('characters').insert({
      campaign_id: campaignId,
      user_id: userId,
      name: 'Тестовый герой',
      data_json: {
        level: 1,
        class: 'fighter',
        race: 'human',
        abilities: { str: 16, dex: 12, con: 14, int: 10, wis: 10, cha: 10 },
        hp: { current: 12, max: 12, temp: 0 },
        ac: 16,
        deathSaves: { successes: 0, failures: 0, stabilized: false },
        spells: [],
        spellSlots: {},
        inventory: [],
        currency: { pp: 0, gp: 10, sp: 0, cp: 0 },
      },
      is_active: true,
      is_visible_to_party: true,
    })
    console.log('✓ Создан персонаж')
  }

  console.log('\n🎉 Seed завершён!')
  console.log('   Email:', TEST_EMAIL)
  console.log('   Пароль:', TEST_PASSWORD)
}

main().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
