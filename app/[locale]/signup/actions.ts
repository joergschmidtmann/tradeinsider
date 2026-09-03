"use server";

import { getTranslations } from "next-intl/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SignupState = { error?: string; success?: boolean } | undefined;

export async function signup(_prevState: SignupState, formData: FormData): Promise<SignupState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const t = await getTranslations("auth.signup");

  if (password.length < 8) {
    return { error: t("errorPasswordLength") };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: error.message === "User already registered" ? t("errorTaken") : t("errorGeneric") };
  }

  return { success: true };
}
