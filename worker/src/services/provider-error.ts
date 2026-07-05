export function formatProviderError(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error || "Provedor recusou o envio.");

  try {
    const data = JSON.parse(raw) as { error?: { code?: number; error_subcode?: number; message?: string; type?: string } };
    const providerMessage = data.error?.message;
    if (providerMessage) {
      const code = data.error?.code ? ` codigo ${data.error.code}` : "";
      const subcode = data.error?.error_subcode ? `/${data.error.error_subcode}` : "";
      return `${providerMessage}${code}${subcode}`;
    }
  } catch {
    // Some failures are local configuration errors, not Graph API JSON.
  }

  return raw;
}
