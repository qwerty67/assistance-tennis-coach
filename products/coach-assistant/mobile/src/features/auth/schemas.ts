import { z } from 'zod';
import { toLatinDigits } from '@/shared/utils/format';

const phone = z
  .string()
  .transform((v) => toLatinDigits(v).replace(/[\s-]/g, ''))
  .refine((v) => /^(\+98|0)?9\d{9}$/.test(v), 'validation.phone');

export const loginSchema = z.object({
  identifier: z.string().min(3, 'validation.required').transform((v) => toLatinDigits(v.trim())),
  password: z.string().min(1, 'validation.required'),
});

export const registerSchema = z.object({
  first_name: z.string().trim().min(1, 'validation.required'),
  last_name: z.string().trim().min(1, 'validation.required'),
  email: z.string().trim().email('validation.email'),
  phone,
  password: z.string().min(8, 'validation.min8').regex(/(?=.*\d)(?=.*[A-Za-z])/, 'validation.passwordRule'),
  role: z.enum(['coach', 'student']),
});

export type LoginForm = z.input<typeof loginSchema>;
export type RegisterForm = z.input<typeof registerSchema>;
