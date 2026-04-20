import crypto from 'crypto';


export function base64UrlEncode(buffer: Buffer) {
    return buffer
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

export function generateCodeVerifier(length = 64): string {
    return base64UrlEncode(crypto.randomBytes(length));
}

export function generateCodeChallenge(verifier: string): string {
    const hash = crypto.createHash('sha256').update(verifier).digest();
    return base64UrlEncode(hash);
}