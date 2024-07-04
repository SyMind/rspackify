import { test, expect } from '@playwright/test';

test('Webpack CLI', async ({ page }) => {
  await page.goto(`http://127.0.0.1:4202/`);
  await expect(page.getByRole('heading', { name: 'Sensible webpack 5 boilerplate using Babel and PostCSS with a hot dev server and an optimized production build.' })).toBeVisible();
});
