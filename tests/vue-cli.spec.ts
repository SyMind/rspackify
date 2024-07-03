import { test, expect } from '@playwright/test';

test('Vue CLI', async ({ page }) => {
  await page.goto(`http://127.0.0.1:4200/`);
  await expect(page.getByRole('heading', { name: 'Welcome to Your Vue.js App' })).toBeVisible();
});
