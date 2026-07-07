// Usuarios internos do CRM podem entrar so com nome de usuario, sem e-mail real.
// O Supabase exige um e-mail, entao geramos um e-mail tecnico com este dominio.
// Nada e enviado para ele: a conta e criada com email_confirm e o login usa senha.
export const INTERNAL_USER_DOMAIN = "belezamanaus.pages.dev";

export function isEmailAddress(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

// Normaliza um nome de usuario: minusculo, sem espacos, apenas letras/numeros/._-
export function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ".").replace(/[^a-z0-9._-]/g, "");
}

// Converte "nome de usuario" ou "e-mail" no e-mail usado no login do Supabase.
export function toLoginEmail(value: string) {
  const trimmed = value.trim();
  if (isEmailAddress(trimmed)) return trimmed.toLowerCase();
  const username = normalizeUsername(trimmed);
  return username ? `${username}@${INTERNAL_USER_DOMAIN}` : "";
}
