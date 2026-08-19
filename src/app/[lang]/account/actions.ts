'use server';

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isLocale, localizedHref } from '@/lib/i18n';

export async function signOutCustomer(formData: FormData): Promise<void> {
  const langRaw = String(formData.get('lang') ?? '');
  const lang = isLocale(langRaw) ? langRaw : 'es';
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect(localizedHref(lang, '/'));
}
