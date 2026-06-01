import { test, expect } from '@playwright/test';

/**
 * Tests E2E Full-Stack para la vista de Certificados Médicos.
 * NO hay ningun mock de red. Playwright interactua con:
 *   - El Frontend React en http://localhost:5174
 *   - La API Fastify real en http://localhost:3001
 *   - La base de datos PostgreSQL de test (alentapp_test_db)
 *
 * El global-setup limpia la DB antes de correr la suite.
 */

test.describe('Medical Certificates Full-Stack E2E', () => {
  test('debe crear un certificado medico real y mostrarlo en la tabla', async ({ page }) => {
    const memberName = 'Socio Certificado E2E';
    const memberDni = '55566688';
    const memberEmail = 'certificado-e2e@alentapp.dev';
    const memberBirthdate = '1995-06-15';
    const issueDate = '2026-05-30';
    const expirationDate = '2027-05-30';
    const memberLabel = `${memberName} - ${memberDni}`;

    await page.goto('/members');

    await page.locator('button:has-text("Agregar Miembro")').click();
    await expect(page.getByText('Agregar Nuevo Miembro')).toBeVisible();

    await page.getByPlaceholder('Ej. Juan Pérez').fill(memberName);
    await page.getByPlaceholder('Ej. 12345678').fill(memberDni);
    await page.getByPlaceholder('ejemplo@correo.com').fill(memberEmail);
    await page.getByLabel(/Fecha de Nacimiento/i).fill(memberBirthdate);
    await page.getByRole('button', { name: 'Crear Miembro' }).click();

    await expect(page.getByRole('button', { name: 'Crear Miembro' })).toBeHidden();
    await expect(page.getByText(memberName)).toBeVisible({ timeout: 10000 });

    await page.goto('/medical-certificates');
    await expect(page.getByText('No se encontraron certificados médicos.')).toBeVisible({ timeout: 10000 });

    await page.locator('button:has-text("Nuevo Certificado")').click();
    await expect(page.getByText('Nuevo Certificado Médico')).toBeVisible();

    await page.getByText('Seleccione un socio').click();
    await page.getByRole('option', { name: memberLabel }).click();

    await page.getByLabel(/Fecha de emisión/i).fill(issueDate);
    await page.getByLabel(/Fecha de vencimiento/i).fill(expirationDate);

    await page.getByRole('button', { name: 'Crear Certificado' }).click();

    await expect(page.getByRole('button', { name: 'Crear Certificado' })).toBeHidden();
    const createdCertificateRow = page.getByRole('row', { name: new RegExp(memberLabel) });
    await expect(createdCertificateRow).toBeVisible({ timeout: 10000 });
    await expect(createdCertificateRow).toContainText('Activo');
    await expect(createdCertificateRow).toContainText('Certificado vigente');


    page.on('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: /Eliminar certificado/i }).first().click();

    await expect(page.getByText('No se encontraron certificados médicos.')).toBeVisible({ timeout: 10000 });
  });
});
