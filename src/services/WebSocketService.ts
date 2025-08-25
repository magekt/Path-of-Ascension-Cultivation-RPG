import WebSocket from 'ws';
import { Server as HttpServer } from 'http';
import { IncomingMessage } from 'http';
import { GameEvent, WebSocketMessage } from '../types/events';
import { config } from '../config/config';
import { logger } from '../utils/logger';

export class WebSocketService {
    private wss: WebSocket.Server;
    private clients: Map<string, Set<WebSocket>>;
    private heartbeatInterval: NodeJS.Timeout;

    constructor(server: HttpServer) {
        this.wss = new WebSocket.Server({ 
            server,
            path: config.websocket.path,
            maxPayload: 1024 * 1024 // 1MB
        });
        this.clients = new Map();
        this.setupWebSocket();
        this.startHeartbeat();
    }

    private setupWebSocket(): void {
        this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
            const gameStateId = this.getGameStateIdFromRequest(req);
            if (!gameStateId) {
                this.sendError(ws, 'No game state ID provided');
                ws.close();
                return;
            }

            // Check connection limits
            if (this.getTotalConnections() >= config.websocket.maxConnections) {
                this.sendError(ws, 'Maximum connections reached');
                ws.close();
                return;
            }

            this.addClient(gameStateId, ws);
            
            // Set up ping/pong for connection health
            ws.isAlive = true;
            ws.on('pong', () => {
                ws.isAlive = true;
            });

            ws.on('message', (message: string) => {
                try {
                    const parsed = JSON.parse(message) as WebSocketMessage;
                    this.handleMessage(gameStateId, ws, parsed);
                } catch (error) {
                    logger.warn('Invalid WebSocket message:', { 
                        gameStateId, 
                        error: error.message 
                    });
                    this.sendError(ws, 'Invalid message format');
                }
            });

            ws.on('close', () => {
                this.removeClient(gameStateId, ws);
            });

            ws.on('error', (error) => {
                logger.error('WebSocket error:', { gameStateId, error: error.message });
                this.removeClient(gameStateId, ws);
            });

            // Send welcome message
            this.sendMessage(ws, {
                type: 'connection',
                payload: {
                    message: 'Connected successfully',
                    gameStateId,
                    timestamp: new Date().toISOString()
                }
            });
        });
    }

    private getGameStateIdFromRequest(req: IncomingMessage): string | null {
        if (!req.url) return null;
        const url = new URL(req.url, `http://${req.headers.host}`);
        return url.searchParams.get('gameStateId');
    }

    private addClient(gameStateId: string, ws: WebSocket): void {
        if (!this.clients.has(gameStateId)) {
            this.clients.set(gameStateId, new Set());
        }
        this.clients.get(gameStateId)!.add(ws);
        
        logger.info('Client connected', { 
            gameStateId, 
            totalConnections: this.getTotalConnections() 
        });
    }

    private removeClient(gameStateId: string, ws: WebSocket): void {
        const gameClients = this.clients.get(gameStateId);
        if (gameClients) {
            gameClients.delete(ws);
            if (gameClients.size === 0) {
                this.clients.delete(gameStateId);
            }
        }
        
        logger.info('Client disconnected', { 
            gameStateId, 
            totalConnections: this.getTotalConnections() 
        });
    }

    private startHeartbeat(): void {
        this.heartbeatInterval = setInterval(() => {
            this.wss.clients.forEach((ws: any) => {
                if (!ws.isAlive) {
                    logger.warn('Terminating inactive WebSocket connection');
                    return ws.terminate();
                }
                
                ws.isAlive = false;
                ws.ping();
            });
        }, config.websocket.heartbeatInterval);
    }

    private handleMessage(
        gameStateId: string,
        ws: WebSocket,
        message: WebSocketMessage
    ): void {
        switch (message.type) {
            case 'command':
                this.handleCommand(gameStateId, ws, message.payload);
                break;
            case 'ping':
                this.sendMessage(ws, { type: 'pong', payload: { timestamp: new Date().toISOString() } });
                break;
            default:
                logger.warn('Unknown WebSocket message type:', { type: message.type, gameStateId });
                this.sendError(ws, 'Unknown message type');
        }
    }

    private handleCommand(gameStateId: string, ws: WebSocket, payload: any): void {
        // Handle specific commands here
        logger.info('WebSocket command received:', { gameStateId, command: payload.command });
    }

    public broadcastEvent(event: GameEvent): void {
        const clients = this.clients.get(event.gameStateId);
        if (!clients) return;

        const message: WebSocketMessage = {
            type: 'event',
            payload: event
        };

        this.broadcastToClients(clients, message);

        logger.info('Broadcast event', {
            type: event.type,
            gameStateId: event.gameStateId,
            clientCount: clients.size
        });
    }

    private broadcastToClients(clients: Set<WebSocket>, message: WebSocketMessage): void {
        const messageStr = JSON.stringify(message);
        const deadClients: WebSocket[] = [];

        clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                try {
                    client.send(messageStr);
                } catch (error) {
                    logger.error('Failed to send message to client:', error);
                    deadClients.push(client);
                }
            } else {
                deadClients.push(client);
            }
        });

        // Clean up dead connections
        deadClients.forEach(client => {
            clients.delete(client);
        });
    }

    private sendMessage(ws: WebSocket, message: WebSocketMessage): void {
        if (ws.readyState === WebSocket.OPEN) {
            try {
                ws.send(JSON.stringify(message));
            } catch (error) {
                logger.error('Failed to send WebSocket message:', error);
            }
        }
    }

    private sendError(ws: WebSocket, message: string): void {
        const errorMessage: WebSocketMessage = {
            type: 'error',
            payload: { message }
        };
        this.sendMessage(ws, errorMessage);
    }

    public getConnectionCount(): number {
        return this.getTotalConnections();
    }

    private getTotalConnections(): number {
        let total = 0;
        this.clients.forEach(clients => {
            total += clients.size;
        });
        return total;
    }

    public close(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        this.wss.close();
        logger.info('WebSocket service closed');
    }
}