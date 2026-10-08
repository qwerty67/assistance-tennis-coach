import { z } from 'zod';

export const classSchema = z
  .object({
    name: z.string().trim().min(1, 'validation.required'),
    class_type: z.enum(['private', 'semi_private', 'group', 'academy']),
    capacity_min: z.number().int().min(1),
    capacity_max: z.number().int().min(1),
    duration_minutes: z.number({ message: 'validation.required' }).int().min(15, 'validation.duration'),
    session_price: z.number().min(0).nullable().transform((v) => v ?? 0),
    court_cost: z.number().min(0).nullable().transform((v) => v ?? 0),
    monthly_fee: z.number().min(0).nullable().transform((v) => v ?? 0),
    billing_mode: z.enum(['per_student', 'split', 'lump']),
    location: z.string().optional(),
    description: z.string().optional(),
  })
  .refine((v) => v.capacity_max >= v.capacity_min, { message: 'validation.capacity', path: ['capacity_max'] })
  .refine((v) => (v.court_cost ?? 0) <= (v.session_price ?? 0), { message: 'validation.courtCost', path: ['court_cost'] })
  .refine((v) => v.class_type !== 'semi_private' || v.capacity_min >= 2, { message: 'validation.semiMin', path: ['capacity_min'] });

export type ClassForm = z.input<typeof classSchema>;
