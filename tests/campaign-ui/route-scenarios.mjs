import path from 'node:path'

export async function routeScenarios(scenario, expect, output) {
  for (const lang of ['ru', 'en'])
    for (const mobile of [false, true]) {
      const ru = lang === 'ru'
      await scenario(
        'route keyboard, policies and reset ' + lang + ' ' + mobile,
        {
          mobile,
          width: 320,
          url: '/?screen=map&mapImage&role=player&lang=' + lang + (ru ? '' : '&theme=light'),
        },
        async (page) => {
          const trigger = page.getByRole('button', { name: ru ? 'Маршрут' : 'Route', exact: true })
          await trigger.click()
          const controls = page.getByRole('region', {
            name: ru ? 'Планирование маршрута' : 'Route planner',
            exact: true,
          })
          const layer = page.getByTestId('route-layer')
          const preview = page.getByTestId('route-path')
          await expect(controls).toContainText(
            ru ? 'Маршрут виден только вам' : 'Only you see this route'
          )
          await controls
            .getByRole('button', { name: ru ? 'Курсор на карту' : 'Cursor on map' })
            .click()
          await expect(layer).toBeFocused()
          await layer.press('Home')
          await layer.press('Enter')
          for (let i = 0; i < 3; i++) await layer.press('ArrowRight')
          await layer.press('Enter')
          for (let i = 0; i < 4; i++) await layer.press('ArrowDown')
          await layer.press('Enter')
          await expect(preview).toHaveAttribute('data-feet', '35')
          await layer.press('ArrowRight')
          await layer.press('ArrowDown')
          await layer.press('Space')
          await expect(preview).toHaveAttribute('data-feet', '42')
          await controls
            .getByRole('button', { name: ru ? 'Диагональ = 5 фт' : 'Diagonal = 5 ft', exact: true })
            .click()
          await expect(preview).toHaveAttribute('data-feet', '40')
          const viewport = page.getByRole('region', {
            name: ru
              ? 'Игровая карта — используйте стрелки для прокрутки'
              : 'Battle map — use arrow keys to scroll',
          })
          const cursorBox = await page.getByTestId('route-cursor').boundingBox()
          const viewBox = await viewport.boundingBox()
          expect(cursorBox.x).toBeGreaterThanOrEqual(viewBox.x)
          expect(cursorBox.x + cursorBox.width).toBeLessThanOrEqual(viewBox.x + viewBox.width)
          await expect(page.getByTestId('route-map-summary')).toContainText('40')
          await controls.scrollIntoViewIfNeeded()
          await page.screenshot({
            path: path.join(output, 'route-' + lang + (mobile ? '-mobile' : '-desktop') + '.png'),
          })
          await controls
            .getByRole('button', { name: ru ? 'Отменить точку' : 'Undo point', exact: true })
            .click()
          await expect(preview).toHaveAttribute('data-feet', '35')
          await layer.focus()
          await layer.press('Backspace')
          await expect(preview).toHaveAttribute('data-feet', '15')
          // Duplicate Enter must not add a zero-length segment at the same cursor.
          await layer.press('Home')
          await layer.press('Enter')
          const before = await preview.getAttribute('points')
          await layer.press('Enter')
          await expect(preview).toHaveAttribute('points', before)
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)
          ).toBe(true)
          for (const button of await controls.getByRole('button').all()) {
            const box = await button.boundingBox()
            if (box) expect(box.height).toBeGreaterThanOrEqual(43)
          }
          await controls
            .getByRole('button', { name: ru ? 'Очистить путь' : 'Clear route', exact: true })
            .click()
          await expect(preview).toHaveCount(0)
          await expect(
            controls.getByRole('button', {
              name: ru ? 'Отменить точку' : 'Undo point',
              exact: true,
            })
          ).toBeDisabled()
          await layer.focus()
          await layer.press('Escape')
          await expect(controls).toHaveCount(0)
          await expect(trigger).toBeFocused()
          await trigger.click()
          await expect(preview).toHaveCount(0)
          expect(await page.evaluate(() => window.__uiLab.mapActions)).toEqual([])
        }
      )
    }
  await scenario(
    'route pointer coordinates survive zoom, scroll and tool switches',
    { url: '/?screen=map&mapImage' },
    async (page) => {
      await page.getByRole('button', { name: 'Маршрут', exact: true }).click()
      const layer = page.getByTestId('route-layer')
      const preview = page.getByTestId('route-path')
      const controls = page.getByRole('region', { name: 'Планирование маршрута', exact: true })
      for (const mode of ['fit', 'actual', 'zoom']) {
        if (mode === 'fit') await page.getByRole('button', { name: 'Вписать', exact: true }).click()
        if (mode === 'actual')
          await page
            .getByRole('button', { name: 'Показать карту в масштабе 100%', exact: true })
            .click()
        if (mode === 'zoom')
          await page.getByRole('button', { name: 'Увеличить масштаб карты', exact: true }).click()
        const clear = controls.getByRole('button', { name: 'Очистить путь', exact: true })
        if (await clear.isEnabled()) await clear.click()
        const viewport = page.getByRole('region', {
          name: 'Игровая карта — используйте стрелки для прокрутки',
        })
        await viewport.scrollIntoViewIfNeeded()
        await viewport.evaluate((el) => {
          el.scrollLeft = 40
          el.scrollTop = 30
        })
        const bounds = await layer.boundingBox()
        for (const point of [
          { x: 2.5, y: 2.5 },
          { x: 5.5, y: 6.5 },
        ])
          await page.mouse.click(
            bounds.x + (point.x * bounds.width) / 24,
            bounds.y + (point.y * bounds.height) / 16
          )
        await expect(preview).toHaveAttribute('data-feet', '25')
        await expect(preview).toHaveAttribute('points', '125,125 275,325')
        const summaryBox = await page.getByTestId('route-map-summary').boundingBox()
        const viewBox = await viewport.boundingBox()
        expect(summaryBox.x).toBeGreaterThanOrEqual(viewBox.x)
        expect(summaryBox.x + summaryBox.width).toBeLessThanOrEqual(viewBox.x + viewBox.width)
        expect(summaryBox.y).toBeGreaterThanOrEqual(viewBox.y)
      }
      await page.getByRole('button', { name: 'Области', exact: true }).click()
      await expect(layer).toHaveCount(0)
      await page.getByRole('button', { name: 'Маршрут', exact: true }).click()
      await expect(preview).toHaveCount(0)
      expect(await page.evaluate(() => window.__uiLab.mapActions)).toEqual([])
    }
  )
  await scenario(
    'route touch cancellation never appends a point or moves a token',
    { mobile: true, url: '/?screen=map&mapImage' },
    async (page) => {
      await page.getByRole('button', { name: 'Маршрут', exact: true }).click()
      await page.getByRole('button', { name: 'Вписать', exact: true }).click()
      const viewport = page.getByRole('region', {
        name: 'Игровая карта — используйте стрелки для прокрутки',
      })
      await viewport.scrollIntoViewIfNeeded()
      const layer = page.getByTestId('route-layer')
      const bounds = await layer.boundingBox()
      const cdp = await page.context().newCDPSession(page)
      const touch = async (type, x, y) =>
        cdp.send('Input.dispatchTouchEvent', {
          type,
          touchPoints: type === 'touchEnd' || type === 'touchCancel' ? [] : [{ x, y }],
        })
      await touch('touchStart', bounds.x + bounds.width / 4, bounds.y + bounds.height / 4)
      await touch('touchEnd')
      await touch('touchStart', bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
      await touch('touchCancel')
      await expect(page.getByTestId('route-path')).toHaveCount(0)
      await touch('touchStart', bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
      await touch('touchEnd')
      await expect(page.getByTestId('route-path')).toHaveCount(1)
      await cdp.detach()
      expect(await page.evaluate(() => window.__uiLab.mapActions)).toEqual([])
    }
  )
  await scenario(
    'route survives nested combat dialogs and clamps keyboard cursor to board',
    { url: '/?screen=map&mapImage&combat&current' },
    async (page) => {
      await page.getByRole('button', { name: 'Маршрут', exact: true }).click()
      const layer = page.getByTestId('route-layer')
      await layer.focus()
      await layer.press('Enter')
      for (let i = 0; i < 30; i++) await layer.press('ArrowLeft')
      await expect(page.getByTestId('route-cursor')).toHaveAttribute('data-x', '0.5')
      await layer.press('Enter')
      const before = await page.getByTestId('route-path').getAttribute('points')
      await page
        .getByRole('region', { name: 'Лента ходов' })
        .getByRole('button', { name: 'Панель боя', exact: true })
        .click()
      const drawer = page.getByRole('dialog', { name: 'Панель боя', exact: true })
      await drawer.getByRole('button', { name: 'Завершить бой', exact: true }).click()
      await page.keyboard.press('Escape')
      await expect(drawer).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(drawer).toHaveCount(0)
      await expect(page.getByTestId('route-path')).toHaveAttribute('points', before)
      expect(await page.evaluate(() => window.__uiLab.mapActions)).toEqual([])
    }
  )
}
