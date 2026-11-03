// Renders each wireframe slide to PNG (full slide + each phone separately).
// Usage: node wireframes/render.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const dir = __dirname;
const out = path.join(dir, 'png');
fs.mkdirSync(out, { recursive: true });
const slides = fs.readdirSync(dir).filter(f => /^slide.*\.html$/.test(f));

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
  for (const f of slides) {
    const name = f.replace('.html', '');
    await page.goto('file://' + path.join(dir, f));
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    await page.locator('.slide').screenshot({ path: path.join(out, `${name}.png`) });
    for (const el of await page.locator('.device[id]').all()) {
      const id = await el.getAttribute('id');
      await el.locator('.phone, .desktop').first().screenshot({ path: path.join(out, `${name}-${id}.png`), omitBackground: true });
    }
    // overflow check: content taller than its screen
    const over = await page.evaluate(() => [...document.querySelectorAll('.content')].map(c => c.scrollHeight - c.clientHeight));
    console.log(name, 'overflow px per screen:', over.join(', '));
  }
  await browser.close();
})();
