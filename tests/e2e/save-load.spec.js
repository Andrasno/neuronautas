/**
 * E2E: Save and load via LocalStorage.
 */
import { test, expect } from '@playwright/test';

test.describe('Save and Load', () => {
  test('game state persists after page reload', async ({ page }) => {
    await page.goto('/');
    await page.locator('.explorador-btn').click();
    await page.locator('.avatar-btn').first().click();

    // Wait for game to load
    await expect(page.locator('.game-header')).toBeVisible({ timeout: 10000 });

    // Reload the page
    await page.reload();

    // Should still be on the game screen (not profile selector)
    await expect(page.locator('.game-header')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.profile-selector')).not.toBeVisible();
  });
});
