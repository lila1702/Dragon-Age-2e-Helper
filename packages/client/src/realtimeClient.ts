import type { CampaignEvent, SheetPatch } from "@dragon-age/domain";

export type RealtimeHandler = (event: CampaignEvent) => void;

export class RealtimeClient {
    private socket: WebSocket | null = null;
    private readonly handlers = new Set<RealtimeHandler>();
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private intentionalClose = false;

    constructor(
        private readonly getUrl: () => string | null,
        private readonly onConnectionChange?: (connected: boolean) => void
    ) {}

    connect(): void {
        this.intentionalClose = false;
        this.open();
    }

    disconnect(): void {
        this.intentionalClose = true;
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        this.socket?.close();
        this.socket = null;
        this.onConnectionChange?.(false);
    }

    subscribe(handler: RealtimeHandler): () => void {
        this.handlers.add(handler);
        return () => this.handlers.delete(handler);
    }

    sendPatch(patch: SheetPatch): void {
        this.send({ type: "sheet.patch", patch });
    }

    sendPresence(characterId: string, path: string | null, displayName: string): void {
        this.send({
            type: "sheet.presence",
            characterId,
            path,
            displayName,
        });
    }

    private send(payload: unknown): void {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
        this.socket.send(JSON.stringify(payload));
    }

    private open(): void {
        const url = this.getUrl();
        if (!url) return;

        const socket = new WebSocket(url);
        this.socket = socket;

        socket.onopen = () => {
            this.onConnectionChange?.(true);
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(String(event.data)) as CampaignEvent;
                for (const handler of this.handlers) {
                    handler(data);
                }
            } catch (error) {
                console.error("Falha ao processar evento em tempo real:", error);
            }
        };

        socket.onclose = () => {
            this.onConnectionChange?.(false);
            this.socket = null;
            if (!this.intentionalClose) {
                this.reconnectTimer = setTimeout(() => this.open(), 1500);
            }
        };

        socket.onerror = () => {
            socket.close();
        };
    }
}
