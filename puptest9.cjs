const puppeteer = require('puppeteer-core');
(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/home/claude/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', err => errs.push(err.stack || err.message));

  await page.goto('http://localhost:5231/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 1500));

  async function clickByText(text, exact = false) {
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const t = await page.evaluate(el => el.textContent, b);
      if (exact ? t.trim() === text : t.includes(text)) { await b.click(); return true; }
    }
    return false;
  }

  await clickByText('Создать новый кошелёк');
  await new Promise(r => setTimeout(r, 500));
  await (await page.$('input[type=checkbox]')).click();
  await new Promise(r => setTimeout(r, 200));
  await clickByText('Продолжить');
  await new Promise(r => setTimeout(r, 400));
  const pwInputs = await page.$$('input[type=password]');
  await pwInputs[0].type('testpassword123');
  await pwInputs[1].type('testpassword123');
  await clickByText('Создать кошелёк');
  await new Promise(r => setTimeout(r, 2000));

  // simulate a SUCCESSFUL balance fetch to trigger the exact code path that crashed before
  await page.evaluate(() => {
    window.__origFetch = window.fetch;
    window.fetch = async (url, opts) => {
      if (typeof url === 'string' && url.includes('publicnode.com')) {
        // fake a JSON-RPC eth_getBalance response: 0.5 ETH in wei, hex
        const body = JSON.parse(opts.body);
        if (body.method === 'eth_getBalance') {
          return new Response(JSON.stringify({ jsonrpc: '2.0', id: body.id, result: '0x6f05b59d3b20000' }), { status: 200 });
        }
        if (body.method === 'eth_chainId') {
          return new Response(JSON.stringify({ jsonrpc: '2.0', id: body.id, result: '0x1' }), { status: 200 });
        }
        if (body.method === 'eth_getTransactionCount' || body.method === 'eth_estimateGas') {
          return new Response(JSON.stringify({ jsonrpc: '2.0', id: body.id, result: '0x5208' }), { status: 200 });
        }
        if (body.method === 'eth_gasPrice') {
          return new Response(JSON.stringify({ jsonrpc: '2.0', id: body.id, result: '0x3b9aca00' }), { status: 200 });
        }
      }
      return window.__origFetch(url, opts);
    };
  });

  console.log('=== Swap tab with MOCKED successful balance fetch ===');
  await clickByText('Обмен');
  await new Promise(r => setTimeout(r, 2000));
  const bodyText = await page.evaluate(() => document.body.innerText).catch(e => 'CRASHED: ' + e.message);
  console.log(bodyText);
  console.log('PAGE ERRORS:', errs.length ? errs.join('\n---\n') : '(none)');

  console.log('=== Buy tab (with MoonPay test key configured) ===');
  await clickByText('Купить');
  await new Promise(r => setTimeout(r, 500));
  console.log((await page.evaluate(() => document.body.innerText)).slice(0, 400));

  await browser.close();
})();
