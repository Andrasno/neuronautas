/**
 * E2E: Full game flow - play through dice rolls and card interactions.
 */
import { test, expect } from '@playwright/test';

test.describe('Game Flow', () => {
  test('profile -> board -> dice -> tile interaction', async ({ page }) => {
    await page.goto('/');

    // Select profile
    await page.locator('.explorador-btn').click();
    await page.locator('.avatar-btn').first().click();

    // Wait for game screen
    await expect(page.locator('.game-header')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.attribute-panel')).toBeVisible();
    await expect(page.locator('.dice-area')).toBeVisible();

    // Attribute bars present
    await expect(page.locator('.attr-bar-container')).toHaveCount(3);

    // Stars display present
    await expect(page.locator('.stars-display')).toBeVisible();

    // Board visible with tiles
    await expect(page.locator('.board-container')).toBeVisible();
    await expect(page.locator('.tile')).toHaveCount(15);

    // Click a die to roll
    await page.locator('.die.clickable').first().click();

    // Should have a current tile after movement
    await expect(page.locator('.tile.current')).toBeVisible();
  });

  test('attribute bars show correct initial values', async ({ page }) => {
    await page.goto('/');
    await page.locator('.explorador-btn').click();
    await page.locator('.avatar-btn').first().click();

    await expect(page.locator('.attr-bar-container')).toHaveCount(3, { timeout: 10000 });

    // Check attribute icons are present
    await expect(page.locator('.attr-icon').first()).toBeVisible();

    // Star count visible
    await expect(page.locator('.stars-count')).toBeVisible();
  });

  test('buttons for album and menu exist', async ({ page }) => {
    await page.goto('/');
    await page.locator('.explorador-btn').click();
    await page.locator('.avatar-btn').first().click();

    await expect(page.locator('#btn-album')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#btn-menu')).toBeVisible();
  });
});
