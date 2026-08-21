import { Request, Response } from 'express';
import { z } from 'zod';
import { CampaignService } from '../services/campaign.service';

const createCampaignSchema = z.object({
  recipients: z
    .array(z.string().email('Each recipient must be a valid email address'))
    .min(1, 'recipients must be a non-empty array with at least one email address'),
  subject: z.string().trim().min(1, 'subject must not be empty'),
  body: z.string().trim().min(1, 'body must not be empty'),
  sender: z.string().trim().min(1, 'sender must not be empty'),
  startTime: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'startTime must be a valid ISO-8601 date string (e.g. 2026-08-21T23:00:00.000Z)',
    })
    .transform((val) => new Date(val)),
  delaySeconds: z
    .number({ invalid_type_error: 'delaySeconds must be a number' })
    .min(0, 'delaySeconds must be a non-negative number (>= 0)'),
  hourlyLimit: z
    .number({ invalid_type_error: 'hourlyLimit must be a number' })
    .int('hourlyLimit must be an integer')
    .positive('hourlyLimit must be a positive integer (> 0)'),
});

export class CampaignController {
  public static async createCampaign(req: Request, res: Response) {
    try {
      const validationResult = createCampaignSchema.safeParse(req.body);

      if (!validationResult.success) {
        const formattedErrors = validationResult.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: formattedErrors,
        });
      }

      const campaign = await CampaignService.createCampaign(validationResult.data);

      return res.status(201).json({
        status: 'success',
        message: 'Campaign created and emails scheduled successfully',
        data: campaign,
      });
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error while creating campaign',
        error: error.message,
      });
    }
  }

  public static async getCampaigns(req: Request, res: Response) {
    try {
      const campaigns = await CampaignService.getAllCampaigns();

      return res.status(200).json({
        status: 'success',
        data: campaigns,
      });
    } catch (error: any) {
      console.error('Error fetching campaigns:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error while fetching campaigns',
        error: error.message,
      });
    }
  }

  public static async getCampaignById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({
          status: 'error',
          message: 'Valid campaign ID parameter is required',
        });
      }

      const campaign = await CampaignService.getCampaignById(id);

      if (!campaign) {
        return res.status(404).json({
          status: 'error',
          message: `Campaign with ID '${id}' not found`,
        });
      }

      return res.status(200).json({
        status: 'success',
        data: campaign,
      });
    } catch (error: any) {
      console.error('Error fetching campaign by ID:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error while fetching campaign',
        error: error.message,
      });
    }
  }
}
