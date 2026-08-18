import { z } from "zod";

/**
 * Schemas de validación Zod — Bendita Store
 * Usados en el checkout y formularios de contacto.
 */

// Teléfono colombiano: 10 dígitos, puede empezar con 3 (móvil) o sin prefijo
const phoneRegex = /^[0-9]{7,15}$/;

export const contactInfoSchema = z.object({
  fullName: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(100, "El nombre es demasiado largo"),
  email: z
    .string()
    .email("Ingresa un correo electrónico válido"),
  phone: z
    .string()
    .regex(phoneRegex, "Ingresa un número de teléfono válido (7–15 dígitos)"),
});

export const newAddressSchema = z.object({
  street: z.string().min(5, "Ingresa una dirección completa"),
  city: z.string().min(2, "Ingresa una ciudad válida"),
  state: z.string().min(2, "Ingresa un departamento válido"),
  postal_code: z.string().optional(),
});

export type ContactInfo = z.infer<typeof contactInfoSchema>;
export type NewAddress = z.infer<typeof newAddressSchema>;
