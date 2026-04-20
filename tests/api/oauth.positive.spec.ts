import { test, expect } from '@playwright/test';
import { OAuthClient } from '../../utils/oauthClient';
import { TokenValidator } from '../../utils/tokenValidator';


test.describe('OAuth Positive Flow', () => {
    const client = new OAuthClient();

    test('Should exchange auth code for token', async () => {
        const fakeAuthCode = 'valid_code';  // mock server accepts flexible value

        const response = await client.getToken(fakeAuthCode);
        expect(response.status()).toBe(200);

        const body = await response.json();

        TokenValidator.validateStructure(body);
        TokenValidator.validateJWT(body.access_token);
    });
});