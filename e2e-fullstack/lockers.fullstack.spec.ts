import { test, expect } from '@playwright/test';

/**
 * Tests E2E Full-Stack para la vista de Lockers.
 * NO hay ningun mock de red. Playwright interactua con:
 *   - El Frontend React en http://localhost:5174
 *   - La API Fastify real en http://localhost:3001
 *   - La base de datos PostgreSQL de test (alentapp_test_db)
 *
 * El global-setup limpia la DB antes de correr la suite.
 */

test.describe('Lockers Full-Stack E2E', () => {
  test('debe mostrar el estado vacio cuando no hay lockers en la DB', async ({ page }) => {
    await page.goto('/lockers');
    await expect(page.getByText('No se encontraron lockers con los filtros actuales.')).toBeVisible({ timeout: 10000 });
  });

  test('debe crear un locker real y mostrarlo en la grilla', async ({ page }) => {
    await page.goto('/lockers');

    await page.locator('button:has-text("Nuevo Locker")').click();
    await expect(page.getByText('Alta de nuevo Locker')).toBeVisible();

    await page.getByPlaceholder('Ej: 101').fill('201');
    await page.getByPlaceholder('Ej: Pasillo Principal / Vestuario A').fill('Sector A - Planta Baja');

    await page.getByRole('button', { name: 'Guardar Locker' }).click();

    await expect(page.getByRole('heading', { name: /Locker #201/ })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Sector A - Planta Baja')).toBeVisible();
    await expect(page.getByText('Disponible', { exact: true })).toBeVisible();
  });

  test('debe editar el locker creado y ver el cambio en la grilla', async ({ page }) => {
    await page.goto('/lockers');

    await expect(page.getByRole('heading', { name: /Locker #201/ })).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: 'Opciones' }).click();
    await page.getByRole('menuitem', { name: 'Editar Locker' }).click();
    await expect(page.getByText('Editar Locker #201')).toBeVisible();

    const numberInput = page.getByPlaceholder('Ej: 101');
    await numberInput.fill('202');
    await page.getByPlaceholder('Ej: Pasillo Principal').fill('Sector B - Planta Alta');

    await page.getByRole('button', { name: 'Guardar Cambios' }).click();

    await expect(page.getByRole('heading', { name: /Locker #202/ })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Sector B - Planta Alta')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Locker #201/ })).toBeHidden();
  });
});