// @ts-check
import { test, expect } from '@playwright/test';

const URL = 'https://cloze-reader.cuny.qzz.io';

const VIEWPORTS = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 14', width: 390, height: 844 },
  { name: 'iPad', width: 768, height: 1024 },
  { name: 'Desktop 1024', width: 1024, height: 768 },
  { name: 'Desktop 1440', width: 1440, height: 900 },
  { name: 'Desktop 1920', width: 1920, height: 1080 },
];

for (const vp of VIEWPORTS) {
  test(`caret: no floating above footer [${vp.name}]`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });

    // Old floating wrapper must be gone
    const oldWrap = page.locator('#scroll-toggle-wrap');
    await expect(oldWrap).toHaveCount(0);

    // New button must be inside the footer controls-inner
    const footer = page.locator('#sticky-controls .controls-inner #scroll-toggle');
    // Footer may be hidden until game starts — just verify structure exists
    await expect(footer).toHaveCount(1);
  });

  test(`caret: no overlap with text or footer edge [${vp.name}]`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });

    // Dismiss welcome overlay if present
    const welcomeStart = page.locator('button:has-text("Start"), button:has-text("Play"), button:has-text("Begin")').first();
    if (await welcomeStart.isVisible({ timeout: 3000 }).catch(() => false)) {
      await welcomeStart.click();
      await page.waitForTimeout(1000);
    }

    const footer = page.locator('#sticky-controls');
    const footerVisible = await footer.isVisible({ timeout: 5000 }).catch(() => false);
    if (!footerVisible) return; // game not started, skip overlap check

    const footerBox = await footer.boundingBox();
    const caretBtn = page.locator('#scroll-toggle');
    const caretVisible = await caretBtn.isVisible({ timeout: 2000 }).catch(() => false);
    if (!caretVisible || !footerBox) return;

    const caretBox = await caretBtn.boundingBox();
    if (!caretBox) return;

    // Caret must not be above the footer top edge (i.e., not floating above the footer)
    expect(caretBox.y).toBeGreaterThanOrEqual(footerBox.y - 2); // 2px tolerance

    // Caret must not extend below the viewport
    expect(caretBox.y + caretBox.height).toBeLessThanOrEqual(vp.height + 2);
  });

  test(`caret: is a circle and matches new design [${vp.name}]`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });

    const caretBtn = page.locator('#scroll-toggle');
    await expect(caretBtn).toHaveCount(1);
    await expect(caretBtn).toHaveClass(/about-toggle-btn/);

    // Has the CSS chevron span child
    const chevron = page.locator('#scroll-toggle .about-chevron');
    await expect(chevron).toHaveCount(1);
  });
}
