import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Correo electrónico no válido'),
  phone: z.string().regex(/^3\d{9}$/, 'El teléfono debe ser un celular válido de 10 dígitos (iniciado en 3)').optional().or(z.literal('')),
  address: z.string().min(3, 'La dirección es requerida').optional().or(z.literal('')),
  city: z.string().min(2, 'La ciudad es requerida').optional().or(z.literal('')),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  acceptedTerms: z.boolean().refine((val) => val === true, {
    message: 'Debes aceptar los términos y condiciones',
  }),
});

export const loginSchema = z.object({
  email: z.string().email('Correo electrónico no válido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const googleAuthSchema = z.object({
  idToken: z.string().min(1, 'El token de Google ID es requerido'),
  oauthToken: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Correo electrónico no válido'),
});
