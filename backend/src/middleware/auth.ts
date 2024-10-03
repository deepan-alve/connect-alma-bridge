// Authentication Middleware
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/supabase';
import { supabase } from '../lib/supabase';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role?: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '
    const user = await verifyToken(token);

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token',
      });
    }

    // Fetch user's role from the database
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('role')
      .eq('user_id', user.id)
      .single();

    req.user = {
      id: user.id,
      email: user.email || '',
      role: dbUser?.role || user.user_metadata?.role, // Use DB role, fallback to metadata
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication failed',
    });
  }
};

// Middleware to check if user is alumni
export const requireAlumni = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const role = req.user?.role?.toLowerCase();
  
  if (!role || (role !== 'alumni' && role !== 'alumnus')) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Only alumni can perform this action',
      debug: {
        receivedRole: req.user?.role,
        userId: req.user?.id,
        email: req.user?.email
      }
    });
  }
  next();
};

// Middleware to check if user is student
export const requireStudent = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const role = req.user?.role?.toLowerCase();
  
  if (!role || role !== 'student') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Only students can perform this action',
      debug: {
        receivedRole: req.user?.role,
        userId: req.user?.id,
        email: req.user?.email
      }
    });
  }
  next();
};
