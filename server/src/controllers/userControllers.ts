import { Request, Response, NextFunction } from 'express';
import { supabase } from '../configs/dbConfig';
import { User } from '../types/users';

/**
 * GET /api/users
 * Returns all users (admin/dev only; adjust RLS accordingly in production)
 */
export const getAllUsers = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data, error } = await supabase.from('users').select('*');

    if (error) {
      res.status(500).json({ message: error.message });
      return;
    }

    res.status(200).json(data as User[]);
  } catch (err) {
    next(err);
  }
};
