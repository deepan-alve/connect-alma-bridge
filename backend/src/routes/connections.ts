// Connection Routes
import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate, schemas } from '../middleware/validate';
import { connectionService } from '../services/connectionService';

const router = Router();

// Get user's connections
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { status } = req.query;
    const connections = await connectionService.getConnections(
      req.user!.id,
      status as string
    );
    res.json({ data: connections });
  } catch (error: any) {
    console.error('Get connections error:', error);
    res.status(500).json({ error: 'InternalServerError', message: error.message });
  }
});

// Get suggested connections
router.get('/suggestions', authenticate, async (req: AuthRequest, res) => {
  try {
    const suggestions = await connectionService.getSuggestedConnections(req.user!.id);
    res.json({ data: suggestions });
  } catch (error: any) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ error: 'InternalServerError', message: error.message });
  }
});

// Send connection request
router.post(
  '/request',
  authenticate,
  validate(schemas.sendConnectionRequest),
  async (req: AuthRequest, res) => {
    try {
      const { receiverId } = req.body;
      const connection = await connectionService.sendConnectionRequest(
        req.user!.id,
        receiverId
      );
      res.status(201).json({ data: connection });
    } catch (error: any) {
      console.error('Send connection request error:', error);
      if (error.message.includes('already') || error.message.includes('cannot')) {
        return res.status(400).json({ error: 'BadRequest', message: error.message });
      }
      res.status(500).json({ error: 'InternalServerError', message: error.message });
    }
  }
);

// Accept connection request
router.post('/accept/:connectionId', authenticate, async (req: AuthRequest, res) => {
  try {
    const connectionId = parseInt(req.params.connectionId);
    const connection = await connectionService.acceptConnectionRequest(
      connectionId,
      req.user!.id
    );
    res.json({ data: connection });
  } catch (error: any) {
    console.error('Accept connection error:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: 'NotFound', message: error.message });
    }
    res.status(500).json({ error: 'InternalServerError', message: error.message });
  }
});

// Reject connection request
router.post('/reject/:connectionId', authenticate, async (req: AuthRequest, res) => {
  try {
    const connectionId = parseInt(req.params.connectionId);
    const connection = await connectionService.rejectConnectionRequest(
      connectionId,
      req.user!.id
    );
    res.json({ data: connection });
  } catch (error: any) {
    console.error('Reject connection error:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: 'NotFound', message: error.message });
    }
    res.status(500).json({ error: 'InternalServerError', message: error.message });
  }
});

export default router;
