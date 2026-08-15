const puppeteer = require('puppeteer-core');
(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/home/claude/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', err => errors.push(`[pageerror] ${err.stack || err.message}`));
  page.on('response', async res => {
    if (res.status() >= 400 && !res.url().includes('fonts.g') && !res.url().includes('favicon')) {
      errors.push(`[http ${res.status()}] ${res.url()}`);
    }
  });

  await page.goto('http://localhost:5190/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000));

  // manifest check
  const manifestHref = await page.evaluate(() => document.querySelector('link[rel="manifest"]')?.href);
  console.log('MANIFEST LINK:', manifestHref);
  if (manifestHref) {
    const manifestResp = await page.evaluate(async (url) => {
      const r = await fetch(url); return { status: r.status, body: await r.text() };
    }, manifestHref);
    console.log('MANIFEST FETCH:', manifestResp.status, manifestResp.body.slice(0, 200));
  }

  const swRegistered = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return 'no support';
    const regs = await navigator.serviceWorker.getRegistrations();
    return regs.length ? regs.map(r => r.active?.scriptURL) : 'none yet';
  });
  console.log('SERVICE WORKER:', swRegistered);

  // click "Создать новый кошелёк" -> backup -> password -> dashboard
  async function clickByText(text) {
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const t = await page.evaluate(el => el.textContent, b);
      if (t.includes(text)) { await b.click(); return true; }
    }
    return false;
  }

  await clickByText('Создать новый кошелёк');
  await new Promise(r => setTimeout(r, 500));
  const cb = await page.$('input[type=checkbox]');
  if (cb) await cb.click();
  await new Promise(r => setTimeout(r, 200));
  await clickByText('Продолжить');
  await new Promise(r => setTimeout(r, 400));
  const pwInputs = await page.$$('input[type=password]');
  await pwInputs[0].type('testpassword123');
  await pwInputs[1].type('testpassword123');
  await clickByText('Создать кошелёк');
  await new Promise(r => setTimeout(r, 1500));

  console.log('DASHBOARD TEXT:', (await page.evaluate(() => document.body.innerText)).slice(0, 150));

  // click first asset row (Ethereum)
  const rows = await page.$$('.ledger-row');
  console.log('LEDGER ROWS FOUND:', rows.length);
  if (rows.length) {
    await rows[0].click();
    await new Promise(r => setTimeout(r, 500));
    console.log('ASSET DETAIL TEXT:', (await page.evaluate(() => document.body.innerText)).slice(0, 300));

    // click "Отправить" inside detail
    await clickByText('Отправить');
    await new Promise(r => setTimeout(r, 400));
    console.log('SEND SHEET TEXT:', (await page.evaluate(() => document.body.innerText)).slice(0, 300));
  }

  console.log('---ERRORS---');
  console.log(errors.join('\n') || '(none)');
  await browser.close();
})();
