import { test, expect } from '@playwright/test';

test.describe('Phase 5 Regression & Tour Handoff Assertions', () => {

  test('Assertion 1: React Joyride Beacon is hidden/suppressed (disableBeacon verified)', async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    await page.goto('http://localhost:5173/?dev=true', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const continueBtn = page.locator('button:has-text("Continue Tour")');
    await expect(continueBtn).toBeVisible({ timeout: 5000 });
    await continueBtn.click();
    await page.waitForTimeout(1500);

    const isBeaconVisible = await page.evaluate(() => {
      const el = document.querySelector('.react-joyride__beacon');
      if (!el) return false;
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetHeight > 0;
    });

    expect(isBeaconVisible).toBe(false);
    console.log('PASS: Assertion 1 — Joyride beacon is suppressed (isBeaconVisible === false).');
  });

  test('Assertion 2: Continue Tour auto-starts Joyride sequence immediately', async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    await page.goto('http://localhost:5173/?dev=true', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const continueBtn = page.locator('button:has-text("Continue Tour")');
    await expect(continueBtn).toBeVisible({ timeout: 5000 });

    // Click "Continue Tour"
    await continueBtn.click();
    await page.waitForTimeout(1500);

    // 1. Mascot modal must be closed
    await expect(continueBtn).toBeHidden();

    // 2. Dump all element classes/ids rendered in DOM
    const domClasses = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('*'))
        .map(el => el.className ? `${el.tagName}:${el.className}` : '')
        .filter(str => str.includes('joyride') || str.includes('floater') || str.includes('18262d'));
    });
    console.log('DOM JOYRIDE MATCHES:', domClasses);

    // 3. Check for Duo voice prompt text or Got It button in tour tooltip
    const gotItBtn = page.locator('button:has-text("Next"), button:has-text("Got It!")');
    await expect(gotItBtn.first()).toBeVisible({ timeout: 5000 });

    console.log('PASS: Assertion 2 — Modal closed and Joyride tour auto-started with Next/Got It button visible.');
  });

});
