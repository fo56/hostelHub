import { z } from 'zod'

export const registerValidation = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['admin', 'student', 'worker']).default('student'),
})

export const loginValidation = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})

export type RegisterInput = z.infer<typeof registerValidation>
export type LoginInput = z.infer<typeof loginValidation>
