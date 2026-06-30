import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://mtoxoronjboeupswyngf.supabase.co";
const supabaseAnonKey = "sb_publishable_eKbERnmD4g7wF5QcQL76aQ_n7Zbb7gG";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
