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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const supabase = createClient();
      
      if (!supabase) {
        setLoading(false);
        return;
      }

      const getSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user || null);
        setLoading(false);
      };

      getSession();

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
