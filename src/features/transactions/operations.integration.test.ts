import { expect, it } from "vitest";
import { apiRequest } from "../../api/httpClient";
import type { KycPage } from "../kyc/types";
import type { AppSettings } from "../settings/types";
import type { TransactionPage } from "./types";

async function signIn(role:string) { await apiRequest({url:"/auth/mock-login",method:"POST",data:{role}}); }

it("loads transaction activity using the backend response schema",async()=>{
  await signIn("SUPER_ADMINISTRATOR");
  const result=await apiRequest<TransactionPage>({url:"/admin/transactions",params:{page:1,limit:20}});
  expect(result.transactions[0]).toMatchObject({transaction_ref:expect.any(String),currency:expect.any(String)});
});

it("records a KYC approval through the review endpoint",async()=>{
  await signIn("COMPLIANCE_OFFICER");
  const queue=await apiRequest<KycPage>({url:"/admin/kyc"});
  const pending=queue.submissions.find(x=>x.status==="pending")!;
  const result=await apiRequest<{status:string}>({url:`/admin/kyc/submissions/${pending.id}/review`,method:"PUT",data:{action:"approve",reviewer_id:"usr-compliance"}});
  expect(result.status).toBe("verified");
});

it("persists application settings through the authorized API",async()=>{
  await signIn("SUPER_ADMINISTRATOR");
  const current=await apiRequest<AppSettings>({url:"/admin/settings"});
  const saved=await apiRequest<AppSettings>({url:"/admin/settings",method:"PUT",data:{...current,kyc_required:true}});
  expect(saved.kyc_required).toBe(true);
});
