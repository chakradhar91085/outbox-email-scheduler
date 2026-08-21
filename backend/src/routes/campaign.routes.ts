import { Router } from 'express';
import { CampaignController } from '../controllers/campaign.controller';

export const campaignRouter = Router();

// Campaign endpoints
campaignRouter.post('/', CampaignController.createCampaign);
campaignRouter.get('/', CampaignController.getCampaigns);
campaignRouter.get('/:id', CampaignController.getCampaignById);
