export interface AppSettings {
  transfer_fee_rate:number;daily_limit_default:number;monthly_limit_default:number;
  min_transfer_amount:number;max_transfer_amount:number;maintenance_mode:boolean;
  kyc_required:boolean;support_email:string;app_name:string;
}
export interface SmtpSettings {
  host:string;port:number;username:string;password:string;from_email:string;from_name:string;
  use_tls:boolean;use_ssl:boolean;enabled:boolean;updated_at?:string|null;source?:"env"|"database";
}

export interface WaveSettings {
  api_base_url: string;
  api_key: string;
  api_key_configured?: boolean;
  business_country: string;
  business_currency: string;
  aggregated_merchant_id: string;
  verify_recipient: boolean;
  enabled: boolean;
  updated_at?: string | null;
}

export interface AchSettings {
  api_base_url: string;
  api_key: string;
  platform_account_number: string;
  platform_routing_number: string;
  platform_account_type: string;
  platform_account_name: string;
  enabled: boolean;
  updated_at?: string | null;
}

export interface ConnectionTestResult {
  message: string;
  [key: string]: unknown;
}
