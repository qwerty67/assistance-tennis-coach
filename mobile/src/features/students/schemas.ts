import { z } from 'zod';
import { toLatinDigits } from '@/shared/utils/format';

const optionalPhone = z
  .string()
  .optional()
  .transform((v) => (v ? toLatinDigits(v).replace(/[\s-]/g, '') : undefined))
  .refine((v) => !v || /^(\+98|0)?9\d{9}$/.test(v), 'validation.phone');

export const studentSchema = z.object({
  first_name: z.string().trim().min(1, 'validation.required'),
  last_name: z.string().trim().min(1, 'validation.required'),
  age: z.number().int().min(3, 'validation.age').max(100, 'validation.age').nullable().optional(),
  phone: optionalPhone,
  email: z.union([z.literal(''), z.string().trim().email('validation.email')]).optional().transform((v) => v || undefined),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'professional']),
  start_date: z.string().nullable().optional(),
  strengths: z.string().optional(),
  weaknesses: z.string().optional(),
  goals: z.string().optional(),
  coach_notes: z.string().optional(),
});
export type StudentForm = z.input<typeof studentSchema>;
