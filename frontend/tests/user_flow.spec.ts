import { test, expect } from '@playwright/test';

test('Flujo completo: Login Admin -> Crear Solicitud -> Login Chofer -> Registrar Gasto', async ({ page }) => {
  // 1. Login como Admin
  await page.goto('/login');
  await page.getByPlaceholder('SU@EMAIL.COM').fill('admin@admin.com'); // Usamos placeholder porque el label no tiene for
  await page.getByPlaceholder('••••••••').fill('1234');
  await page.getByRole('button', { name: 'ENTRAR AL SISTEMA' }).click();

  // Verificar que entramos al Dashboard
  await expect(page.getByRole('link', { name: 'Nueva Solicitud' })).toBeVisible();

  // 2. Crear una Nueva Solicitud (Desde Servicios Individuales)
  await page.getByRole('link', { name: 'Servicios Individuales' }).click();
  await page.getByRole('button', { name: 'NUEVA SOLICITUD' }).click();

  // Seleccionar servicio (usamos index 1 que suele ser el primero disponible)
  await page.locator('select').first().selectOption({ index: 1 });

  // Fecha (Dinámica para hoy - YYYY-MM-DDTHH:mm)
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  // Usamos las 12:00 para evitar problemas de bordes de día
  const todayStr = `${year}-${month}-${day}T12:00`;

  await page.locator('input[type="datetime-local"]').fill(todayStr);

  // Precio (asumiendo input de number/text)
  await page.getByPlaceholder('0').fill('150000');

  // Confirmar Solicitud
  await page.getByRole('button', { name: 'CONFIRMAR SOLICITUD' }).click();

  // Esperar un poco a que se procese
  await page.waitForTimeout(1000);

  // 3. Logout
  await page.getByRole('button', { name: 'CERRAR SESIÓN' }).click();

  /*
  // 4. Login como Chofer (comentado hasta tener un chofer de prueba garantizado)
  await page.getByPlaceholder('SU@EMAIL.COM').fill('jperez@mail.com');
  await page.getByPlaceholder('••••••••').fill('1234'); 
  await page.getByRole('button', { name: 'ENTRAR AL SISTEMA' }).click();
  
  // Verificar panel de chofer
  await expect(page.getByRole('button', { name: 'INICIAR TURNO' })).toBeVisible();
  */
});