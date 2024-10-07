// User Routes - Directory and Profile Management
import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { userService } from '../services/userService';

const router = Router();

// Get all users (directory)
router.get('/directory', authenticate, async (req: AuthRequest, res) => {
  try {
    const { search, role, department, graduation_year } = req.query;
    
    const users = await userService.getAllUsers({
      search: search as string,
      role: role as string,
      department: department as string,
      graduationYear: graduation_year as string,
    });
    
    res.json({ data: users });
  } catch (error: any) {
    console.error('Get user directory error:', error);
    res.status(500).json({ error: 'InternalServerError', message: error.message });
  }
});

// Get user profile by ID
router.get('/:userId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    const profile = await userService.getUserProfile(userId);
    res.json({ data: profile });
  } catch (error: any) {
    console.error('Get user profile error:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: 'NotFound', message: 'User not found' });
    }
    return res.status(500).json({ error: 'InternalServerError', message: error.message });
  }
});

// Update own profile
router.patch('/profile', authenticate, async (req: AuthRequest, res) => {
  try {
    const updates = req.body;
    const updatedProfile = await userService.updateUserProfile(req.user!.id, updates);
    res.json({ data: updatedProfile });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'InternalServerError', message: error.message });
  }
});

// Get departments
router.get('/meta/departments', authenticate, async (_req: AuthRequest, res) => {
  try {
    const departments = await userService.getDepartments();
    res.json({ data: departments });
  } catch (error: any) {
    console.error('Get departments error:', error);
    res.status(500).json({ error: 'InternalServerError', message: error.message });
  }
});

// Get graduation years
router.get('/meta/graduation-years', authenticate, async (_req: AuthRequest, res) => {
  try {
    const years = await userService.getGraduationYears();
    res.json({ data: years });
  } catch (error: any) {
    console.error('Get graduation years error:', error);
    res.status(500).json({ error: 'InternalServerError', message: error.message });
  }
});

export default router;
