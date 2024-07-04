import { test, expect } from '@playwright/test';

test('Create React App', async ({ page }) => {
  await page.goto(`http://127.0.0.1:4201/`);
  await expect(page.getByRole('heading', { name: 'Welcome to Create React App' })).toBeVisible();
});
