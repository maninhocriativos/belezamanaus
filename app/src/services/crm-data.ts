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

export type CrmSale = {
  id: string;
  amount: number;
  created_at: string;
  lead_id: string | null;
  payment_method: string | null;
  payment_status: string | null;
  procedure_id: string | null;
  procedure_name: string | null;
  sale_status: string;
};

async function getDefaultOrganizationId() {
  if (!supabase) return "";

  const { data, error } = await supabase
    .from("organizations")
    .select("id")
    .eq("name", "Beleza Manaus")
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.id ?? "";
}

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

export async function saveAgentProfile(input: { id?: string; initialMessage: string; name: string; tone: string }) {
  if (!supabase) throw new Error("Supabase nao esta configurado.");

  const payload = {
    active: true,
    initial_message: input.initialMessage,
    name: input.name,
    tone: input.tone,
    updated_at: new Date().toISOString()
  };

  if (input.id) {
    const { data, error } = await supabase
      .from("agent_profiles")
      .update(payload)
      .eq("id", input.id)
      .select("id,name,tone,initial_message,active")
      .single();

    if (error) throw error;
    return data as CrmAgentProfile;
  }

  const organizationId = await getDefaultOrganizationId();
  if (!organizationId) throw new Error("Organizacao Beleza Manaus nao encontrada.");

  const { data, error } = await supabase
    .from("agent_profiles")
    .insert({ ...payload, organization_id: organizationId })
    .select("id,name,tone,initial_message,active")
    .single();

  if (error) throw error;
  return data as CrmAgentProfile;
}

export async function listSales() {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("sales")
    .select("id,lead_id,procedure_id,procedure_name,amount,payment_method,payment_status,sale_status,created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as CrmSale[];
}

export async function createSale(input: {
  amount: number;
  leadId?: string;
  paymentMethod: string;
  paymentStatus: string;
  procedureId?: string;
  procedureName: string;
  saleStatus: string;
}) {
  if (!supabase) throw new Error("Supabase nao esta configurado.");

  const organizationId = await getDefaultOrganizationId();
  if (!organizationId) throw new Error("Organizacao Beleza Manaus nao encontrada.");

  const { data, error } = await supabase
    .from("sales")
    .insert({
      amount: input.amount,
      lead_id: input.leadId || null,
      organization_id: organizationId,
      payment_method: input.paymentMethod || null,
      payment_status: input.paymentStatus || null,
      procedure_id: input.procedureId || null,
      procedure_name: input.procedureName,
      sale_status: input.saleStatus || "completed"
    })
    .select("id,lead_id,procedure_id,procedure_name,amount,payment_method,payment_status,sale_status,created_at")
    .single();

  if (error) throw error;
  return data as CrmSale;
}
