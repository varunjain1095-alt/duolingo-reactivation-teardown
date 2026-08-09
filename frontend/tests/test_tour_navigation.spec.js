import { test, expect } from '@playwright/test';

test.describe('Spotlight Tour Multi-Step Navigation', () => {

  test('User can click Next through steps 1, 2, and 3 without getting stuck', async ({ page }) => {
    const logs = [];
    page.on('console', msg => {
      const text = msg.text();
      logs.push(text);
      console.log('PAGE LOG:', text);
    });

    await page.goto('http://localhost:5173/?dev=true', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // 1. Click "Continue Tour" on Mascot Modal
    const continueBtn = page.locator('button:has-text("Continue Tour")');
    await expect(continueBtn).toBeVisible({ timeout: 5000 });
    await continueBtn.click();
    await page.waitForTimeout(1500);

    // 2. Step 1 (Energy System on #energy-indicator) should be visible (1 / X)
    const stepCounter1 = page.locator('text=1 /');
    await expect(stepCounter1).toBeVisible({ timeout: 5000 });
    console.log('Step 1 verified active (1 / X).');

    // 3. Click "Next" button on Step 1 tooltip
    const nextBtn = page.locator('button:has-text("Next")');
    await expect(nextBtn).toBeVisible();
    await nextBtn.click();
    await page.waitForTimeout(1200);

    // 4. Step 2 should be active (2 / X)
    const stepCounter2 = page.locator('text=2 /');
    await expect(stepCounter2).toBeVisible({ timeout: 5000 });
    console.log('Step 2 verified active (2 / X).');

    // 5. Click "Next" button on Step 2 tooltip
    await nextBtn.click();
    await page.waitForTimeout(1200);

    // 6. Step 3 should be active (3 / X)
    const stepCounter3 = page.locator('text=3 /');
    await expect(stepCounter3).toBeVisible({ timeout: 5000 });
    console.log('Step 3 verified active (3 / X).');

    console.log('PASS: User successfully navigated through steps 1, 2, and 3!');
  });

});
