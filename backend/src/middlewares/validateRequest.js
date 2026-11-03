import { ZodError } from 'zod';

export const validateRequest = (schema) => {
  return async (req, res, next) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Dữ liệu đầu vào không hợp lệ',
            issues: error.errors
          }
        });
      }
      next(error);
    }
  };
};
