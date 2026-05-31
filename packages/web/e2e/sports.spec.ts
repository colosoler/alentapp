import { test, expect } from '@playwright/test';

test.describe('Sports E2E (UI Integration)', () => {
  test.beforeEach(async ({ page }) => {
    const mockDb = [
      {
        id: 'sport-1',
        name: 'Yoga',
        description: 'Clase inicial de movilidad',
        max_capacity: 12,
        current_enrollment_count: 3,
        additional_price: 1500,
        requires_medical_certificate: false,
      },
    ];

    await page.route(/\/api\/v1\/sports/, async (route) => {
      const method = route.request().method();

      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: mockDb }),
        });
      } else if (method === 'PATCH') {
        const urlObj = new URL(route.request().url());
        const id = urlObj.pathname.split('/').pop();
        const payload = route.request().postDataJSON();
        const index = mockDb.findIndex((sport) => sport.id === id);

        if (index > -1) {
          mockDb[index] = {
            ...mockDb[index],
            ...payload,
          };

          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ data: mockDb[index] }),
          });
        } else {
          await route.fulfill({
            status: 404,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'El deporte no existe' }),
          });
        }
      } else if (method === 'OPTIONS') {
        await route.fulfill({
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/sports');
  });

  test('debe editar un deporte y mostrar la descripcion y capacidad actualizadas', async ({ page }) => {
    await expect(page.getByText('Yoga')).toBeVisible();
    await expect(page.getByText('Clase inicial de movilidad')).toBeVisible();

    await page.getByRole('button', { name: /Editar deporte/i }).click();

    await expect(page.getByText('Editar Deporte')).toBeVisible();
    await page
      .getByPlaceholder('Detalle de la actividad, horarios o condiciones generales')
      .fill('Yoga restaurativo para adultos');
    await page.getByLabel(/Capacidad maxima/i).fill('18');
    await page.getByRole('button', { name: 'Guardar Cambios' }).click();

    await expect(page.getByRole('button', { name: 'Guardar Cambios' })).toBeHidden();
    await expect(page.getByText('Yoga restaurativo para adultos')).toBeVisible();
    await expect(page.getByText('3/18')).toBeVisible();
  });
});
