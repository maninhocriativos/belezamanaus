import { supabase } from "../lib/supabase";

export type CrmLead = {
  id: string;
  full_name: string;
  phone: string | null;
  status: string;
  temperature: string;
  lead_score: number;
  meta_campaign_name: string | null;
  source: string | null;
  last_message_at: string | null;
  created_at: string;
};

export type CrmCampaign = {
  id: string;
  name: string;
  source_platform: string | null;
};

export type CrmProcedure = {
  id: string;
  name: string;
  price: number | null;
  active: boolean;
};

export type CrmAgentProfile = {
  id: string;
  name: string;
  tone: string | null;
  initial_message: string | null;
  active: boolean;
};

export async function listLeads() {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("leads")
    .select("id,full_name,phone,status,temperature,lead_score,meta_campaign_name,source,last_message_at,created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as CrmLead[];
}

export async function listCampaigns() {
  if (!supabase) return [];

  const { data, error } = await supabase.from("campaigns").select("id,name,source_platform").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CrmCampaign[];
}

export async function listProcedures() {
  if (!supabase) return [];

  const { data, error } = await supabase.from("procedures").select("id,name,price,active").order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as CrmProcedure[];
}

export async function getActiveAgentProfile() {
  if (!supabase) return null;

  const { data, error } = await supabase.from("agent_profiles").select("id,name,tone,initial_message,active").eq("active", true).limit(1).maybeSingle();
  if (error) throw error;
  return data as CrmAgentProfile | null;
}
