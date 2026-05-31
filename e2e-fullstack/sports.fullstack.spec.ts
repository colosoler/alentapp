import { test, expect } from '@playwright/test';

/**
 * Tests E2E Full-Stack para la vista de Deportes.
 * NO hay ningun mock de red. Playwright interactua con:
 *   - El Frontend React en http://localhost:5174
 *   - La API Fastify real en http://localhost:3001
 *   - La base de datos PostgreSQL de test (alentapp_test_db)
 *
 * El global-setup limpia la DB antes de correr la suite.
 */

test.describe('Sports Full-Stack E2E', () => {
  test('debe crear un deporte real y mostrarlo en la tabla', async ({ page }) => {
    await page.goto('/sports');

    await expect(page.getByText('No se encontraron deportes.')).toBeVisible({ timeout: 10000 });

    // Abrir modal de creacion
    await page.locator('button:has-text("Agregar Deporte")').click();
    await expect(page.getByText('Agregar Nuevo Deporte')).toBeVisible();

    // Llenar formulario con datos reales
    await page.getByPlaceholder('Ej. Natacion').fill('Natacion E2E Fullstack');
    await page
      .getByPlaceholder('Detalle de la actividad, horarios o condiciones generales')
      .fill('Actividad de pileta creada desde Playwright');
    await page.getByLabel(/Capacidad maxima/i).fill('20');
    await page.getByLabel(/Precio adicional/i).fill('1500');
    await page.getByText('Requiere certificado medico').click();

    // Guardar
    await page.getByRole('button', { name: 'Crear Deporte' }).click();

    // Esperar que el modal se cierre y el deporte aparezca en la tabla real
    await expect(page.getByRole('button', { name: 'Crear Deporte' })).toBeHidden();
    await expect(page.getByText('Natacion E2E Fullstack')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Actividad de pileta creada desde Playwright')).toBeVisible();
    await expect(page.getByText('0/20')).toBeVisible();
    await expect(page.getByText('$1500')).toBeVisible();
    await expect(page.getByText('Requerido')).toBeVisible();
  });

  test('debe eliminar un deporte real y quitarlo de la tabla', async ({ page }) => {
    await page.goto('/sports');

    const sportName = 'Deporte Delete E2E Fullstack';

    // Crear un deporte real como precondicion del borrado
    await page.locator('button:has-text("Agregar Deporte")').click();
    await expect(page.getByText('Agregar Nuevo Deporte')).toBeVisible();

    await page.getByPlaceholder('Ej. Natacion').fill(sportName);
    await page
      .getByPlaceholder('Detalle de la actividad, horarios o condiciones generales')
      .fill('Actividad creada para probar eliminacion desde Playwright');
    await page.getByLabel(/Capacidad maxima/i).fill('10');
    await page.getByLabel(/Precio adicional/i).fill('500');

    await page.getByRole('button', { name: 'Crear Deporte' }).click();
    await expect(page.getByRole('button', { name: 'Crear Deporte' })).toBeHidden();
    await expect(page.getByText(sportName)).toBeVisible({ timeout: 10000 });

    // Aceptar el confirm del navegador automaticamente
    page.on('dialog', (dialog) => dialog.accept());

    // Eliminar desde la fila del deporte creado
    const sportRow = page.locator('tr').filter({ hasText: sportName });
    await sportRow.getByRole('button', { name: /Eliminar deporte/i }).click();

    await expect(page.getByText(sportName)).toBeHidden({ timeout: 10000 });
  });
});
