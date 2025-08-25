import request from 'supertest';
import { App } from '../../app';
import { GameStateModel } from '../../models/GameState';
import { CharacterModel } from '../../models/Character';

describe('GameState Integration Tests', () => {
    let app: App;
    let server: any;
    let authToken: string;

    beforeAll(async () => {
        app = new App();
        await app.start();
        server = app['server'];
        
        // Create test user and get auth token
        const authResponse = await request(server)
            .post('/api/auth/login')
            .send({
                username: 'testuser',
                password: 'testpassword123'
            });
        
        authToken = authResponse.body.token;
    });

    afterAll(async () => {
        await app.stop();
    });

    beforeEach(async () => {
        await GameStateModel.deleteMany({});
        await CharacterModel.deleteMany({});
    });

    describe('POST /api/game-states/games', () => {
        it('should create a new game state', async () => {
            const gameData = {
                timeMultiplier: 1,
                settings: {
                    difficultyLevel: 'Intermediate',
                    maxCharacters: 3
                }
            };

            const response = await request(server)
                .post('/api/game-states/games')
                .set('Authorization', `Bearer ${authToken}`)
                .send(gameData)
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('message', 'Game created successfully');
            expect(response.body).toHaveProperty('timestamp');

            // Verify game state was created in database
            const gameState = await GameStateModel.findOne({ id: response.body.id });
            expect(gameState).toBeTruthy();
            expect(gameState?.timeMultiplier).toBe(1);
        });

        it('should validate input data', async () => {
            const invalidData = {
                timeMultiplier: -1, // Invalid: negative multiplier
                settings: {
                    difficultyLevel: 'Invalid', // Invalid difficulty
                    maxCharacters: 10 // Invalid: too many characters
                }
            };

            const response = await request(server)
                .post('/api/game-states/games')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidData)
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        it('should require authentication', async () => {
            const gameData = {
                timeMultiplier: 1
            };

            await request(server)
                .post('/api/game-states/games')
                .send(gameData)
                .expect(401);
        });
    });

    describe('POST /api/game-states/games/:id/advance-time', () => {
        let gameStateId: string;

        beforeEach(async () => {
            // Create a test game state
            const createResponse = await request(server)
                .post('/api/game-states/games')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ timeMultiplier: 1 });
            
            gameStateId = createResponse.body.id;
        });

        it('should advance game time successfully', async () => {
            const response = await request(server)
                .post(`/api/game-states/games/${gameStateId}/advance-time`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ hours: 5 })
                .expect(200);

            expect(response.body).toHaveProperty('message', 'Time advanced successfully');
            expect(response.body).toHaveProperty('hours', 5);

            // Verify time was advanced in database
            const gameState = await GameStateModel.findOne({ id: gameStateId });
            expect(gameState).toBeTruthy();
            
            const initialTime = new Date(gameState!.createdAt);
            const currentTime = new Date(gameState!.currentTime);
            const hoursDiff = (currentTime.getTime() - initialTime.getTime()) / (1000 * 60 * 60);
            
            expect(Math.round(hoursDiff)).toBe(5);
        });

        it('should validate hours parameter', async () => {
            await request(server)
                .post(`/api/game-states/games/${gameStateId}/advance-time`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ hours: 25 }) // Invalid: too many hours
                .expect(400);

            await request(server)
                .post(`/api/game-states/games/${gameStateId}/advance-time`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ hours: -1 }) // Invalid: negative hours
                .expect(400);
        });

        it('should handle non-existent game state', async () => {
            const fakeId = '123e4567-e89b-12d3-a456-426614174000';
            
            await request(server)
                .post(`/api/game-states/games/${fakeId}/advance-time`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ hours: 5 })
                .expect(404);
        });
    });

    describe('GET /api/game-states/games/:id/state', () => {
        let gameStateId: string;

        beforeEach(async () => {
            const createResponse = await request(server)
                .post('/api/game-states/games')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ timeMultiplier: 1 });
            
            gameStateId = createResponse.body.id;
        });

        it('should retrieve game state successfully', async () => {
            const response = await request(server)
                .get(`/api/game-states/games/${gameStateId}/state`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('gameState');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body.gameState).toHaveProperty('id', gameStateId);
            expect(response.body.gameState).toHaveProperty('timeMultiplier', 1);
        });

        it('should handle non-existent game state', async () => {
            const fakeId = '123e4567-e89b-12d3-a456-426614174000';
            
            await request(server)
                .get(`/api/game-states/games/${fakeId}/state`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });
    });

    describe('GET /api/game-states/games/:id/health', () => {
        let gameStateId: string;

        beforeEach(async () => {
            const createResponse = await request(server)
                .post('/api/game-states/games')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ timeMultiplier: 1 });
            
            gameStateId = createResponse.body.id;
        });

        it('should retrieve game health status', async () => {
            const response = await request(server)
                .get(`/api/game-states/games/${gameStateId}/health`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('health');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body.health).toHaveProperty('status');
            expect(response.body.health).toHaveProperty('uptime');
            expect(response.body.health).toHaveProperty('characters');
        });
    });

    describe('Rate Limiting', () => {
        it('should enforce rate limits', async () => {
            const gameData = { timeMultiplier: 1 };

            // Make requests up to the limit
            for (let i = 0; i < 60; i++) {
                await request(server)
                    .post('/api/game-states/games')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(gameData);
            }

            // Next request should be rate limited
            await request(server)
                .post('/api/game-states/games')
                .set('Authorization', `Bearer ${authToken}`)
                .send(gameData)
                .expect(429);
        }, 30000); // Increase timeout for this test
    });
});