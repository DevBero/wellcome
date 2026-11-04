// Builds the speaker-notes PDF (A4) from talk.json, with a thumbnail of each slide.
// Usage: node deck/build-notes.js   (run deck/render-deck.js first)
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const dir = __dirname;
const talk = JSON.parse(fs.readFileSync(path.join(dir, 'talk.json'), 'utf8'));
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const pad = n => String(n).padStart(2, '0');

const timeline = talk.sections.map(s => `<div class="tl"><b>${esc(s.time)}</b><span>${esc(s.title)}</span></div>`).join('');

const sections = talk.sections.map(sec => `
  <section>
    <div class="sec"><h2>${esc(sec.title)}</h2><span class="time">${esc(sec.time)}</span></div>
    ${sec.slides.map(sl => `
      <div class="slide">
        <img src="out/folie-${pad(sl.n)}.png" alt="">
        <div>
          <div class="label">Folie ${sl.n} · ${esc(sl.name)}</div>
          <p class="core">${esc(sl.core)}</p>
          <ul>${sl.points.map(p => `<li>${esc(p)}</li>`).join('')}</ul>
          ${sl.hint ? `<p class="hint">${esc(sl.hint)}</p>` : ''}
        </div>
      </div>`).join('')}
  </section>`).join('');

const qa = talk.qa.map(([q, a]) => `<div class="qa"><b>${esc(q)}</b><span>${esc(a)}</span></div>`).join('');
const tips = talk.tips.map(t => `<li>${esc(t)}</li>`).join('');

const html = `<!doctype html><html lang="de"><head><meta charset="utf-8">
<title>Sprechnotizen – Case Study wellcome</title>
<link rel="stylesheet" href="../design/tokens.css">
<style>
  @page { size: A4; margin: 14mm 14mm 16mm; }
  body { background: #fff; font-size: 11pt; line-height: 1.4; }
  header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 6mm; }
  header h1 { font-size: 24pt; font-weight: 700; letter-spacing: -0.03em; line-height: 1.05; }
  header p { font-size: 11pt; color: var(--ink-2); margin-top: 2mm; }
  header img { height: 13mm; }
  .timeline { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2mm; margin-bottom: 7mm; }
  .tl { background: var(--ground); border-radius: 3mm; padding: 2.4mm 3.5mm; display: flex; gap: 3mm; align-items: baseline; }
  .tl b { font-size: 9.5pt; font-weight: 700; white-space: nowrap; }
  .tl span { font-size: 9.5pt; color: var(--ink-2); font-weight: 500; }
  section { margin-bottom: 4mm; }
  .sec { display: flex; justify-content: space-between; align-items: center; background: var(--field); border-radius: 999px; padding: 2.2mm 5mm; margin-bottom: 3mm; break-after: avoid; }
  .sec h2 { font-size: 14pt; font-weight: 700; letter-spacing: -0.02em; }
  .sec .time { font-size: 11pt; font-weight: 700; }
  .slide { display: grid; grid-template-columns: 44mm 1fr; gap: 5mm; padding: 2mm 0 4mm; break-inside: avoid; }
  .slide img { width: 44mm; border-radius: 2mm; margin-top: 1mm; }
  .label { font-size: 9pt; font-weight: 600; color: var(--ink-2); }
  .core { font-size: 13pt; font-weight: 700; letter-spacing: -0.01em; line-height: 1.25; margin: 0.8mm 0 1.6mm; }
  ul { padding-left: 4.5mm; }
  li { margin: 0.6mm 0; font-weight: 500; }
  li::marker { color: var(--cobalt); }
  .hint { margin-top: 2mm; background: var(--ground); border-radius: 2mm; padding: 1.8mm 3mm; font-size: 9.5pt; font-weight: 600; }
  .extra { break-before: page; }
  .extra h2 { font-size: 16pt; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 3mm; }
  .qa { display: grid; grid-template-columns: 52mm 1fr; gap: 4mm; padding: 2.4mm 0; break-inside: avoid; }
  .qa + .qa { border-top: 0.3mm solid var(--sunk); }
  .qa b { font-weight: 700; }
  .qa span { font-weight: 500; }
  .tips { margin-top: 8mm; background: var(--field); border-radius: 4mm; padding: 5mm 6mm 5mm 10mm; }
  .tips li { font-weight: 600; margin: 1.2mm 0; }
</style></head><body>
  <header><div><h1>Sprechnotizen</h1><p>Case Study: Startseite ElternLeben → wellcome · 15 Minuten</p></div><img src="../assets/wellcome-logo-mark.png" alt=""></header>
  <div class="timeline">${timeline}</div>
  ${sections}
  <div class="extra">
    <h2>Mögliche Rückfragen</h2>
    ${qa}
    <div class="tips"><h2 style="font-size:13pt;margin-bottom:2mm">Drei Tipps für den Vortrag</h2><ul>${tips}</ul></div>
  </div>
</body></html>`;

const htmlPath = path.join(dir, 'notes.html');
fs.writeFileSync(htmlPath, html);

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + htmlPath);
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: path.join(dir, 'out', 'Sprechnotizen_wellcome.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true,
    displayHeaderFooter: true, headerTemplate: '<span></span>',
    footerTemplate: '<div style="width:100%;font-size:8pt;color:#4B5D7A;text-align:right;padding:0 14mm;font-family:sans-serif"><span class="pageNumber"></span> / <span class="totalPages"></span></div>' });
  console.log('notes pdf written');
  await browser.close();
})();
