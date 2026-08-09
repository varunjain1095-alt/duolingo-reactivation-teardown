import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });

  const artifactDir = 'C:\\Users\\Varun Jain\\.gemini\\antigravity-ide\\brain\\7e5d6673-8077-4697-bffc-ae36007ee203';

  console.log('Navigating to http://localhost:5174/?dev=true...');
  await page.goto('http://localhost:5174/?dev=true', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1. Take screenshot of Duo Mascot Reintroduction Modal initial state
  const screenshot1 = path.join(artifactDir, 'duo_modal_rendered.png');
  await page.screenshot({ path: screenshot1 });
  console.log('Saved duo_modal_rendered.png');

  // 2. Click "Continue Tour" button on Duo Modal
  console.log('Clicking Continue Tour on Duo Modal...');
  const continueBtn = page.locator('button:has-text("Continue Tour")');
  if (await continueBtn.isVisible()) {
    await continueBtn.click();
    await page.waitForTimeout(1500); // Allow modal to close and Joyride to auto-start
  }

  // 3. Take screenshot of Screen A with rendered stat bar AND active Joyride spotlight
  const screenshot2 = path.join(artifactDir, 'screen_a_statbar_rendered.png');
  await page.screenshot({ path: screenshot2 });
  console.log('Saved screen_a_statbar_rendered.png');

  // 4. Also check without ?dev=true (standard user flow)
  console.log('Navigating to standard user view http://localhost:5174/...');
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  const skipBtn = page.locator('button:has-text("Skip to Lesson")');
  if (await skipBtn.isVisible()) {
    // Close modal via skip to view standard Screen A stat bar directly at top
    const closeBtn = page.locator('button[aria-label="Skip to Lesson"]').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(800);
    }
  }

  const screenshot3 = path.join(artifactDir, 'standard_screen_a_statbar.png');
  await page.screenshot({ path: screenshot3 });
  console.log('Saved standard_screen_a_statbar.png');

  await browser.close();
  console.log('Screenshot capture complete!');
})();
