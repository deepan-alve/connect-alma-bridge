import express, { Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import * as profileService from '../services/profileService';
import * as skillService from '../services/skillService';
import multer from 'multer';
import { parseResumeFromPDF } from '../utils/resumeParser';

const router = express.Router();

// Extend AuthRequest to include file property for multer
interface AuthRequestWithFile extends AuthRequest {
  file?: Express.Multer.File;
}

// Configure multer for file upload (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req: any, file: any, cb: any) => {
    // Accept PDF and DOCX files only
    if (
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are allowed'));
    }
  },
});

// ============================================
// Work Experience Routes
// ============================================

// Create new work experience
router.post('/experiences', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id; // UUID string, don't parse
    const experience = await profileService.createExperience(userId, req.body);
    res.status(201).json({ data: experience });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's work experiences
router.get('/:userId/experiences', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.userId; // UUID string
    const experiences = await profileService.getUserExperiences(userId);
    res.json({ data: experiences });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Update work experience
router.put('/experiences/:experienceId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id; // UUID string
    const experienceId = parseInt(req.params.experienceId);
    const experience = await profileService.updateExperience(experienceId, userId, req.body);
    res.json({ data: experience });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Delete work experience
router.delete('/experiences/:experienceId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id; // UUID string
    const experienceId = parseInt(req.params.experienceId);
    await profileService.deleteExperience(experienceId, userId);
    res.json({ message: 'Experience deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// Education Routes
// ============================================

// Create new education record
router.post('/education', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id; // UUID string
    const education = await profileService.createEducation(userId, req.body);
    res.status(201).json({ data: education });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's education history
router.get('/:userId/education', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.userId; // UUID string
    const education = await profileService.getUserEducation(userId);
    res.json({ data: education });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Update education record
router.put('/education/:educationId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id; // UUID string
    const educationId = parseInt(req.params.educationId);
    const education = await profileService.updateEducation(educationId, userId, req.body);
    res.json({ data: education });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Delete education record
router.delete('/education/:educationId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id; // UUID string
    const educationId = parseInt(req.params.educationId);
    await profileService.deleteEducation(educationId, userId);
    res.json({ message: 'Education record deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// Certifications Routes
// ============================================

// Create new certification
router.post('/certifications', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id; // UUID string
    const certification = await profileService.createCertification(userId, req.body);
    res.status(201).json({ data: certification });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's certifications
router.get('/:userId/certifications', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.userId; // UUID string
    const certifications = await profileService.getUserCertifications(userId);
    res.json({ data: certifications });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Update certification
router.put('/certifications/:certId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id; // UUID string
    const certId = parseInt(req.params.certId);
    const certification = await profileService.updateCertification(certId, userId, req.body);
    res.json({ data: certification });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Delete certification
router.delete('/certifications/:certId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id; // UUID string
    const certId = parseInt(req.params.certId);
    await profileService.deleteCertification(certId, userId);
    res.json({ message: 'Certification deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// Public Profile Route
// ============================================

// Get public profile (viewable by anyone)
router.get('/:userId/public', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.userId; // UUID string
    const profile = await profileService.getPublicProfile(userId);
    res.json({ data: profile });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// Resume Upload Routes
// ============================================

// Upload resume file
router.post('/resume/upload', authenticate, upload.single('resume'), async (req: AuthRequestWithFile, res: Response) => {
  try {
    const userId = req.user!.id; // UUID string
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const result = await profileService.uploadResume(userId, req.file);
    return res.json({ 
      message: 'Resume uploaded successfully',
      data: result 
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
});

// Get resume URL
router.get('/resume/url', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id; // UUID string
    const url = await profileService.getResumeUrl(userId);
    res.json({ data: { resume_url: url } });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Parse resume PDF and extract structured data
router.post('/resume/parse', authenticate, upload.single('resume'), async (req: AuthRequestWithFile, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No resume file uploaded' });
    }

    // Parse the PDF buffer
    const parsedData = await parseResumeFromPDF(req.file.buffer);

    return res.json({
      message: 'Resume parsed successfully',
      data: parsedData
    });
  } catch (error: any) {
    console.error('Resume parsing error:', error);
    return res.status(500).json({ 
      message: 'Failed to parse resume',
      details: error.message 
    });
  }
});

// Get resume download URL
router.get('/:userId/resume/download', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.userId;
    const resumeUrl = await profileService.getResumeUrl(userId);
    
    if (!resumeUrl) {
      return res.status(404).json({ message: 'No resume found for this user' });
    }

    return res.json({
      message: 'Resume URL retrieved successfully',
      data: { resume_url: resumeUrl }
    });
  } catch (error: any) {
    console.error('Resume download error:', error);
    return res.status(500).json({ 
      message: 'Failed to get resume URL',
      details: error.message 
    });
  }
});

// Delete all education/experiences/certs/skills for current user (cleanup endpoint)
router.delete('/cleanup/all', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    
    await profileService.deleteAllExperiences(userId);
    await profileService.deleteAllEducation(userId);
    await profileService.deleteAllCertifications(userId);
    await skillService.removeAllUserSkills(userId);
    
    return res.json({
      message: 'All profile data deleted successfully',
      data: { success: true }
    });
  } catch (error: any) {
    console.error('Cleanup error:', error);
    return res.status(500).json({ 
      message: 'Failed to cleanup profile data',
      details: error.message 
    });
  }
});

export default router;
