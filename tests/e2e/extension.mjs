import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs/promises';
const extension = path.resolve('dist/claude-counter-blackspirits');
const context = await chromium.launchPersistentContext('', { channel: 'chromium', headless: true, args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`] });
const errors = [], calls = [];
let conversationText = 'Hello <|endoftext|> world';
const cdsComposer = await fs.readFile('tests/fixtures/cds-composer.html', 'utf8');
try {
 await context.addCookies([{ name: 'lastActiveOrg', value: 'A', url: 'https://claude.ai' }]);
 await context.route('**/*', async route => {
  const url = new URL(route.request().url()); calls.push(url.href);
  if (url.hostname !== 'claude.ai') return route.abort();
  if (url.pathname.startsWith('/claudeai-rpc/')) return route.fulfill({ contentType: 'application/connect+proto', body: '' });
  if (url.pathname.endsWith('/usage')) return route.fulfill({ json: { five_hour: { utilization: url.pathname.includes('/B/') ? 42 : 12.5, resets_at: new Date(Date.now() + 3600000).toISOString() }, seven_day: { utilization: 60, resets_at: new Date(Date.now() + 3 * 86400000).toISOString() } } });
  if (url.pathname.endsWith('/completion')) return route.fulfill({ contentType: 'text/event-stream', body: 'data: {"type":"message_limit","message_limit":{"windows":{"5h":{"utilization":0.25}}}}\n\n' });
  if (url.pathname.includes('/chat_conversations/')) return route.fulfill({ json: { current_leaf_message_uuid: 'a', chat_messages: [{ uuid: 'a', content: [{ type: 'text', text: conversationText }] }] } });
  return route.fulfill({ contentType: 'text/html', headers: { 'content-security-policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'" }, body: '<!doctype html><html data-mode="light"><head><meta charset="utf-8"></head><body><header><div class="chat-project-wrapper"><button data-testid="chat-menu-trigger">Chat</button></div></header><main style="max-width:740px;margin:auto"><div data-testid="chat-input-grid-area"><div data-testid="chat-input-grid-container"><button data-testid="model-selector-dropdown">Model</button><button>Send</button></div></div></main></body></html>' });
 });
 const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
 await page.goto('https://claude.ai/chat/C');
 await page.locator('.ccbs-usageRow[data-status="updated"]').waitFor();
 await page.waitForFunction(() => document.querySelector('.ccbs-header')?.textContent.includes('~9'));
 assert.equal(await page.evaluate(() => window.__ccbsBridgeInstalled), true, 'MAIN bridge loaded despite strict page CSP');
 assert.match(await page.locator('.ccbs-usageRow').innerText(), /12.5%/);
 assert.equal(await page.locator('.ccbs-refresh').getAttribute('type'), 'button');
 await page.locator('.ccbs-langChip').click(); await page.locator('.ccbs-langSelect').selectOption('pt-PT');
 await page.waitForFunction(() => document.querySelector('.ccbs-usageRow')?.textContent.includes('12,5%'));
 assert.equal(await page.locator('.ccbs-details').isVisible(), false, 'details are collapsed by default');
 await page.locator('.ccbs-detailsToggle').press('Enter');
 assert.equal(await page.locator('.ccbs-detailsToggle').getAttribute('aria-expanded'), 'true');
 assert.match(await page.locator('.ccbs-status').innerText(), /Atualizado às/);
 assert.match(await page.locator('.ccbs-details').innerText(), /repõe às/);
 await page.locator('.ccbs-detailsToggle').press('Escape');
 assert.equal(await page.locator('.ccbs-details').isVisible(), false);
 assert.equal(await page.locator('.ccbs-detailsToggle').getAttribute('aria-expanded'), 'false');
 conversationText = 'Hello world';
 await page.evaluate(async () => { const response = await fetch('/api/organizations/A/chat_conversations/C/completion', { method: 'POST' }); await response.text(); });
 await page.waitForFunction(() => document.querySelector('.ccbs-usageRow')?.textContent.includes('25%'));
 await page.waitForFunction(() => document.querySelector('.ccbs-header')?.textContent.includes('~2'), null, { timeout: 20000 });

 // Switch from the legacy grid to the CDS shape reported by a real user.
 // Native controls intentionally include several nested horizontal rows.
 await page.evaluate(composer => {
  const style = document.createElement('style');
  style.textContent = `body { margin: 0; background: #faf9f5; color: #30302e; font: 14px Arial; }
   main { width: calc(100% - 24px); }
   fieldset[data-perf-region="composer"] { display: flex; flex-direction: column; width: 100%; min-width: 0; margin: 0; border: 0; padding: 0; }
   .composer-stack, [data-cds="ChatComposer"] { display: flex; flex-direction: column; width: 100%; min-width: 0; }
   .composer-card { display: flex; align-items: center; min-height: 48px; border: 1px solid #888; border-radius: 14px; padding: 4px 10px; }
   [data-cds="ChatComposerEditor"] { flex: 1; min-width: 0; }
   [data-cds="ChatComposerChin"] { overflow: clip; padding: 6px 0; }
   .chin-row, .chin-start, .chin-end, .native-control-row { display: flex; align-items: center; gap: 8px; }
   .chin-row { justify-content: space-between; } .chin-end { margin-left: auto; min-width: 0; }
   .model-clip { overflow: hidden; min-width: 0; } button { font: inherit; }
   html[data-mode="dark"] body { background: #141413; color: #d4d3cb; }`;
  document.head.appendChild(style);
  document.querySelector('main').innerHTML = composer;
 }, cdsComposer);
 const placement = 'fieldset[data-perf-region="composer"] > .ccbs-usageRow';
 await page.locator(placement).waitFor();
 await page.evaluate(async () => { await fetch('/claudeai-rpc/Conversation/Stream'); });
 await page.waitForFunction(() => document.querySelector('.ccbs-transportNotice')?.textContent.includes('limitadas'));
 assert.equal(await page.locator('.ccbs-transportNotice').isVisible(), false, 'transport notice does not consume summary height');
 await fs.mkdir('test-results', { recursive: true });
 for (const [width, mode] of [[1074, 'dark'], [768, 'light'], [390, 'dark']]) {
  await page.setViewportSize({ width, height: 844 });
  await page.evaluate(theme => document.documentElement.dataset.mode = theme, mode);
  const layout = await page.evaluate(() => {
   const row = document.querySelector('.ccbs-usageRow');
   const rect = row.getBoundingClientRect();
   const chin = document.querySelector('[data-cds="ChatComposerChin"]').getBoundingClientRect();
   const groups = [...row.querySelectorAll('.ccbs-usageGroup')].map(group => {
    const text = group.querySelector('.ccbs-usageText').getBoundingClientRect();
    const bar = group.querySelector('.ccbs-bar').getBoundingClientRect();
    return { clear: text.right <= bar.left, y: text.top };
   });
   return { below: rect.top >= chin.bottom, inside: rect.left >= 0 && rect.right <= innerWidth,
    fullWidth: rect.width >= document.querySelector('fieldset').getBoundingClientRect().width - 1,
    height: rect.height, groups, controlText: document.querySelector('[data-testid="mode-control"]').textContent };
  });
  assert(layout.below && layout.inside && layout.fullWidth, `CDS counter placement at ${width}px`);
  assert(layout.groups.every(group => group.clear), 'text does not overlap bars');
  assert(Math.abs(layout.groups[0].y - layout.groups[1].y) < 1, 'session and weekly stay on one summary row');
  assert(layout.height <= 30, `collapsed counter is at most 30px tall at ${width}px (got ${layout.height})`);
  assert.equal(layout.controlText, 'Manual');
  assert.equal(await page.locator('[data-cds="ChatComposerChin"] .ccbs-usageRow').count(), 0);
  await page.screenshot({ path: `test-results/compact-${width}-${mode}.png` });
 }
 await page.locator('.ccbs-detailsToggle').click();
 assert(await page.locator('.ccbs-transportNotice').isVisible(), 'transport explanation remains accessible');
 await page.screenshot({ path: 'test-results/compact-details-390.png' });
 await page.locator('.ccbs-detailsToggle').click();
 // A connected counter can still be in the wrong place after host reparenting.
 await page.evaluate(() => document.querySelector('.native-control-row').appendChild(document.querySelector('.ccbs-usageRow')));
 await page.locator(placement).waitFor();
 // Replace the complete composer as a SPA renderer would, without copying extension nodes.
 await page.evaluate(composer => { document.querySelector('main').innerHTML = composer; }, cdsComposer);
 await page.locator(placement).waitFor();
 assert.equal(await page.locator('.ccbs-usageRow').count(), 1);
 assert.equal(await page.locator('[data-testid="model-selector-dropdown"]').count(), 1);
 await page.evaluate(() => { document.cookie = 'lastActiveOrg=B; path=/'; history.pushState({}, '', '/new'); });
 await page.waitForFunction(() => document.querySelector('.ccbs-usageRow')?.textContent.includes('42%'));
 assert.equal(await page.locator('.ccbs-header').innerText(), '');
 await page.evaluate(() => { document.cookie = 'lastActiveOrg=; path=/; max-age=0'; });
 await page.locator('.ccbs-usageRow[data-status="signedOut"]').waitFor();
 assert(await page.locator('.ccbs-refresh').isVisible()); assert(await page.locator('.ccbs-langChip').isVisible());
 assert.equal(await page.locator('.ccbs-detailsToggle').innerText(), '!', 'access errors remain visible in collapsed mode');
 await page.locator('.ccbs-detailsToggle').click();
 assert.match(await page.locator('.ccbs-details').innerText(), /Inicia sessão/);
 assert.deepEqual(errors, []); assert(calls.every(url => new URL(url).hostname === 'claude.ai'));
 console.log('Extension E2E passed: real MV3 loading, strict CSP, handshake, tokens, usage, pt-PT, SSE completion refresh, compact <=30px CDS summary at 1074/768/390px, keyboard details toggle, visible error indicator, dark/light themes, reparenting/replacement, SPA/org switch and logout.');
} finally { await context.close(); }
