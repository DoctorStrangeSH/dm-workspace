import { connection } from 'next/server'

/**
 * Помечает страницу как динамическую.
 * Вызывай первым делом в каждой авторизованной странице.
 */
export async function ensureDynamic() {
  await connection()
}
