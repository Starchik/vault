const puppeteer = require('puppeteer-core');
(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/home/claude/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  page.on('pageerror', err => console.log('[pageerror]', err.stack || err.message));
  page.on('console', msg => console.log(`[console.${msg.type()}]`, msg.text()));

  const client = await page.target().createCDPSession();
  await client.send('WebAuthn.enable');
  await client.send('WebAuthn.addVirtualAuthenticator', {
    options: {
      protocol: 'ctap2',
      transport: 'internal',
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  });

  await page.goto('http://localhost:5196/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 1500));

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

  await clickByText('⚙');
  await new Promise(r => setTimeout(r, 500));

  // directly call enrollBiometric in page context to see the real error
  const result = await page.evaluate(async () => {
    try {
      const mod = await import('/src/lib/biometric.js');
      await mod.enrollBiometric('testpassword123');
      return { ok: true };
    } catch (e) {
      return { ok: false, message: e.message, name: e.name, stack: e.stack };
    }
  });
  console.log('DIRECT ENROLL RESULT:', JSON.stringify(result, null, 2));

  await browser.close();
})();
