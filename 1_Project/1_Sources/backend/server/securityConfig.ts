export function validateAppSeed(seed: string | undefined, environment: string | undefined): void {
    const isProduction = environment === 'production';
    const hasStrongLength = !!seed && seed.length >= 32;
    const hasRequiredCharacters = !!seed && /(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9])/.test(seed);

    if (!seed) {
        const message = 'APP_SEED/YTO_SEED no está configurada';
        if (isProduction) {
            throw new Error(message);
        }
        console.warn(message);
        return;
    }

    if (!hasStrongLength) {
        const message = 'APP_SEED/YTO_SEED debe tener al menos 32 caracteres';
        if (isProduction) {
            throw new Error(message + ' en producción');
        }
        console.warn(message);
    }

    if (!hasRequiredCharacters) {
        const message = 'APP_SEED/YTO_SEED debe contener letras, números y caracteres especiales';
        if (isProduction) {
            throw new Error(message + ' en producción');
        }
        console.warn(message);
    }
}

export function getAllowedCorsOrigins(rawOrigins: string | undefined, environment: string | undefined): string[] {
    const isProduction = environment === 'production';

    if (rawOrigins) {
        return rawOrigins
            .split(',')
            .map(origin => origin.trim())
            .filter(origin => origin.length > 0);
    }

    if (isProduction) {
        throw new Error('APP_CORS_ORIGINS/YTO_CORS_ORIGINS no está configurada en producción');
    }

    return ['http://localhost:4200'];
}
