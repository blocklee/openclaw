
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.goto('https://yasfi7qlk3r4.space.minimaxi.com/', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'page-screenshot.png', fullPage: true });
  await browser.close();
  console.log('Screenshot saved to page-screenshot.png');
})();
