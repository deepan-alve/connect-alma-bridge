// Skills API Routes
import express, { Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { z } from 'zod';
import * as skillService from '../services/skillService';

const router = express.Router();

// Validation schemas
const addSkillSchema = z.object({
  skill_id: z.number().int().positive()
});

const addSkillByNameSchema = z.object({
  skill_name: z.string().min(1).max(255).trim()
});

const endorseSkillSchema = z.object({
  target_user_id: z.string().uuid(),
  skill_id: z.number().int().positive()
});

// GET /api/skills - Get all available skills
router.get('/', async (req, res: Response) => {
  try {
    const skills = await skillService.getAllSkills();
    res.json(skills);
  } catch (error: any) {
    res.status(500).json({ error: 'InternalServerError', message: error.message });
  }
});

// GET /api/skills/user/:userId - Get user's skills
router.get('/user/:userId', async (req, res: Response) => {
  try {
    const { userId } = req.params;
    const skills = await skillService.getUserSkills(userId);
    res.json(skills);
  } catch (error: any) {
    res.status(500).json({ error: 'InternalServerError', message: error.message });
  }
});

// POST /api/skills/user - Add skill to current user's profile
router.post(
  '/user',
  authenticate,
  validate(addSkillSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { skill_id } = req.body;
      const skill = await skillService.addUserSkill(req.user!.id, skill_id);
      res.status(201).json(skill);
    } catch (error: any) {
      if (error.message.includes('already added')) {
        res.status(400).json({ error: 'BadRequest', message: error.message });
      } else {
        res.status(500).json({ error: 'InternalServerError', message: error.message });
      }
    }
  }
);

// POST /api/skills/user/by-name - Add skill by name (creates if doesn't exist)
router.post(
  '/user/by-name',
  authenticate,
  validate(addSkillByNameSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { skill_name } = req.body;
      console.log('Adding skill by name:', skill_name);
      const skill = await skillService.addUserSkillByName(req.user!.id, skill_name);
      res.status(201).json(skill);
    } catch (error: any) {
      console.error('Error adding skill:', error.message);
      if (error.message.includes('already added')) {
        res.status(400).json({ error: 'BadRequest', message: error.message });
      } else {
        res.status(500).json({ error: 'InternalServerError', message: error.message });
      }
    }
  }
);

// DELETE /api/skills/user/:skillId - Remove skill from current user's profile
router.delete('/user/:skillId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const skillId = parseInt(req.params.skillId);
    if (isNaN(skillId)) {
      res.status(400).json({ error: 'BadRequest', message: 'Invalid skill ID' });
      return;
    }
    
    await skillService.removeUserSkill(req.user!.id, skillId);
    res.json({ success: true, message: 'Skill removed successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'InternalServerError', message: error.message });
  }
});

// POST /api/skills/endorse - Endorse another user's skill
router.post(
  '/endorse',
  authenticate,
  validate(endorseSkillSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { target_user_id, skill_id } = req.body;
      const result = await skillService.endorseSkill(
        req.user!.id,
        target_user_id,
        skill_id
      );
      res.status(201).json(result);
    } catch (error: any) {
      if (error.message.includes('Cannot endorse') || error.message.includes('already endorsed')) {
        res.status(400).json({ error: 'BadRequest', message: error.message });
      } else {
        res.status(500).json({ error: 'InternalServerError', message: error.message });
      }
    }
  }
);

// GET /api/skills/endorsers/:userId/:skillId - Get who endorsed a specific skill
router.get('/endorsers/:userId/:skillId', async (req, res: Response) => {
  try {
    const { userId } = req.params;
    const skillId = parseInt(req.params.skillId);
    
    if (isNaN(skillId)) {
      res.status(400).json({ error: 'BadRequest', message: 'Invalid skill ID' });
      return;
    }
    
    const endorsers = await skillService.getSkillEndorsers(userId, skillId);
    res.json(endorsers);
  } catch (error: any) {
    res.status(500).json({ error: 'InternalServerError', message: error.message });
  }
});

export default router;
