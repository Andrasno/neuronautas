/**
 * E2E: Board display and token movement.
 */
import { test, expect } from '@playwright/test';

test.describe('Board and Movement', () => {
  test('board displays tiles after profile selection', async ({ page }) => {
    await page.goto('/');
    await page.locator('.explorador-btn').click();
    await page.locator('.avatar-btn').first().click();
    await expect(page.locator('.board-container')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.tile')).toHaveCount(15);
  });

  test('navegante board has 30 tiles', async ({ page }) => {
    await page.goto('/');
    await page.locator('.navegante-btn').click();
    await page.locator('.avatar-btn').first().click();
    await expect(page.locator('.tile')).toHaveCount(30, { timeout: 10000 });
  });

  test('current tile is highlighted', async ({ page }) => {
    await page.goto('/');
    await page.locator('.explorador-btn').click();
    await page.locator('.avatar-btn').first().click();
    await expect(page.locator('.tile.current')).toBeVisible({ timeout: 10000 });
  });

  test('board has all tile types', async ({ page }) => {
    await page.goto('/');
    await page.locator('.explorador-btn').click();
    await page.locator('.avatar-btn').first().click();
    await expect(page.locator('.tile-treino').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.tile-surpresa').first()).toBeVisible();
    await expect(page.locator('.tile-chefao').first()).toBeVisible();
  });

  test('header shows planet name', async ({ page }) => {
    await page.goto('/');
    await page.locator('.explorador-btn').click();
    await page.locator('.avatar-btn').first().click();
    await expect(page.locator('.planet-name')).toBeVisible({ timeout: 10000 });
  });
});
