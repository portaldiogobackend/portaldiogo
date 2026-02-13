import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
});

export const registerSchema = z.object({
  fullName: z.string().min(3, 'Nome muito curto'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export const contactSchema = z.object({
  name: z.string().min(3, 'Nome obrigatório'),
  email: z.string().email('Email inválido'),
  message: z.string().min(10, 'A mensagem deve ter pelo menos 10 caracteres'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type ContactFormValues = z.infer<typeof contactSchema>;
