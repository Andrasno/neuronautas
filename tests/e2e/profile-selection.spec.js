/**
 * E2E: Profile selection screen.
 */
import { test, expect } from '@playwright/test';

test.describe('Profile Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('shows profile selector on first visit', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.profile-selector')).toBeVisible();
    await expect(page.locator('.game-title')).toContainText('Neuronautas');
    await expect(page.locator('.age-question')).toContainText('idade');
  });

  test('has both profile buttons', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.explorador-btn')).toBeVisible();
    await expect(page.locator('.navegante-btn')).toBeVisible();
  });

  test('clicking explorador shows avatar picker then game', async ({ page }) => {
    await page.goto('/');
    await page.locator('.explorador-btn').click();
    await page.locator('.avatar-btn').first().click();
    // Avatar picker appears
    await expect(page.locator('.avatar-grid')).toBeVisible({ timeout: 5000 });
    await page.locator('.avatar-btn').first().click();
    // Game screen appears
    await expect(page.locator('.game-header')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.attribute-panel')).toBeVisible();
    await expect(page.locator('.board-area')).toBeVisible();
  });

  test('clicking navegante shows avatar picker then game', async ({ page }) => {
    await page.goto('/');
    await page.locator('.navegante-btn').click();
    await page.locator('.avatar-btn').first().click();
    await expect(page.locator('.avatar-grid')).toBeVisible({ timeout: 5000 });
    await page.locator('.avatar-btn').first().click();
    await expect(page.locator('.game-header')).toBeVisible({ timeout: 10000 });
  });
});
