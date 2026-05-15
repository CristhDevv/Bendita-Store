"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";

const loginSchema = z.object({
  email: z.string().email("Ingresa un correo válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    console.log("Intentando iniciar sesión para:", data.email);
    const { error, data: authData } = await signIn(data.email, data.password);
    console.log("Respuesta auth:", { error, authData });
    setIsLoading(false);

    if (error) {
      toast.error(error.message || "Credenciales incorrectas");
    } else {
      toast.success("¡Bienvenido!");
      router.push("/account");
    }
  };

  const handleGoogle = async () => {
    await signInWithGoogle();
  };

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="font-display text-4xl text-charcoal mb-2">Bienvenida de nuevo</h1>
        <p className="font-body text-charcoal-muted">Ingresa a tu cuenta para continuar</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <div>
          <input
            {...register("email")}
            type="email"
            placeholder="Correo electrónico"
            className="w-full bg-white border border-border focus:border-gold rounded-xl px-4 py-3 font-body text-charcoal outline-none transition-colors shadow-sm"
          />
          {errors.email && <p className="text-rose-400 text-xs mt-1 px-1">{errors.email.message}</p>}
        </div>

        <div className="relative">
          <input
            {...register("password")}
            type={showPassword ? "text" : "password"}
            placeholder="Contraseña"
            className="w-full bg-white border border-border focus:border-gold rounded-xl px-4 py-3 font-body text-charcoal outline-none transition-colors shadow-sm pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-muted hover:text-charcoal transition-colors p-1"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          {errors.password && <p className="text-rose-400 text-xs mt-1 px-1">{errors.password.message}</p>}
        </div>

        <div className="flex items-center justify-between mt-1">
          <label className="flex items-center gap-2 cursor-pointer group">
            <div className="relative flex items-center justify-center w-5 h-5 border border-border rounded bg-white group-hover:border-gold transition-colors">
              <input type="checkbox" className="peer sr-only" />
              <svg className="w-3 h-3 text-gold opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="font-body text-sm text-charcoal-muted group-hover:text-charcoal transition-colors">Recordarme</span>
          </label>
          <Link href="/forgot-password" className="font-body text-sm text-gold hover:text-gold-400 transition-colors">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 mt-2 rounded-xl flex items-center justify-center gap-2 font-body font-semibold text-white transition-all hover:scale-[1.02] shadow-sm disabled:opacity-70 disabled:hover:scale-100 bg-charcoal hover:bg-gold"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Ingresar"}
        </button>
      </form>

      <div className="relative flex items-center justify-center my-8">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
        <span className="relative bg-white px-4 font-body text-xs text-charcoal-muted uppercase tracking-widest">o continúa con</span>
      </div>

      <button
        onClick={handleGoogle}
        className="w-full py-3.5 rounded-xl border border-border bg-white shadow-sm flex items-center justify-center gap-3 font-body text-charcoal hover:bg-cream transition-colors"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Google
      </button>

      <p className="font-body text-sm text-charcoal-muted text-center mt-8">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="text-gold hover:text-gold-400 font-medium transition-colors">
          Regístrate aquí
        </Link>
      </p>
    </>
  );
}
