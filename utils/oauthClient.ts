import { request } from '@playwright/test';
import { config } from '../config/env';


export class OAuthClient {
    async getToken(authCode: string) {
        const context = await request.newContext();

        const response = await context.post(`${config.baseUrl}/oauth2/v4/token`, {
            form: {
                grant_type: 'authorization_code',
                code: authCode,
                redirect_uri: config.redirectUrl,
                client_id: config.clientId,
            },
        });
        return response;
    }

    async getInvalidToken() {
        const context = await request.newContext();

        return context.post(`${config.baseUrl}/oauth2/v4/token`, {
            form: {
                grant_type: 'invalid_grant',
                client_id: 'wrong-client',
            },
        });
    }
}