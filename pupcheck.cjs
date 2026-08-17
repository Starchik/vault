const puppeteer = require('puppeteer-core');
(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/home/claude/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:5213/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  const result = await page.evaluate(async () => {
    try {
      const res = await fetch('https://tokens.1inch.io/v1.2/1');
      return { ok: res.ok, status: res.status };
    } catch (e) {
      return { error: e.message };
    }
  });
  console.log('1inch fetch test:', JSON.stringify(result));
  await browser.close();
})();
