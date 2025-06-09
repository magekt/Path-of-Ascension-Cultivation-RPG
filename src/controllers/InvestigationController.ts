import { Router, Request, Response } from 'express';
import { InvestigationService } from '../services/InvestigationService';
import { WebSocketService } from '../services/WebSocketService';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

export class InvestigationController {
    private router: Router;
    private investigationService: InvestigationService;

    constructor(webSocketService: WebSocketService) {
        this.router = Router();
        this.investigationService = new InvestigationService(webSocketService);
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.post('/', this.createInvestigation);
        this.router.patch('/:id/progress', this.updateProgress);
        this.router.get('/:id/leads', this.getActiveLeads);
    }

    private createInvestigation = async (req: AuthRequest, res: Response) => {
        try {
            const id = await this.investigationService.createInvestigation({
                ...req.body,
                createdBy: req.user?.id
            });
            res.status(201).json({ id });
        } catch (error) {
            logger.error('Create investigation error', { error });
            res.status(400).json({ error: error.message });
        }
    };

    private updateProgress = async (req: AuthRequest, res: Response) => {
        try {
            await this.investigationService.updateProgress(
                req.params.id,
                req.body.subObjectiveId,
                req.body.progress,
                req.body.character
            );
            res.status(204).send();
        } catch (error) {
            logger.error('Update progress error', { error });
            res.status(400).json({ error: error.message });
        }
    };

    private getActiveLeads = async (req: Request, res: Response) => {
        try {
            const leads = await this.investigationService.getActiveLeads(
                req.params.id
            );
            res.json({ leads });
        } catch (error) {
            logger.error('Get active leads error', { error });
            res.status(404).json({ error: error.message });
        }
    };

    public getRouter(): Router {
        return this.router;
    }
}
