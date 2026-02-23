import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    timeout: 60 * 1000, // <--- Aumentamos timeout global a 60 segundos

    use: {
        baseURL: 'http://localhost:5173',
        trace: 'on-first-retry',
        actionTimeout: 10000, // Timeout explícito para acciones como click()
        navigationTimeout: 30000, // Timeout específico para navegación
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:5173',
        reuseExistingServer: true, // <--- Forzamos true para que use tu servidor actual
        timeout: 120 * 1000, // <--- Damos 2 minutos al servidor para arrancar si es necesario
        stdout: 'pipe',
    },
});