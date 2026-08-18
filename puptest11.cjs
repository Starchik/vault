const puppeteer = require('puppeteer-core');
(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/home/claude/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  page.on('pageerror', err => console.log('[pageerror]', err.stack || err.message));

  await page.goto('http://localhost:5240/', { waitUntil: 'domcontentloaded', timeout: 15000 });
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

  await clickByText('Купить');
  await new Promise(r => setTimeout(r, 600));
  console.log('=== BUY TAB ===');
  console.log(await page.evaluate(() => document.body.innerText));

  await browser.close();
})();
