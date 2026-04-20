import { expect } from '@playwright/test'

export class TokenValidator {
    static validateStructure(tokenResponse: any) {
        expect(tokenResponse).toHaveProperty('access_token');
        expect(tokenResponse).toHaveProperty('token_type', 'Bearer');
        expect(tokenResponse).toHaveProperty('expires_in');
    }

    static validateJWT(token: string) {
        const parts = token.split('.');
        expect(parts.length).toBe(3);

        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        expect(payload).toHaveProperty('iss');
        expect(payload).toHaveProperty('exp');
    }
}