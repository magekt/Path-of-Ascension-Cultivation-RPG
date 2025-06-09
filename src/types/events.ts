export type GameEventType = 
    | 'STATE_UPDATED'
    | 'TIME_ADVANCED'
    | 'CHARACTER_UPDATED'
    | 'INVESTIGATION_UPDATED';

export interface GameEvent {
    type: GameEventType;
    gameStateId: string;
    timestamp: string;
    data: any;
}

export interface WebSocketMessage {
    type: 'event' | 'command' | 'error';
    payload: any;
}
