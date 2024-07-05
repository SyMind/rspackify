import { test, expect } from '@playwright/test';

test('Vue CLI', async ({ page }) => {
  await page.goto(`http://127.0.0.1:4203/`);
  await expect(page.getByRole('heading', { name: 'Yay! Welcome to umi!' })).toBeVisible();
});
