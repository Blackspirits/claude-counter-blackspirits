import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs/promises';
const extension = path.resolve('dist/claude-counter-blackspirits');
const context = await chromium.launchPersistentContext('', { channel: 'chromium', headless: true, args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`] });
const errors = [], calls = [];
try {
 await context.addCookies([{ name: 'lastActiveOrg', value: 'A', url: 'https://claude.ai' }]);
 await context.route('**/*', async route => {
  const url = new URL(route.request().url()); calls.push(url.href);
  if (url.hostname !== 'claude.ai') return route.abort();
  if (url.pathname.endsWith('/usage')) return route.fulfill({ json: { five_hour: { utilization: url.pathname.includes('/B/') ? 42 : 12.5, resets_at: new Date(Date.now() + 3600000).toISOString() }, seven_day: { utilization: 60 } } });
  if (url.pathname.includes('/chat_conversations/')) return route.fulfill({ json: { current_leaf_message_uuid: 'a', chat_messages: [{ uuid: 'a', content: [{ type: 'text', text: 'Hello <|endoftext|> world' }] }] } });
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
 assert.match(await page.locator('.ccbs-status').first().innerText(), /Atualizado às/);
 await page.setViewportSize({ width: 390, height: 844 });
 assert(await page.locator('.ccbs-usageRow').evaluate(el => el.getBoundingClientRect().right <= innerWidth), 'narrow row stays inside viewport');
 await fs.mkdir('test-results', { recursive: true }); await page.screenshot({ path: 'test-results/beta-narrow.png' });
 await page.evaluate(() => { document.cookie = 'lastActiveOrg=B; path=/'; history.pushState({}, '', '/new'); });
 await page.waitForFunction(() => document.querySelector('.ccbs-usageRow')?.textContent.includes('42%'));
 assert.equal(await page.locator('.ccbs-header').innerText(), '');
 await page.evaluate(() => { document.cookie = 'lastActiveOrg=; path=/; max-age=0'; });
 await page.locator('.ccbs-usageRow[data-status="signedOut"]').waitFor();
 assert(await page.locator('.ccbs-refresh').isVisible()); assert(await page.locator('.ccbs-langChip').isVisible());
 assert.deepEqual(errors, []); assert(calls.every(url => new URL(url).hostname === 'claude.ai'));
 console.log('Extension E2E passed: real MV3 loading, strict CSP, handshake, tokens, usage, pt-PT, narrow layout, SPA/org switch and logout.');
} finally { await context.close(); }
