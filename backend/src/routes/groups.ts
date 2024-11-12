// Groups API Routes
import express, { Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { z } from 'zod';
import * as groupService from '../services/groupService';

const router = express.Router();

// Validation schemas
const createGroupSchema = z.object({
  name: z.string().min(3, 'Group name must be at least 3 characters').max(100),
  description: z.string().max(500).optional()
});

const updateGroupSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(500).optional()
});

const updateMemberRoleSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(['Admin', 'Member'])
});

// GET /api/groups - Get all groups (with optional search)
router.get('/', async (req, res: Response) => {
  try {
    const search = req.query.search as string | undefined;
    const groups = await groupService.getAllGroups(search);
    res.json(groups);
  } catch (error: any) {
    res.status(500).json({ error: 'InternalServerError', message: error.message });
  }
});

// GET /api/groups/my - Get current user's groups
router.get('/my', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const groups = await groupService.getUserGroups(req.user!.id);
    res.json(groups);
  } catch (error: any) {
    res.status(500).json({ error: 'InternalServerError', message: error.message });
  }
});

// GET /api/groups/:groupId - Get single group with members
router.get('/:groupId', async (req, res: Response) => {
  try {
    const groupId = parseInt(req.params.groupId);
    if (isNaN(groupId)) {
      res.status(400).json({ error: 'BadRequest', message: 'Invalid group ID' });
      return;
    }
    
    const group = await groupService.getGroup(groupId);
    res.json(group);
  } catch (error: any) {
    if (error.code === 'PGRST116') {
      res.status(404).json({ error: 'NotFound', message: 'Group not found' });
    } else {
      res.status(500).json({ error: 'InternalServerError', message: error.message });
    }
  }
});

// POST /api/groups - Create a new group
router.post(
  '/',
  authenticate,
  validate(createGroupSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { name, description } = req.body;
      const group = await groupService.createGroup(req.user!.id, name, description);
      res.status(201).json(group);
    } catch (error: any) {
      res.status(500).json({ error: 'InternalServerError', message: error.message });
    }
  }
);

// POST /api/groups/:groupId/join - Join a group
router.post('/:groupId/join', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const groupId = parseInt(req.params.groupId);
    if (isNaN(groupId)) {
      res.status(400).json({ error: 'BadRequest', message: 'Invalid group ID' });
      return;
    }
    
    const membership = await groupService.joinGroup(req.user!.id, groupId);
    res.status(201).json(membership);
  } catch (error: any) {
    if (error.message.includes('already a member')) {
      res.status(400).json({ error: 'BadRequest', message: error.message });
    } else {
      res.status(500).json({ error: 'InternalServerError', message: error.message });
    }
  }
});

// DELETE /api/groups/:groupId/leave - Leave a group
router.delete('/:groupId/leave', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const groupId = parseInt(req.params.groupId);
    if (isNaN(groupId)) {
      res.status(400).json({ error: 'BadRequest', message: 'Invalid group ID' });
      return;
    }
    
    await groupService.leaveGroup(req.user!.id, groupId);
    res.json({ success: true, message: 'Left group successfully' });
  } catch (error: any) {
    if (error.message.includes('cannot leave')) {
      res.status(400).json({ error: 'BadRequest', message: error.message });
    } else {
      res.status(500).json({ error: 'InternalServerError', message: error.message });
    }
  }
});

// PATCH /api/groups/:groupId - Update group (admin only)
router.patch(
  '/:groupId',
  authenticate,
  validate(updateGroupSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const groupId = parseInt(req.params.groupId);
      if (isNaN(groupId)) {
        res.status(400).json({ error: 'BadRequest', message: 'Invalid group ID' });
        return;
      }
      
      const updates = req.body;
      const group = await groupService.updateGroup(req.user!.id, groupId, updates);
      res.json(group);
    } catch (error: any) {
      if (error.message.includes('Only group admins')) {
        res.status(403).json({ error: 'Forbidden', message: error.message });
      } else {
        res.status(500).json({ error: 'InternalServerError', message: error.message });
      }
    }
  }
);

// DELETE /api/groups/:groupId - Delete group (creator only)
router.delete('/:groupId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const groupId = parseInt(req.params.groupId);
    if (isNaN(groupId)) {
      res.status(400).json({ error: 'BadRequest', message: 'Invalid group ID' });
      return;
    }
    
    await groupService.deleteGroup(req.user!.id, groupId);
    res.json({ success: true, message: 'Group deleted successfully' });
  } catch (error: any) {
    if (error.message.includes('not found') || error.message.includes('Only the group creator')) {
      res.status(403).json({ error: 'Forbidden', message: error.message });
    } else {
      res.status(500).json({ error: 'InternalServerError', message: error.message });
    }
  }
});

// PATCH /api/groups/:groupId/members - Update member role (admin only)
router.patch(
  '/:groupId/members',
  authenticate,
  validate(updateMemberRoleSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const groupId = parseInt(req.params.groupId);
      if (isNaN(groupId)) {
        res.status(400).json({ error: 'BadRequest', message: 'Invalid group ID' });
        return;
      }
      
      const { user_id, role } = req.body;
      const membership = await groupService.updateMemberRole(
        req.user!.id,
        groupId,
        user_id,
        role
      );
      res.json(membership);
    } catch (error: any) {
      if (error.message.includes('Only group admins')) {
        res.status(403).json({ error: 'Forbidden', message: error.message });
      } else {
        res.status(500).json({ error: 'InternalServerError', message: error.message });
      }
    }
  }
);

export default router;
