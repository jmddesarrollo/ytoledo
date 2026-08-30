import SecurityLogger from '../utils/securityLogger';

interface RateLimitRecord {
    count: number;
    windowStart: number;
}

interface RateLimitConfig {
    maxEvents: number;
    windowMs: number;
}

export default class RateLimiter {
    private records: Map<string, RateLimitRecord> = new Map<string, RateLimitRecord>();

    private generalLimit: RateLimitConfig;
    private loginLimit: RateLimitConfig;

    constructor() {
        this.generalLimit = {
            maxEvents: this.getPositiveIntEnv('APP_RATE_LIMIT_MAX_EVENTS', 100),
            windowMs: this.getPositiveIntEnv('APP_RATE_LIMIT_WINDOW_MS', 60000),
        };
        this.loginLimit = {
            maxEvents: this.getPositiveIntEnv('APP_RATE_LIMIT_LOGIN_MAX', 5),
            windowMs: this.getPositiveIntEnv('APP_RATE_LIMIT_LOGIN_WINDOW_MS', 60000),
        };
    }

    public checkLimit(socketId: string, eventName: string): boolean {
        const key = this.getRecordKey(socketId, eventName);
        const limit = this.getLimit(eventName);
        const now = Date.now();
        const record = this.records.get(key);

        if (!record || now - record.windowStart >= limit.windowMs) {
            this.records.set(key, { count: 1, windowStart: now });
            return true;
        }

        record.count += 1;
        this.records.set(key, record);

        return record.count <= limit.maxEvents;
    }

    public middleware = (socket: any, next: (err?: Error) => void): void => {
        const originalOnevent = socket.onevent;

        socket.onevent = (packet: any): void => {
            const eventName = packet && packet.data && packet.data[0] ? packet.data[0] : 'unknown';

            if (!this.checkLimit(socket.id, eventName)) {
                const ip = socket.handshake && socket.handshake.address ? socket.handshake.address : 'unknown';
                socket.emit('error_message', {
                    message: 'Demasiadas solicitudes. Inténtelo de nuevo más tarde.',
                    code: 429,
                });
                SecurityLogger.logRateLimitExceeded(ip, eventName);
                socket.disconnect(true);
                return;
            }

            originalOnevent.call(socket, packet);
        };

        // Limpiar las entradas del socket al desconectar para evitar memory leak
        socket.on('disconnect', () => {
            this.clearSocket(socket.id);
        });

        next();
    };

    /**
     * Elimina todas las entradas de rate limiting asociadas a un socket desconectado.
     */
    public clearSocket(socketId: string): void {
        // Usamos Array.from para compatibilidad con target ES5
        Array.from(this.records.keys()).forEach(key => {
            if (key.startsWith(socketId + ':')) {
                this.records.delete(key);
            }
        });
    }

    private getLimit(eventName: string): RateLimitConfig {
        return eventName === 'auth/login' ? this.loginLimit : this.generalLimit;
    }

    private getRecordKey(socketId: string, eventName: string): string {
        return socketId + ':' + eventName;
    }

    private getPositiveIntEnv(name: string, defaultValue: number): number {
        const value = Number(process.env[name]);
        return Number.isInteger(value) && value > 0 ? value : defaultValue;
    }
}
