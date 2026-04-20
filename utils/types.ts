export type OAuthConfig = {
    baseUrl: string;
    clientId: string;
    redirectUri: string;
    scope?: string;
    tokenEndpoint?: string;   // default: /oauth2/v4/token
    authEndpoint?: string;    // default: /o/oauth2/v2/auth
    refreshSkewSec?: number;  // default: 60 (refresh before expiry)
};

export type TokenResponse = {
    access_token: string;
    expires_in: string;
    token_type: 'Bearer';
    refresh_token?: string;
    id_token?: string;
    scope?: string;
};

export type CachedToken = TokenResponse & {
    expire_at: number;  //epoch seconds
}