import WebSocket from 'ws';
import { Server } from 'http';
import { GameEvent, WebSocketMessage } from '../types/events';
import { logger } from '../utils/logger';

export class WebSocketService {
    private wss: WebSocket.Server;
    private clients: Map<string, Set<WebSocket>>;

    constructor(server: Server) {
        this.wss = new WebSocket.Server({ server });
        this.clients = new Map();
        this.setupWebSocket();
    }

    private setupWebSocket(): void {
        this.wss.on('connection', (ws: WebSocket, req: Request) => {
            const gameStateId = this.getGameStateIdFromRequest(req);
            if (!gameStateId) {
                this.sendError(ws, 'No game state ID provided');
                ws.close();
                return;
            }

            this.addClient(gameStateId, ws);

            ws.on('message', (message: string) => {
                try {
                    const parsed = JSON.parse(message) as WebSocketMessage;
                    this.handleMessage(gameStateId, ws, parsed);
                } catch (error) {
                    this.sendError(ws, 'Invalid message format');
                }
            });

            ws.on('close', () => {
                this.removeClient(gameStateId, ws);
            });
        });
    }

    private getGameStateIdFromRequest(req: Request): string | null {
        const url = new URL(req.url!, `http://${req.headers.host}`);
        return url.searchParams.get('gameStateId');
    }

    private addClient(gameStateId: string, ws: WebSocket): void {
        if (!this.clients.has(gameStateId)) {
            this.clients.set(gameStateId, new Set());
        }
        this.clients.get(gameStateId)!.add(ws);
        
        logger.info('Client connected', { gameStateId });
    }

    private removeClient(gameStateId: string, ws: WebSocket): void {
        const gameClients = this.clients.get(gameStateId);
        if (gameClients) {
            gameClients.delete(ws);
            if (gameClients.size === 0) {
                this.clients.delete(gameStateId);
            }
        }
        
        logger.info('Client disconnected', { gameStateId });
    }

    private handleMessage(
        gameStateId: string,
        ws: WebSocket,
        message: WebSocketMessage
    ): void {
        switch (message.type) {
            case 'command':
                // Handle commands if needed
                break;
            default:
                this.sendError(ws, 'Unknown message type');
        }
    }

    public broadcastEvent(event: GameEvent): void {
        const clients = this.clients.get(event.gameStateId);
        if (!clients) return;

        const message: WebSocketMessage = {
            type: 'event',
            payload: event
        };

        const messageStr = JSON.stringify(message);
        clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(messageStr);
            }
        });

        logger.info('Broadcast event', {
            type: event.type,
            gameStateId: event.gameStateId,
            clientCount: clients.size
        });
    }

    private sendError(ws: WebSocket, message: string): void {
        const errorMessage: WebSocketMessage = {
            type: 'error',
            payload: { message }
        };
        ws.send(JSON.stringify(errorMessage));
    }
}
