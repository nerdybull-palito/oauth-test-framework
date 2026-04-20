import { test, expect } from '@playwright/test';
import { OAuthClient } from '../../utils/oauthClient';


test.describe('OAuth Negitive Scenarios', () => {
    const client = new OAuthClient();

    test('Invaild grant type should fail', async () => {
        const response = await client.getInvalidToken();

        expect(response.status()).toBeGreaterThanOrEqual(400);

        const body = await response.json();
        expect(body).toHaveProperty('error');
    });

    test('Missing parameters should fail', async ({ request }) => {
        const response = await request.post(
            'https://oauth.Kogiqa.com/oauth2/v4/token',
            { form: {} }
        );
        expect(response.status()).toBe(400);
    });

    test('Invalid auth code should fail', async () => {
        const client = new OAuthClient();

        const response = await client.getToken('bad-code');
        expect(response.status()).not.toBe(200);
    });
});