export type Env = {
  DB: D1Database;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  META_VERIFY_TOKEN: string;
  META_PAGE_ACCESS_TOKEN: string;
  META_CONVERSIONS_ACCESS_TOKEN: string;
  META_PHONE_NUMBER_ID?: string;
  WHATSAPP_ACCESS_TOKEN?: string;
  APP_ENV: string;
};
