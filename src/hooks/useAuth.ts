"use client";

import { useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import {
  signIn,
  signUp,
  signOut as authSignOut,
  signInWithGoogle,
  resetPassword,
} from "@/lib/supabase/auth";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(() => createClient() !== null);

  useEffect(() => {
    try {
      const supabase = createClient();
      
      if (!supabase) {
        return;
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event: any, session: any) => {
          setSession(session);
          setUser(session?.user || null);
          setLoading(false);
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    } catch (e) {
      console.warn("Auth unavailable:", e);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- manejo de error de suscripción, no inicialización
      setLoading(false);
    }
  }, []);

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut: authSignOut,
    signInWithGoogle,
    resetPassword,
  };
}
