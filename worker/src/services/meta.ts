import type { Env } from "../env";

export async function createLeadFromMetaEvent(payload: unknown, _env: Env) {
  return {
    mode: "placeholder",
    action: "lead_received",
    payload
  };
}

export async function getAdsInsights(_env: Env) {
  return {
    mode: "placeholder",
    campaigns: []
  };
}

export async function sendConversionEvent(payload: unknown, _env: Env, options: { dryRun: boolean }) {
  return {
    dryRun: options.dryRun,
    event: payload,
    sent: !options.dryRun
  };
}
