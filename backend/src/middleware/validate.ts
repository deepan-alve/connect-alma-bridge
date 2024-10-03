// Request Validation Middleware
import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'Invalid request data',
          details: error.errors,
        });
      }
      next(error);
    }
  };
};

// Common validation schemas
export const schemas = {
  sendMessage: z.object({
    body: z.object({
      receiverId: z.string().uuid(),
      messageText: z.string().min(1).max(5000),
    }),
  }),

  sendConnectionRequest: z.object({
    body: z.object({
      // Accept either UUID string or numeric id (coerced to string in service)
      receiverId: z.union([z.string().uuid(), z.string(), z.number()]),
    }),
  }),

  createJob: z.object({
    body: z.object({
      title: z.string().min(3).max(200),
      description: z.string().optional(),
      location: z.string().optional(),
      apply_deadline: z.string().optional(), // Accept any date string format
    }),
  }),

  applyToJob: z.object({
    params: z.object({
      jobId: z.string().regex(/^\d+$/),
    }),
    body: z.object({
      resumeLink: z.string().url().optional(),
    }),
  }),

  updateApplicationStatus: z.object({
    params: z.object({
      applicationId: z.string().regex(/^\d+$/),
    }),
    body: z.object({
      status: z.enum(['Submitted', 'Reviewed', 'Interview', 'Accepted', 'Rejected']),
    }),
  }),
};
