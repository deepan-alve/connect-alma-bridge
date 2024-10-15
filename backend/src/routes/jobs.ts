// Job Routes
import { Router } from 'express';
import { authenticate, requireAlumni, requireStudent, AuthRequest } from '../middleware/auth';
import { validate, schemas } from '../middleware/validate';
import { jobService } from '../services/jobService';

const router = Router();

// Get all jobs (public)
router.get('/', async (req, res) => {
  try {
    const { location, searchTerm } = req.query;
    const jobs = await jobService.getJobs({
      location: location as string,
      searchTerm: searchTerm as string,
    });
    res.json({ data: jobs });
  } catch (error: any) {
    console.error('Get jobs error:', error);
    res.status(500).json({ error: 'InternalServerError', message: error.message });
  }
});

// Get single job
router.get('/:jobId', async (req, res) => {
  try {
    const jobId = parseInt(req.params.jobId);
    const job = await jobService.getJob(jobId);
    res.json({ data: job });
  } catch (error: any) {
    console.error('Get job error:', error);
    res.status(500).json({ error: 'InternalServerError', message: error.message });
  }
});

// Create job (alumni only)
router.post(
  '/',
  authenticate,
  requireAlumni,
  validate(schemas.createJob),
  async (req: AuthRequest, res) => {
    try {
      const job = await jobService.createJob(req.user!.id, req.body);
      res.status(201).json({ data: job });
    } catch (error: any) {
      console.error('Create job error:', error);
      res.status(500).json({ error: 'InternalServerError', message: error.message });
    }
  }
);

// Apply to job (students only)
router.post(
  '/:jobId/apply',
  authenticate,
  requireStudent,
  validate(schemas.applyToJob),
  async (req: AuthRequest, res) => {
    try {
      const jobId = parseInt(req.params.jobId);
      const { resumeLink } = req.body;
      const application = await jobService.applyToJob(jobId, req.user!.id, resumeLink);
      res.status(201).json({ data: application });
    } catch (error: any) {
      console.error('Apply to job error:', error);
      if (error.message.includes('already applied') || error.message.includes('deadline')) {
        return res.status(400).json({ error: 'BadRequest', message: error.message });
      }
      res.status(500).json({ error: 'InternalServerError', message: error.message });
    }
  }
);

// Get applications for a job (job poster only)
router.get('/:jobId/applications', authenticate, async (req: AuthRequest, res) => {
  try {
    const jobId = parseInt(req.params.jobId);
    const applications = await jobService.getJobApplications(jobId, req.user!.id);
    res.json({ data: applications });
  } catch (error: any) {
    console.error('Get job applications error:', error);
    if (error.message.includes('permission')) {
      return res.status(403).json({ error: 'Forbidden', message: error.message });
    }
    res.status(500).json({ error: 'InternalServerError', message: error.message });
  }
});

// Get user's applications
router.get('/my/applications', authenticate, async (req: AuthRequest, res) => {
  try {
    const applications = await jobService.getUserApplications(req.user!.id);
    res.json({ data: applications });
  } catch (error: any) {
    console.error('Get user applications error:', error);
    res.status(500).json({ error: 'InternalServerError', message: error.message });
  }
});

// Update application status (job poster only)
router.patch(
  '/applications/:applicationId/status',
  authenticate,
  validate(schemas.updateApplicationStatus),
  async (req: AuthRequest, res) => {
    try {
      const applicationId = parseInt(req.params.applicationId);
      const { status } = req.body;
      const application = await jobService.updateApplicationStatus(
        applicationId,
        status,
        req.user!.id
      );
      res.json({ data: application });
    } catch (error: any) {
      console.error('Update application status error:', error);
      if (error.message.includes('permission')) {
        return res.status(403).json({ error: 'Forbidden', message: error.message });
      }
      res.status(500).json({ error: 'InternalServerError', message: error.message });
    }
  }
);

export default router;
