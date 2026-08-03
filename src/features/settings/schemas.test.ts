import { expect, it } from "vitest";
import { appSettingsSchema, smtpSchema } from "./schemas";

it("rejects an inverted transfer amount range",()=>expect(appSettingsSchema.safeParse({transfer_fee_rate:.01,daily_limit_default:10,monthly_limit_default:20,min_transfer_amount:50,max_transfer_amount:10,maintenance_mode:false,kyc_required:false,support_email:"support@example.com",app_name:"Portal"}).success).toBe(false));
it("validates SMTP port and sender email",()=>expect(smtpSchema.safeParse({host:"smtp.example.com",port:70000,username:"",password:"",from_email:"invalid",from_name:"Portal",use_tls:true,use_ssl:false,enabled:true}).success).toBe(false));
