import path from 'node:path'

export async function spellAreaScenarios(scenario, expect, output) {
  for (const lang of ['ru', 'en'])
    for (const mobile of [false, true]) {
      const ru = lang === 'ru'
      await scenario(
        'spell area controls and keyboard preserve game data ' + lang + ' ' + mobile,
        {
          mobile,
          width: 320,
          url: '/?screen=map&mapImage&role=player&lang=' + lang + (ru ? '' : '&theme=light'),
        },
        async (page) => {
          const trigger = page.getByRole('button', { name: ru ? 'Области' : 'Areas', exact: true })
          await trigger.click()
          const controls = page.getByRole('region', {
            name: ru ? 'Область заклинания' : 'Spell area',
            exact: true,
          })
          const layer = page.getByTestId('spell-area-layer')
          const preview = page.getByTestId('spell-area-preview')
          await expect(controls).toBeVisible()
          await expect(controls).toContainText(
            ru ? 'Предпросмотр виден только вам' : 'Only you see this preview'
          )
          await controls
            .getByText(ru ? 'Готовые заклинания' : 'Spell presets', { exact: true })
            .first()
            .click()
          await controls
            .getByRole('button', {
              name: ru ? 'Молния · 100 × 5 фт' : 'Lightning bolt · 100 × 5 ft',
              exact: true,
            })
            .click()
          const length = controls.getByRole('spinbutton', {
            name: ru ? 'Длина, футы' : 'Length, feet',
          })
          const width = controls.getByRole('spinbutton', {
            name: ru ? 'Ширина, футы' : 'Width, feet',
          })
          await expect(length).toHaveValue('100')
          await expect(width).toHaveValue('5')
          await controls
            .getByRole('button', {
              name: ru ? 'В видимой части карты' : 'Place in map view',
              exact: true,
            })
            .click()
          await expect(layer).toBeFocused()
          await expect(preview).toHaveCount(1)
          const startX = Number(await preview.getAttribute('data-origin-x'))
          await layer.press('ArrowRight')
          await expect(preview).toHaveAttribute('data-origin-x', String(startX + 1))
          await layer.press('Shift+ArrowRight')
          expect(Number(await preview.getAttribute('data-angle'))).toBeCloseTo(Math.PI / 12, 8)
          await width.fill('10')
          await width.press('Tab')
          await expect(width).toHaveValue('10')
          await length.fill('')
          await expect(
            controls.getByText(
              ru ? 'Введите число от 5 до 300.' : 'Enter a number from 5 to 300.',
              { exact: true }
            )
          ).toBeVisible()
          await length.press('Tab')
          await expect(length).toHaveValue('100')
          await length.fill('301')
          await length.press('Tab')
          await expect(length).toHaveValue('100')
          await controls
            .getByRole('button', { name: ru ? 'Квадрат' : 'Square', exact: true })
            .click()
          await expect(
            controls.getByRole('spinbutton', { name: ru ? 'Сторона, футы' : 'Side, feet' })
          ).toHaveValue('100')
          await expect(preview).toHaveCount(1)
          await controls
            .getByRole('button', { name: ru ? 'Убрать область' : 'Clear area', exact: true })
            .click()
          await expect(preview).toHaveCount(0)
          await controls.getByRole('button', { name: ru ? 'Конус' : 'Cone', exact: true }).click()
          await controls
            .getByRole('spinbutton', { name: ru ? 'Длина, футы' : 'Length, feet' })
            .fill('15')
          await controls
            .getByRole('button', {
              name: ru ? 'В видимой части карты' : 'Place in map view',
              exact: true,
            })
            .click()
          await layer.press('Home')
          await expect(preview).toHaveAttribute('data-origin-x', '12')
          await expect(preview).toHaveAttribute('data-origin-y', '8')
          await layer.press('Escape')
          await expect(controls).toHaveCount(0)
          await expect(trigger).toBeFocused()
          await trigger.click()
          await expect(preview).toHaveCount(0)
          await controls
            .getByText(ru ? 'Готовые заклинания' : 'Spell presets', { exact: true })
            .first()
            .click()
          await controls
            .getByRole('button', {
              name: ru ? 'Огненный шар · радиус 20 фт' : 'Fireball · 20 ft radius',
              exact: true,
            })
            .click()
          await controls
            .getByRole('button', {
              name: ru ? 'В видимой части карты' : 'Place in map view',
              exact: true,
            })
            .click()
          await expect(preview.locator('circle').first()).toHaveAttribute('r', '200')
          await controls.scrollIntoViewIfNeeded()
          await page.screenshot({
            path: path.join(
              output,
              'spell-areas-' + lang + (mobile ? '-mobile' : '-desktop') + '.png'
            ),
          })
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)
          ).toBe(true)
          for (const button of await controls.getByRole('button').all()) {
            const b = await button.boundingBox()
            if (b) expect(b.height).toBeGreaterThanOrEqual(43)
          }
          expect(await page.evaluate(() => window.__uiLab.mapActions)).toEqual([])
        }
      )
    }
  await scenario(
    'spell area drag uses configured dimensions across map zoom and completes final pointer position',
    {
      url: '/?screen=map&mapImage',
    },
    async (page) => {
      await page.getByRole('button', { name: 'Области', exact: true }).click()
      const controls = page.getByRole('region', { name: 'Область заклинания', exact: true })
      await controls.getByRole('button', { name: 'Линия', exact: true }).click()
      await controls.getByRole('spinbutton', { name: 'Длина, футы' }).fill('60')
      await controls.getByRole('spinbutton', { name: 'Ширина, футы' }).fill('10')
      const viewport = page.getByRole('region', {
        name: 'Игровая карта — используйте стрелки для прокрутки',
      })
      // Explicit Fit gives a bounded stage, then user zoom changes must not change geometry.
      await page.getByRole('button', { name: 'Вписать', exact: true }).click()
      const layer = page.getByTestId('spell-area-layer')
      await viewport.scrollIntoViewIfNeeded()
      let bounds = await layer.boundingBox()
      await page.mouse.move(bounds.x + bounds.width / 4, bounds.y + bounds.height / 4)
      await page.mouse.down()
      await page.mouse.move(bounds.x + bounds.width / 4 + 10, bounds.y + bounds.height / 4)
      await page.mouse.up()
      const preview = page.getByTestId('spell-area-preview')
      await expect(preview).toHaveAttribute('data-origin-x', '6')
      await expect(preview).toHaveAttribute('data-origin-y', '4')
      const points = await preview.locator('polygon').getAttribute('points')
      expect(points).toBe('300,150 900,150 900,250 300,250')
      await page.getByRole('button', { name: 'Увеличить масштаб карты', exact: true }).click()
      await expect(preview.locator('polygon')).toHaveAttribute('points', points)
      await layer.focus()
      await layer.press('Shift+ArrowDown')
      expect(Number(await preview.getAttribute('data-angle'))).toBeCloseTo(Math.PI / 12, 8)
      await controls.getByRole('button', { name: 'Повернуть на 15° влево' }).click()
      await expect(preview).toHaveAttribute('data-angle', '0')
      await controls.getByRole('button', { name: 'Убрать область', exact: true }).click()
      await expect(preview).toHaveCount(0)
      expect(await page.evaluate(() => window.__uiLab.mapActions)).toEqual([])
    }
  )
  await scenario(
    'spell area touch cancellation restores prior placement and cannot move tokens',
    {
      mobile: true,
      url: '/?screen=map&mapImage',
    },
    async (page) => {
      await page.getByRole('button', { name: 'Области', exact: true }).click()
      const controls = page.getByRole('region', { name: 'Область заклинания', exact: true })
      await page.getByRole('button', { name: 'Вписать', exact: true }).click()
      await controls.getByRole('button', { name: 'В видимой части карты', exact: true }).click()
      const layer = page.getByTestId('spell-area-layer'),
        preview = page.getByTestId('spell-area-preview')
      const before = await preview.getAttribute('data-origin-x')
      const bounds = await layer.boundingBox()
      const cdp = await page.context().newCDPSession(page)
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: bounds.x + bounds.width / 4, y: bounds.y + bounds.height / 4 }],
      })
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }],
      })
      await expect(preview).toHaveAttribute('data-origin-x', '6')
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] })
      await expect(preview).toHaveAttribute('data-origin-x', before)
      await cdp.detach()
      await controls
        .getByRole('button', { name: 'Закрыть области заклинаний', exact: true })
        .click()
      await expect(layer).toHaveCount(0)
      expect(await page.evaluate(() => window.__uiLab.mapActions)).toEqual([])
    }
  )
  await scenario(
    'spell area Escape does not close a nested combat confirmation or switch tools',
    {
      url: '/?screen=map&mapImage&combat&current',
    },
    async (page) => {
      await page.getByRole('button', { name: 'Области', exact: true }).click()
      const controls = page.getByRole('region', { name: 'Область заклинания', exact: true })
      await controls.getByRole('button', { name: 'В видимой части карты', exact: true }).click()
      const preview = page.getByTestId('spell-area-preview')
      await page
        .getByRole('region', { name: 'Лента ходов' })
        .getByRole('button', { name: 'Панель боя', exact: true })
        .click()
      const drawer = page.getByRole('dialog', { name: 'Панель боя', exact: true })
      await drawer.getByRole('button', { name: 'Завершить бой', exact: true }).click()
      await page.keyboard.press('Escape')
      await expect(drawer).toBeVisible()
      await expect(preview).toHaveCount(1)
      await page.keyboard.press('Escape')
      await expect(drawer).toHaveCount(0)
      await expect(controls).toBeVisible()
      await expect(preview).toHaveCount(1)
      await page.getByRole('button', { name: 'Выбор', exact: true }).click()
      await expect(preview).toHaveCount(0)
      expect(await page.evaluate(() => window.__uiLab.mapActions)).toEqual([])
    }
  )
}
