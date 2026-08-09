import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    artifact_dir = r"C:\Users\Varun Jain\.gemini\antigravity-ide\brain\7e5d6673-8077-4697-bffc-ae36007ee203"
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1280, "height": 900})

        url = "http://localhost:5173/?dev=true"
        print(f"Navigating to {url}...")
        try:
            await page.goto(url, wait_until="networkidle", timeout=10000)
        except Exception:
            url = "http://localhost:5174/?dev=true"
            print(f"Fallback to {url}...")
            await page.goto(url, wait_until="networkidle", timeout=10000)

        await page.wait_for_timeout(1000)

        # Shot 1: Duo Modal Initial
        shot1 = os.path.join(artifact_dir, "duo_modal_initial.png")
        await page.screenshot(path=shot1)
        print(f"Saved {shot1}")

        # Shot 2: Click Continue Tour
        continue_btn = page.locator('button:has-text("Continue Tour")')
        if await continue_btn.is_visible():
            await continue_btn.click()
            await page.wait_for_timeout(1200)

        shot2 = os.path.join(artifact_dir, "spotlight_step1_energy.png")
        await page.screenshot(path=shot2)
        print(f"Saved {shot2}")

        # Shot 3: Click Next on Joyride to show step 2
        next_btn = page.locator('button:has-text("Next")')
        if await next_btn.is_visible():
            await next_btn.click()
            await page.wait_for_timeout(800)

        shot3 = os.path.join(artifact_dir, "spotlight_step2_workflow.png")
        await page.screenshot(path=shot3)
        print(f"Saved {shot3}")

        # Shot 4: Standard User View (no ?dev=true)
        std_url = url.split("?")[0]
        await page.goto(std_url, wait_until="networkidle")
        await page.wait_for_timeout(800)
        skip_btn = page.locator('button:has-text("Skip to Lesson")')
        if await skip_btn.is_visible():
            await skip_btn.click()
            await page.wait_for_timeout(800)

        shot4 = os.path.join(artifact_dir, "standard_screen_a_topbar.png")
        await page.screenshot(path=shot4)
        print(f"Saved {shot4}")

        await browser.close()
        print("All screenshots successfully captured!")

if __name__ == "__main__":
    asyncio.run(main())
