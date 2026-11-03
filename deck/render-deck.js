// Renders deck.html to one PNG per slide and a 16:9 PDF.
// Usage: node deck/render-deck.js   (run wireframes/render.js first)
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const dir = __dirname;
const out = path.join(dir, 'out');
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
  await page.goto('file://' + path.join(dir, 'deck.html'));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  const slides = await page.locator('section.slide').all();
  for (let i = 0; i < slides.length; i++) {
    await slides[i].screenshot({ path: path.join(out, `folie-${String(i + 1).padStart(2, '0')}.png`) });
  }
  // overflow check: any element sticking out of its slide
  const issues = await page.evaluate(() => [...document.querySelectorAll('section.slide')].map((s, i) => {
    const r = s.getBoundingClientRect();
    const bad = [...s.querySelectorAll('*')].filter(e => { const b = e.getBoundingClientRect(); return b.width && (b.bottom > r.bottom + 1 || b.right > r.right + 1); })
      .filter(e => !e.closest('.full-img') && getComputedStyle(e).position !== 'absolute' || e.matches('.box'));
    return bad.length ? `slide ${i + 1}: ${bad.slice(0, 3).map(e => e.className || e.tagName).join(', ')}` : null;
  }).filter(Boolean));
  console.log(issues.length ? issues.join('\n') : 'no overflow');
  await page.pdf({ path: path.join(out, 'Case_Study_wellcome_Folien.pdf'), width: '1920px', height: '1080px', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  console.log('rendered', slides.length, 'slides');
  await browser.close();
})();
