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

export type RegisterDTO = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email('Correo electrónico no válido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export type LoginDTO = z.infer<typeof loginSchema>;

export const googleAuthSchema = z.object({
  idToken: z.string().min(1, 'El token de Google ID es requerido'),
  oauthToken: z.string().optional(),
});

export type GoogleAuthDTO = z.infer<typeof googleAuthSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email('Correo electrónico no válido'),
});

export type ForgotPasswordDTO = z.infer<typeof forgotPasswordSchema>;

export const verifyOtpSchema = z.object({
  email: z.string().email('Correo electrónico no válido'),
  code: z.string().regex(/^\d{5}$/, 'El código de verificación debe contener exactamente 5 dígitos numéricos'),
});

export type VerifyOtpDTO = z.infer<typeof verifyOtpSchema>;

export const resetPasswordSchema = z.object({
  email: z.string().email('Correo electrónico no válido'),
  resetToken: z.string().min(1, 'El token de restablecimiento es requerido'),
  newPassword: z
    .string()
    .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'La contraseña debe contener al menos una letra mayúscula')
    .regex(/[0-9]/, 'La contraseña debe contener al menos un número')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'La contraseña debe contener al menos un carácter especial ($#%)'),
});

export type ResetPasswordDTO = z.infer<typeof resetPasswordSchema>;
