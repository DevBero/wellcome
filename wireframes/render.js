// Renders every phone in screens.html to its own PNG (transparent corners).
// Usage: node wireframes/render.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const dir = __dirname;
const out = path.join(dir, 'png');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1500, height: 1000 }, deviceScaleFactor: 3 });
  await page.goto('file://' + path.join(dir, 'screens.html'));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  const fonts = await page.evaluate(() => [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.weight));
  console.log('fonts loaded:', [...new Set(fonts)].join(', '));
  for (const el of await page.locator('.phone').all()) {
    const id = await el.getAttribute('id');
    await el.screenshot({ path: path.join(out, `${id}.png`), omitBackground: true });
    const over = await el.evaluate(p => { const b = p.querySelector('.body'); return b.scrollHeight - b.clientHeight; });
    const help = await el.evaluate(p => { const h = p.querySelector('.help, .tabbar'); if (!h) return 0; const last = [...p.querySelectorAll('.body > *')].pop().getBoundingClientRect().bottom; return Math.round(last - h.getBoundingClientRect().top); });
    console.log(id, 'overflow', over, 'overlap with bottom bar', help);
  }
  const board = await browser.newPage({ viewport: { width: 2400, height: 1400 }, deviceScaleFactor: 1.5 });
  await board.goto('file://' + path.join(dir, 'overview.html'));
  await board.evaluate(() => document.fonts.ready);
  await board.locator('.board').screenshot({ path: path.join(out, 'uebersicht.png') });
  await browser.close();
})();
