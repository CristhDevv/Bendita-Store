import { createClient } from "./client";

export const signIn = async (email: string, password: string) => {
  const supabase = createClient();
  return supabase.auth.signInWithPassword({ email, password });
};

export const signUp = async (email: string, password: string, metadata?: any) => {
  const supabase = createClient();
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });
};

export const signOut = async () => {
  const supabase = createClient();
  return supabase.auth.signOut();
};

export const signInWithGoogle = async () => {
  const supabase = createClient();
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/`,
    },
  });
};

export const resetPassword = async (email: string) => {
  const supabase = createClient();
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/update-password`,
  });
};

export const getCurrentUser = async () => {
  const supabase = createClient();
  return supabase.auth.getUser();
};
