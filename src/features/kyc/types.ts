export interface KycSubmission {
  id:string;user_id:string;user_name?:string|null;user_phone?:string|null;full_name:string;
  date_of_birth:string;nationality:string;address:string;city:string;region:string;country:string;
  id_type:string;id_number:string;id_expiry:string;id_front_url:string;id_back_url:string;selfie_url:string;
  status:"pending"|"under_review"|"verified"|"rejected";rejection_reason?:string|null;
  reviewed_by?:string|null;reviewed_at?:string|null;submitted_at:string;updated_at:string;
}
export interface KycPage {submissions:KycSubmission[];total:number;page:number;pages:number}
