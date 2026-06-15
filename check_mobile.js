import puppeteer from 'puppeteer';

async function main() {
  console.log("Launching browser...");
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  } catch (err) {
    console.error("Puppeteer launch failed:", err);
    process.exit(1);
  }

  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.error('BROWSER ERROR:', err.toString()));

  console.log("Navigating to http://localhost:5173/admin/login...");
  await page.goto('http://localhost:5173/admin/login', { waitUntil: 'networkidle0' });

  console.log("Bypassing login...");
  const buttons = await page.$$eval('button', btns => btns.map(b => b.textContent));
  console.log("Found buttons:", buttons);

  const demoBtnText = "Entrar como Demonstrativo";
  const btnHandles = await page.$$('button');
  for (const handle of btnHandles) {
    const text = await page.evaluate(el => el.textContent, handle);
    if (text.includes(demoBtnText)) {
      console.log("Clicking demo button...");
      await handle.click();
      break;
    }
  }

  await new Promise(resolve => setTimeout(resolve, 2000));
  console.log("Navigating to http://localhost:5173/admin/mobile...");
  await page.goto('http://localhost:5173/admin/mobile', { waitUntil: 'networkidle0' });
  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log("Current URL:", page.url());
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log("Body text length:", bodyText.length);
  console.log("Body sample:", bodyText.substring(0, 500));

  await browser.close();
}

main().catch(err => {
  console.error("Script failed:", err);
  process.exit(1);
});
