import { APIRequestContext, request } from '@playwright/test';
import { OAuthConfig, TokenResponse, CachedToken } from './types';
import { generateCodeVerifier, generateCodeChallenge } from './pkce';
import { TokenCache } from './tokenCache';
import { Logger } from './logger';

export class OAuthClient {
  private ctxPromise: Promise<APIRequestContext>;
  private cache: TokenCache;
  private log: Logger;

  constructor(
    private config: OAuthConfig,
    opts?: {
      context?: APIRequestContext;
      cache?: TokenCache;
      logger?: Logger;
    }
  ) {
    this.ctxPromise = opts?.context
      ? Promise.resolve(opts.context)
      : request.newContext();

    this.cache = opts?.cache ?? new TokenCache();
    this.log = opts?.logger ?? new Logger();
  }

  private tokenUrl() {
    return `${this.config.baseUrl}${this.config.tokenEndpoint ?? '/oauth2/v4/token'}`;
  }

  private authUrl() {
    return `${this.config.baseUrl}${this.config.authEndpoint ?? '/o/oauth2/v2/auth'}`;
  }

  private cacheKey() {
    return `${this.config.clientId}:${this.config.scope ?? 'default'}`;
  }

  private nowSec() {
    return Math.floor(Date.now() / 1000);
  }

  private isExpired(token: CachedToken) {
    const skew = this.config.refreshSkewSec ?? 60;
    return token.expires_at - skew <= this.nowSec();
  }

  /**
   * PUBLIC: Get a valid access token (cached or refreshed or newly obtained via PKCE)
   */
  async getAccessToken(): Promise<string> {
    const key = this.cacheKey();
    const cached = this.cache.get(key);

    if (cached && !this.isExpired(cached)) {
      this.log.debug('token_cache_hit', { key });
      return cached.access_token;
    }

    if (cached?.refresh_token) {
      this.log.info('refreshing_token', { key });
      const refreshed = await this.refreshToken(cached.refresh_token);
      this.cache.set(key, refreshed);
      return refreshed.access_token;
    }

    this.log.info('starting_pkce_flow', { key });
    const fresh = await this.pkceFlow();
    this.cache.set(key, fresh);
    return fresh.access_token;
  }

  /**
   * PKCE Flow:
   * 1) build authorize URL with code_challenge
   * 2) simulate redirect to capture `code`
   * 3) exchange code + verifier for tokens
   */
  private async pkceFlow(): Promise<CachedToken> {
    const ctx = await this.ctxPromise;

    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);

    const authUrl = `${this.authUrl()}?response_type=code&client_id=${this.config.clientId}&redirect_uri=${encodeURIComponent(
      this.config.redirectUri
    )}&code_challenge=${codeChallenge}&code_challenge_method=S256${
      this.config.scope ? `&scope=${encodeURIComponent(this.config.scope)}` : ''
    }`;

    // Simulate browser redirect (Playwright API can follow redirects)
    const res = await ctx.get(authUrl, { maxRedirects: 0 }).catch(e => e);
    const location = res?.headers?.()['location'] ?? res?.headers?.location;

    if (!location) {
      this.log.error('auth_redirect_missing');
      throw new Error('Authorization redirect missing');
    }

    const url = new URL(location);
    const code = url.searchParams.get('code');

    if (!code) {
      this.log.error('auth_code_missing', { location });
      throw new Error('Authorization code not found');
    }

    return this.exchangeCodeForToken(code, codeVerifier);
  }

  private async exchangeCodeForToken(
    code: string,
    codeVerifier: string
  ): Promise<CachedToken> {
    const ctx = await this.ctxPromise;

    const response = await ctx.post(this.tokenUrl(), {
      form: {
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.config.redirectUri,
        client_id: this.config.clientId,
        code_verifier: codeVerifier,
      },
    });

    if (!response.ok()) {
      const body = await response.text();
      this.log.error('token_exchange_failed', {
        status: response.status(),
        body,
      });
      throw new Error(`Token exchange failed: ${response.status()}`);
    }

    const json = (await response.json()) as TokenResponse;

    const token: CachedToken = {
      ...json,
      expires_at: this.nowSec() + json.expires_in,
    };

    this.log.info('token_acquired', { expires_in: json.expires_in });
    return token;
  }

  private async refreshToken(refreshToken: string): Promise<CachedToken> {
    const ctx = await this.ctxPromise;

    const response = await ctx.post(this.tokenUrl(), {
      form: {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.config.clientId,
      },
    });

    if (!response.ok()) {
      this.log.warn('refresh_failed_fallback_to_pkce', {
        status: response.status(),
      });
      return this.pkceFlow();
    }

    const json = (await response.json()) as TokenResponse;

    const token: CachedToken = {
      ...json,
      expires_at: this.nowSec() + json.expires_in,
    };

    this.log.info('token_refreshed', { expires_in: json.expires_in });
    return token;
  }
}