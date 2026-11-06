export async function initiativeSyncScenarios(scenario, expect) {
  const read = async (page) => JSON.parse(await page.getByTestId('initiative-data').textContent())
  const pending = (page, count = 1) =>
    expect.poll(() => page.evaluate(() => window.__initiativeLab.pending.length)).toBe(count)
  const finish = (page) =>
    page.evaluate(() => {
      const request = window.__initiativeLab.pending.shift()
      request.resolve(request.result)
    })
  await scenario(
    'initiative sync fresh server props supersede an earlier queue response',
    { url: '/?screen=initiative-sync&deferred' },
    async (page) => {
      await pending(page)
      await page.evaluate(() => {
        const entries = structuredClone(window.__initiativeLab.rows)
        entries[0].token.name = 'Fresh server queue'
        entries[0].is_current = true
        window.dispatchEvent(new CustomEvent('offline-initiative-source', { detail: { entries } }))
      })
      await expect.poll(async () => (await read(page))[0].token.name).toBe('Fresh server queue')
      await finish(page)
      await expect.poll(() => page.evaluate(() => window.__initiativeLab.active)).toBe(0)
      await page.waitForTimeout(80)
      expect((await read(page))[0].token.name).toBe('Fresh server queue')
      expect((await read(page))[0].is_current).toBe(true)
    }
  )
  await scenario(
    'initiative sync coalesces bursts and discards a snapshot overtaken by an event',
    { url: '/?screen=initiative-sync&deferred' },
    async (page) => {
      await pending(page)
      await page.evaluate(() => {
        const lab = window.__initiativeLab
        lab.rows[0].token.name = 'Latest remote queue'
        for (let i = 0; i < 30; i++) lab.emit('initiative')
      })
      expect(await page.evaluate(() => window.__initiativeLab.requests.length)).toBe(1)
      await finish(page)
      await pending(page)
      expect((await read(page))[0].token.name).not.toBe('Latest remote queue')
      expect(await page.evaluate(() => window.__initiativeLab.requests.length)).toBe(2)
      await finish(page)
      await expect.poll(async () => (await read(page))[0].token.name).toBe('Latest remote queue')
      expect(await page.evaluate(() => window.__initiativeLab.maxActive)).toBe(1)
    }
  )
  await scenario(
    'initiative sync ignores movement-only token events and refreshes visible changes',
    { url: '/?screen=initiative-sync&role=player' },
    async (page) => {
      await expect.poll(() => page.evaluate(() => window.__initiativeLab.requests.length)).toBe(1)
      await expect.poll(() => page.evaluate(() => window.__initiativeLab.active)).toBe(0)
      await page.evaluate(() => {
        const lab = window.__initiativeLab
        for (let i = 0; i < 30; i++)
          lab.emit('tokens', { new: { ...lab.rows[0].token, x: i, y: i, updated_at: String(i) } })
      })
      await page.waitForTimeout(120)
      expect(await page.evaluate(() => window.__initiativeLab.requests.length)).toBe(1)
      await page.evaluate(() => {
        const lab = window.__initiativeLab
        lab.rows[0].token.name = 'Changed participant'
        lab.rows[0].token.hp_current = 5
        lab.emit('tokens', { new: lab.rows[0].token })
      })
      await expect.poll(async () => (await read(page))[0].token.name).toBe('Changed participant')
      expect((await read(page))[0].token.hp_current).toBe(5)
      await expect(page.getByRole('button', { name: /Changed participant/ })).toBeVisible()
      await page.evaluate(() => {
        const lab = window.__initiativeLab
        lab.rows[0].token.is_hidden = true
        lab.emit('tokens', { new: lab.rows[0].token })
      })
      await expect(page.getByRole('button', { name: /Changed participant/ })).toHaveCount(0)
      expect(await page.evaluate(() => window.__uiLab.mapActions)).toEqual([])
    }
  )
  await scenario(
    'initiative sync preserves the queue on errors and reconciles an empty queue on reconnect',
    { url: '/?screen=initiative-sync&deferred' },
    async (page) => {
      await pending(page)
      await page.evaluate(() =>
        window.__initiativeLab.pending.shift().resolve({
          data: null,
          error: { message: 'Offline query error' },
        })
      )
      await expect.poll(() => page.evaluate(() => window.__initiativeLab.active)).toBe(0)
      expect(await read(page)).toHaveLength(2)
      await page.evaluate(() => window.__initiativeLab.emit('initiative'))
      await pending(page)
      await page.evaluate(() =>
        window.__initiativeLab.pending.shift().reject(new Error('Offline transport'))
      )
      await expect.poll(() => page.evaluate(() => window.__initiativeLab.active)).toBe(0)
      expect(await read(page)).toHaveLength(2)
      await page.evaluate(() => {
        window.__initiativeLab.rows = []
        window.__initiativeLab.status('SUBSCRIBED')
      })
      await pending(page)
      await finish(page)
      await expect.poll(() => read(page)).toEqual([])
    }
  )
  await scenario(
    'initiative sync invalidates deferred enrichment when server props change',
    { url: '/?screen=initiative-sync&deferred' },
    async (page) => {
      await pending(page)
      await page.evaluate(() => {
        const lab = window.__initiativeLab
        lab.deferred.add('characters')
        const request = lab.pending.shift()
        request.result.data[0].token.character_id = 'linked-character'
        request.resolve(request.result)
      })
      await pending(page)
      await page.evaluate(() => {
        const entries = structuredClone(window.__initiativeLab.rows)
        entries[0].token.name = 'New props during AC lookup'
        window.dispatchEvent(new CustomEvent('offline-initiative-source', { detail: { entries } }))
      })
      await expect
        .poll(async () => (await read(page))[0].token.name)
        .toBe('New props during AC lookup')
      await finish(page)
      await page.waitForTimeout(80)
      expect((await read(page))[0].token.name).toBe('New props during AC lookup')
    }
  )
  await scenario(
    'initiative sync batches armor lookups and invalidates enrichment after an event',
    { url: '/?screen=initiative-sync&deferred' },
    async (page) => {
      await pending(page)
      await page.evaluate(() => {
        const lab = window.__initiativeLab
        const rows = structuredClone(lab.rows)
        rows[0].token.character_id = 'shared-character'
        rows[1].token.character_id = 'shared-character'
        rows.push({
          ...rows[1],
          id: 'entity-entry',
          token_id: 'entity-token',
          token: {
            ...rows[1].token,
            id: 'entity-token',
            character_id: null,
            entity_id: 'entity',
          },
        })
        rows.push({ ...rows[1], id: 'missing-token-entry', token: null })
        rows[1].token = [rows[1].token]
        lab.rows = rows
        lab.characters = [{ id: 'shared-character', data_json: { ac: 17 } }]
        lab.entities = [{ id: 'entity', data_json: { ac: 19 } }]
        lab.deferred.add('characters')
        lab.deferred.add('entities')
        lab.pending.shift().resolve({ data: structuredClone(rows), error: null })
      })
      await pending(page, 2)
      expect(await page.evaluate(() => window.__initiativeLab.requests[1].ids)).toEqual([
        'shared-character',
      ])
      expect(await page.evaluate(() => window.__initiativeLab.requests[2].ids)).toEqual(['entity'])
      expect(await page.evaluate(() => window.__initiativeLab.requests[0].orders)).toEqual([
        'turn_order',
        'id',
      ])
      await page.evaluate(() => {
        const lab = window.__initiativeLab
        lab.rows[0].token.name = 'Latest during enrichment'
        lab.emit('initiative')
      })
      await finish(page)
      await finish(page)
      await pending(page)
      expect((await read(page))[0].token.name).not.toBe('Latest during enrichment')
      await page.evaluate(() => {
        window.__initiativeLab.deferred.delete('characters')
        window.__initiativeLab.deferred.delete('entities')
      })
      await finish(page)
      await expect
        .poll(async () => (await read(page))[0].token.name)
        .toBe('Latest during enrichment')
      const entries = await read(page)
      expect(entries).toHaveLength(3)
      expect(entries.map((entry) => entry.token.ac)).toEqual([17, 17, 19])
    }
  )
  await scenario(
    'initiative sync isolates scene changes, disabled subscriptions and unmounts',
    { url: '/?screen=initiative-sync&deferred' },
    async (page) => {
      await pending(page)
      await page.evaluate(() => {
        const lab = window.__initiativeLab
        const entries = structuredClone(lab.rows).map((entry) => ({
          ...entry,
          scene_id: 'other-scene',
          token: { ...entry.token, scene_id: 'other-scene', name: 'New scene participant' },
        }))
        lab.rows = entries
        window.dispatchEvent(
          new CustomEvent('offline-initiative-source', {
            detail: { sceneId: 'other-scene', entries },
          })
        )
      })
      await pending(page, 2)
      await finish(page)
      expect((await read(page))[0].token.name).toBe('New scene participant')
      await page.evaluate(() =>
        window.dispatchEvent(
          new CustomEvent('offline-initiative-source', {
            detail: { enabled: false },
          })
        )
      )
      await expect.poll(() => page.evaluate(() => window.__initiativeLab.removals)).toBe(2)
      await finish(page)
      const requests = await page.evaluate(() => window.__initiativeLab.requests.length)
      await page.evaluate(() => window.__initiativeLab.emit('initiative'))
      await page.waitForTimeout(80)
      expect(await page.evaluate(() => window.__initiativeLab.requests.length)).toBe(requests)
      await page.evaluate(() =>
        window.dispatchEvent(
          new CustomEvent('offline-initiative-source', {
            detail: { enabled: true },
          })
        )
      )
      await pending(page)
      await page.evaluate(() =>
        window.dispatchEvent(
          new CustomEvent('offline-initiative-source', {
            detail: { mounted: false },
          })
        )
      )
      await expect(page.getByTestId('initiative-data')).toHaveCount(0)
      await finish(page)
      await expect.poll(() => page.evaluate(() => window.__initiativeLab.active)).toBe(0)
      expect(await page.evaluate(() => window.__initiativeLab.removals)).toBe(3)
    }
  )
}
