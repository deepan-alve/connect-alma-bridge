// Recommendations API Routes
import express, { Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { z } from 'zod';
import * as recommendationService from '../services/recommendationService';

const router = express.Router();

// Validation schemas
const requestRecommendationSchema = z.object({
  recommender_id: z.string().uuid(),
  message: z.string().optional()
});

const writeRecommendationSchema = z.object({
  recommended_id: z.string().uuid(),
  text: z.string().min(10, 'Recommendation must be at least 10 characters'),
  request_id: z.number().int().positive().optional()
});

const updateStatusSchema = z.object({
  status: z.enum(['approved', 'rejected'])
});

// POST /api/recommendations/request - Request a recommendation
router.post(
  '/request',
  authenticate,
  validate(requestRecommendationSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { recommender_id, message } = req.body;
      const request = await recommendationService.requestRecommendation(
        req.user!.id,
        recommender_id,
        message
      );
      res.status(201).json(request);
    } catch (error: any) {
      if (error.message.includes('Cannot request') || error.message.includes('already have')) {
        res.status(400).json({ error: 'BadRequest', message: error.message });
      } else {
        res.status(500).json({ error: 'InternalServerError', message: error.message });
      }
    }
  }
);

// POST /api/recommendations - Write a recommendation
router.post(
  '/',
  authenticate,
  validate(writeRecommendationSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { recommended_id, text, request_id } = req.body;
      const recommendation = await recommendationService.writeRecommendation(
        req.user!.id,
        recommended_id,
        text,
        request_id
      );
      res.status(201).json(recommendation);
    } catch (error: any) {
      res.status(500).json({ error: 'InternalServerError', message: error.message });
    }
  }
);

// GET /api/recommendations/user/:userId - Get user's approved recommendations
router.get('/user/:userId', async (req, res: Response) => {
  try {
    const { userId } = req.params;
    const recommendations = await recommendationService.getUserRecommendations(userId);
    res.json(recommendations);
  } catch (error: any) {
    res.status(500).json({ error: 'InternalServerError', message: error.message });
  }
});

// GET /api/recommendations/requests - Get pending recommendation requests (for current user)
router.get('/requests', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const requests = await recommendationService.getPendingRecommendationRequests(req.user!.id);
    res.json(requests);
  } catch (error: any) {
    res.status(500).json({ error: 'InternalServerError', message: error.message });
  }
});

// GET /api/recommendations/pending - Get pending recommendations to approve (for current user)
router.get('/pending', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const recommendations = await recommendationService.getPendingRecommendations(req.user!.id);
    res.json(recommendations);
  } catch (error: any) {
    res.status(500).json({ error: 'InternalServerError', message: error.message });
  }
});

// PATCH /api/recommendations/:recommendationId - Approve/reject a recommendation
router.patch(
  '/:recommendationId',
  authenticate,
  validate(updateStatusSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const recommendationId = parseInt(req.params.recommendationId);
      if (isNaN(recommendationId)) {
        res.status(400).json({ error: 'BadRequest', message: 'Invalid recommendation ID' });
        return;
      }
      
      const { status } = req.body;
      const recommendation = await recommendationService.updateRecommendationStatus(
        recommendationId,
        req.user!.id,
        status
      );
      res.json(recommendation);
    } catch (error: any) {
      if (error.message.includes('not found') || error.message.includes('only approve')) {
        res.status(403).json({ error: 'Forbidden', message: error.message });
      } else {
        res.status(500).json({ error: 'InternalServerError', message: error.message });
      }
    }
  }
);

export default router;
