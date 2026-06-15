import { z } from 'zod'

export const rfqFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Full name must be at least 2 characters.')
    .max(100, 'Name is too long.'),

  company: z
    .string()
    .min(2, 'Company name must be at least 2 characters.')
    .max(150, 'Company name is too long.'),

  email: z
    .string()
    .email('Please provide a valid business email address.'),

  phone: z
    .string()
    .max(20, 'Phone number is too long.')
    .optional()
    .or(z.literal('')),

  productType: z.enum(
    [
      'machined-components',
      'sheet-metal',
      'electrical-panels',
      'defense-components',
      'led-panels',
      'specialized-equipment',
      'other',
    ],
    { errorMap: () => ({ message: 'Please select a product category.' }) }
  ),

  material: z
    .string()
    .max(200, 'Material specification is too long.')
    .optional()
    .or(z.literal('')),

  quantity: z
    .string()
    .min(1, 'Quantity is required.')
    .max(100, 'Quantity value is too long.'),

  timeline: z.enum(
    [
      'prototype-2-4-weeks',
      'short-run-4-8-weeks',
      'production-8-16-weeks',
      'ongoing-supply',
      'urgent',
    ],
    { errorMap: () => ({ message: 'Please select a delivery timeline.' }) }
  ),

  description: z
    .string()
    .min(20, 'Please describe your requirement in more detail (minimum 20 characters).')
    .max(2000, 'Description exceeds maximum length.'),
})

export type RFQFormSchema = z.infer<typeof rfqFormSchema>
