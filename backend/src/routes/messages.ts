// Message Routes
import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate, schemas } from '../middleware/validate';
import { messageService } from '../services/messageService';

const router = Router();

// Get all conversations
router.get('/conversations', authenticate, async (req: AuthRequest, res) => {
  try {
    const conversations = await messageService.getConversations(req.user!.id);
    res.json({ data: conversations });
  } catch (error: any) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'InternalServerError', message: error.message });
  }
});

// Get messages with a specific user
router.get('/:partnerId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { partnerId } = req.params;
    const messages = await messageService.getMessages(req.user!.id, partnerId);
    res.json({ data: messages });
  } catch (error: any) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'InternalServerError', message: error.message });
  }
});

// Send a message
router.post(
  '/',
  authenticate,
  validate(schemas.sendMessage),
  async (req: AuthRequest, res) => {
    try {
      const { receiverId, messageText } = req.body;
      const message = await messageService.sendMessage(
        req.user!.id,
        receiverId,
        messageText
      );
      res.status(201).json({ data: message });
    } catch (error: any) {
      console.error('Send message error:', error);
      if (error.message.includes('connected')) {
        return res.status(403).json({ error: 'Forbidden', message: error.message });
      }
      res.status(500).json({ error: 'InternalServerError', message: error.message });
    }
  }
);

export default router;
