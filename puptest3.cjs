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
  page.on('console', msg => { if (msg.type() === 'error') errors.push(`[console.error] ${msg.text()}`) });

  const client = await page.target().createCDPSession();
  await client.send('WebAuthn.enable');
  const { authenticatorId } = await client.send('WebAuthn.addVirtualAuthenticator', {
    options: {
      protocol: 'ctap2',
      transport: 'internal',
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  });
  console.log('Virtual authenticator added:', authenticatorId);

  await page.goto('http://localhost:5195/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000));

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
  console.log('DASHBOARD:', (await page.evaluate(() => document.body.innerText)).slice(0, 80));

  // open settings, check webauthn support detection + enroll biometric
  await clickByText('⚙');
  await new Promise(r => setTimeout(r, 500));
  console.log('SETTINGS TEXT:', (await page.evaluate(() => document.body.innerText)).slice(0, 400));

  const enrolled = await clickByText('Включить');
  console.log('Clicked Включить:', enrolled);
  await new Promise(r => setTimeout(r, 1500));
  console.log('AFTER ENROLL:', (await page.evaluate(() => document.body.innerText)).slice(0, 400));
  console.log('localStorage biometric key:', await page.evaluate(() => localStorage.getItem('cw_biometric_v1')?.slice(0,100)));

  console.log('---ERRORS---');
  console.log(errors.join('\n') || '(none)');
  await browser.close();
})();
