const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  console.log('Indítás...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('Navigálás...');
    await page.goto('https://bmszc-neumann.e-kreta.hu/Adminisztracio/Login');
    await page.screenshot({ path: 'login_page.png' });
    console.log('Képernyőfotó mentve: login_page.png');
  } catch(e) {
    console.log('Hiba:', e);
  } finally {
    await browser.close();
  }
})();
