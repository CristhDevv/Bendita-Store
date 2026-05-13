"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";

const forgotSchema = z.object({
  email: z.string().email("Ingresa un correo válido"),
});

type ForgotForm = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotForm) => {
    setIsLoading(true);
    const { error } = await resetPassword(data.email);
    setIsLoading(false);

    if (error) {
      toast.error(error.message || "No se pudo enviar el correo");
    } else {
      setIsSent(true);
    }
  };

  if (isSent) {
    return (
      <div className="text-center">
        <h1 className="font-display text-3xl text-crystal mb-4">Revisa tu correo</h1>
        <p className="font-body text-crystal/70 mb-8 leading-relaxed">
          Hemos enviado un enlace de recuperación. Por favor revisa tu bandeja de entrada o la carpeta de spam.
        </p>
        <Link
          href="/login"
          className="inline-block px-8 py-3 rounded-xl border border-gold text-gold font-body font-medium hover:bg-gold/10 transition-colors"
        >
          Volver a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl text-crystal mb-2">Recuperar Contraseña</h1>
        <p className="font-body text-crystal/60 text-sm">
          Ingresa el correo electrónico asociado a tu cuenta y te enviaremos las instrucciones para restablecerla.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <input
            {...register("email")}
            type="email"
            placeholder="Correo electrónico"
            className="w-full bg-navy-950/50 border border-gold-500/30 focus:border-gold rounded-xl px-4 py-3 font-body text-crystal outline-none transition-colors"
          />
          {errors.email && <p className="text-rose-400 text-xs mt-1 px-1">{errors.email.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 mt-2 rounded-xl flex items-center justify-center gap-2 font-body font-semibold text-navy-950 transition-all hover:scale-[1.02] shadow-xl shadow-gold/20 disabled:opacity-70 disabled:hover:scale-100"
          style={{ background: "linear-gradient(135deg,#f5d97e,#c9a227)" }}
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Enviar enlace"}
        </button>
      </form>

      <p className="font-body text-sm text-crystal/60 text-center mt-8">
        <Link href="/login" className="text-gold hover:text-gold-400 font-medium transition-colors">
          Volver a iniciar sesión
        </Link>
      </p>
    </>
  );
}
