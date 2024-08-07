import type { PlayerListener } from './types';
export default class EventEmitter {
    events: Record<string, PlayerListener[]>;
    on(name: string, callback: PlayerListener): void;
    onAny(names: string[], callback: PlayerListener): void;
    once(name: string, callback: PlayerListener): void;
    off(name: string, callback: PlayerListener): void;
    offAny(name: string): void;
    offAll(): void;
    emit(name: string, payload?: any): void;
}
//# sourceMappingURL=event.d.ts.map