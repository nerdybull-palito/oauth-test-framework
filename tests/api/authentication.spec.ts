import { test, expect } from '@playwright/test';


test('call protected endpoint', async ({ request, accessToken }) => {
  const res = await request.get('/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  expect(res.status()).toBe(200);
});