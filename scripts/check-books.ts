import * as dndData from 'dnd-data'

// Уникальные book/publisher
const books = new Set<string>()
const publishers = new Set<string>()

for (const item of dndData.monsters) {
  if (item.book) books.add(item.book)
  if (item.publisher) publishers.add(item.publisher)
}

console.log('📚 Уникальные книги (монстры):')
console.log([...books].sort().slice(0, 30))

console.log('\n🏢 Уникальные издатели:')
console.log([...publishers].sort().slice(0, 20))

// Проверка: сколько монстров из PHB 2024?
const phb2024 = dndData.monsters.filter(
  (m: any) => m.book?.includes('2024') || m.book === "Player's Handbook"
)
console.log(`\n🎯 Монстры с "2024" в book: ${phb2024.length}`)

// То же для заклинаний
const spells2024 = dndData.spells.filter(
  (s: any) => s.book?.includes('2024') || s.book === "Player's Handbook"
)
console.log(`🎯 Заклинания с "2024" в book: ${spells2024.length}`)