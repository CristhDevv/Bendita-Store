"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";

const registerSchema = z.object({
  fullName: z.string().min(2, "Ingresa tu nombre completo"),
  email: z.string().email("Ingresa un correo válido"),
  phone: z.string().min(7, "Ingresa un teléfono válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string(),
  terms: z.literal(true, {
    message: "Debes aceptar los términos"
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    const { error } = await signUp(data.email, data.password, {
      full_name: data.fullName,
      phone: data.phone,
    });
    setIsLoading(false);

    if (error) {
      toast.error(error.message || "Ocurrió un error al registrarte");
    } else {
      toast.success("Cuenta creada exitosamente. Por favor verifica tu correo.");
      router.push("/login");
    }
  };

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="font-display text-4xl text-charcoal mb-2">Únete a Bendita Store</h1>
        <p className="font-body text-charcoal-muted">Crea tu cuenta para acceder a experiencias exclusivas</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <input
            {...register("fullName")}
            type="text"
            placeholder="Nombre completo"
            className={`w-full bg-white border ${errors.fullName ? 'border-rose-500' : 'border-border'} focus:border-gold rounded-xl px-4 py-3 font-body text-charcoal outline-none transition-colors shadow-sm`}
          />
          {errors.fullName && <p className="text-rose-400 text-xs mt-1 px-1">{errors.fullName.message}</p>}
        </div>

        <div>
          <input
            {...register("email")}
            type="email"
            placeholder="Correo electrónico"
            className={`w-full bg-white border ${errors.email ? 'border-rose-500' : 'border-border'} focus:border-gold rounded-xl px-4 py-3 font-body text-charcoal outline-none transition-colors shadow-sm`}
          />
          {errors.email && <p className="text-rose-400 text-xs mt-1 px-1">{errors.email.message}</p>}
        </div>

        <div>
          <input
            {...register("phone")}
            type="tel"
            placeholder="Teléfono"
            className={`w-full bg-white border ${errors.phone ? 'border-rose-500' : 'border-border'} focus:border-gold rounded-xl px-4 py-3 font-body text-charcoal outline-none transition-colors shadow-sm`}
          />
          {errors.phone && <p className="text-rose-400 text-xs mt-1 px-1">{errors.phone.message}</p>}
        </div>

        <div>
          <input
            {...register("password")}
            type="password"
            placeholder="Contraseña"
            className={`w-full bg-white border ${errors.password ? 'border-rose-500' : 'border-border'} focus:border-gold rounded-xl px-4 py-3 font-body text-charcoal outline-none transition-colors shadow-sm`}
          />
          {errors.password && <p className="text-rose-400 text-xs mt-1 px-1">{errors.password.message}</p>}
        </div>

        <div>
          <input
            {...register("confirmPassword")}
            type="password"
            placeholder="Confirmar contraseña"
            className={`w-full bg-white border ${errors.confirmPassword ? 'border-rose-500' : 'border-border'} focus:border-gold rounded-xl px-4 py-3 font-body text-charcoal outline-none transition-colors shadow-sm`}
          />
          {errors.confirmPassword && <p className="text-rose-400 text-xs mt-1 px-1">{errors.confirmPassword.message}</p>}
        </div>

        <div className="flex items-start gap-2 mt-2">
          <div className="relative flex items-center justify-center w-5 h-5 border border-border rounded bg-white shrink-0 mt-0.5">
            <input {...register("terms")} type="checkbox" className="peer w-5 h-5 opacity-0 absolute inset-0 cursor-pointer" />
            <svg className="w-3 h-3 text-gold opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-body text-sm text-charcoal-muted">
              Acepto los <Link href="/terms" className="text-gold hover:underline">términos y condiciones</Link> y la política de privacidad.
            </span>
            {errors.terms && <p className="text-rose-400 text-xs mt-1">{errors.terms.message}</p>}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 mt-4 rounded-xl flex items-center justify-center gap-2 font-body font-semibold text-white transition-all hover:scale-[1.02] shadow-sm disabled:opacity-70 disabled:hover:scale-100 bg-charcoal hover:bg-gold"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Crear cuenta"}
        </button>
      </form>

      <p className="font-body text-sm text-charcoal-muted text-center mt-8">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-gold hover:text-gold-400 font-medium transition-colors">
          Inicia sesión
        </Link>
      </p>
    </>
  );
}
