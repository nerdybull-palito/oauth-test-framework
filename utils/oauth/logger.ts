type LogLevel = 'info' | 'warn' | 'error' | 'debug';


export class Logger {
    constructor(private service: string = 'oauth-client') {}

    log(level: LogLevel, message:string, meta: Record<string, any> ={}) {
        const entry = {
            ts: new Date().toISOString(),
            level,
            service: this.service,
            message,
            ...this.redact(meta),
        };
        console.log(JSON.stringify(entry));
    }

    info(msg: string, meta?: any) { this.log('info',msg,meta);}
    warn(msg: string, meta?: any) { this.log('warn',msg,meta);}
    error(msg: string, meta?: any) { this.log('error',msg,meta);}
    debug(msg: string, meta?: any) { this.log('debug',msg,meta);}


    // never log token/secret
    private redact(meta: Record<string, any>) {
        const clone = { ...meta };
        if (clone.access_token) clone.access_token = '[REDACTED]';
        if (clone.refresh_token) clone.refresh_token = '[REDACTED]';
        if (clone.code_verifier) clone.code_verifier = '[REDACTED]';
        return clone;
    }
}