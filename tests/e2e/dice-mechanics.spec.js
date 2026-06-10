/**
 * E2E: Dice mechanics for both profiles.
 */
import { test, expect } from '@playwright/test';

test.describe('Dice Mechanics', () => {
  test('explorador shows 2 clickable dice', async ({ page }) => {
    await page.goto('/');
    await page.locator('.explorador-btn').click();
    await page.locator('.avatar-btn').first().click();
    await expect(page.locator('.die.clickable')).toHaveCount(2, { timeout: 10000 });
    await expect(page.locator('.dice-hint')).toBeVisible();
  });

  test('navegante shows 1 die with reroll controls', async ({ page }) => {
    await page.goto('/');
    await page.locator('.navegante-btn').click();
    await page.locator('.avatar-btn').first().click();
    await expect(page.locator('.die')).toHaveCount(1, { timeout: 10000 });
    await expect(page.locator('.accept-btn')).toBeVisible();
    await expect(page.locator('.reroll-btn')).toBeVisible();
    await expect(page.locator('.reroll-stars')).toBeVisible();
  });

  test('explorador: clicking a die advances the game', async ({ page }) => {
    await page.goto('/');
    await page.locator('.explorador-btn').click();
    await page.locator('.avatar-btn').first().click();
    await page.locator('.die.clickable').first().click();
    // Should now show a modal or board has changed
    await expect(page.locator('.tile.current')).toBeVisible({ timeout: 5000 });
  });
});
