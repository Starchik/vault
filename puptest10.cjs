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

  await page.setRequestInterception(true);
  page.on('request', async (req) => {
    const url = req.url();
    if (url.includes('publicnode.com')) {
      const postData = req.postData();
      let body;
      try { body = JSON.parse(postData); } catch { body = null; }
      console.log('INTERCEPTED RPC REQUEST:', Array.isArray(body) ? body.map(b=>b.method) : body?.method);
      const mkResult = (id, method) => {
        if (method === 'eth_getBalance') return { jsonrpc: '2.0', id, result: '0x6f05b59d3b20000' };
        if (method === 'eth_chainId') return { jsonrpc: '2.0', id, result: '0x1' };
        if (method === 'eth_gasPrice') return { jsonrpc: '2.0', id, result: '0x3b9aca00' };
        if (method === 'eth_getTransactionCount') return { jsonrpc: '2.0', id, result: '0x0' };
        if (method === 'eth_estimateGas') return { jsonrpc: '2.0', id, result: '0x5208' };
        if (method === 'eth_blockNumber') return { jsonrpc: '2.0', id, result: '0x1' };
        return { jsonrpc: '2.0', id, result: '0x0' };
      };
      const respBody = Array.isArray(body)
        ? body.map(b => mkResult(b.id, b.method))
        : mkResult(body?.id, body?.method);
      await req.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(respBody),
      });
    } else {
      req.continue();
    }
  });

  await page.goto('http://localhost:5232/', { waitUntil: 'domcontentloaded', timeout: 15000 });
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

  console.log('=== Dashboard with MOCKED (intercepted) RPC responses ===');
  console.log((await page.evaluate(() => document.body.innerText)).slice(0, 500));

  console.log('=== Now clicking Swap tab ===');
  await clickByText('Обмен');
  await new Promise(r => setTimeout(r, 2500));
  const bodyText = await page.evaluate(() => document.body.innerText).catch(e => 'CRASHED: ' + e.message);
  console.log(bodyText);
  console.log('PAGE ERRORS:', errs.length ? errs.join('\n---\n') : '(none)');

  await browser.close();
})();
