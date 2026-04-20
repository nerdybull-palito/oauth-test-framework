import { CachedToken } from './types';

export class Token {
    private store = new Map<string, CachedToken>();

    get(key: string): CachedToken | undefined {
        return this.store.get(key);
    }

    set(key: string, token: CachedToken) {
        this.store.set(key, token);
    }

    clear(key?: string) {
        if (key) this.store.delete(key);
        else this.store.clear();
    }
}