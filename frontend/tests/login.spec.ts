import { test, expect } from '@playwright/test';

test('El login debe cargar y mostrar el titulo de la marca', async ({ page }) => {
    // Vamos directo a la página de login, no al home
    await page.goto('/login');

    // Buscamos específicamente el encabezado principal
    // El texto está dividido en dos h1, buscamos el primero
    await expect(page.getByRole('heading', { name: 'EL SERRANO' })).toBeVisible();

    // Verificamos que el botón de entrar esté presente
    await expect(page.getByRole('button', { name: 'ENTRAR AL SISTEMA' })).toBeVisible();
});

test('Intento de login con credenciales invalidas muestra error', async ({ page }) => {
    await page.goto('/login');

    // Llenamos el formulario
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'claveincorrecta');

    // Click en entrar
    await page.click('button[type="submit"]');

    // Esperamos que aparezca cualquier alerta o badge de error
    const errorBadge = page.locator('.badge-danger');
    await expect(errorBadge).toBeVisible({ timeout: 10000 });
});
