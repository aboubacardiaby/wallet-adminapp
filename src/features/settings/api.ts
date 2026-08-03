import { apiRequest } from "../../api/httpClient";
import type {
  AchSettings,
  AppSettings,
  ConnectionTestResult,
  SmtpSettings,
  WaveSettings,
} from "./types";

export const settingsApi={
  get:()=>apiRequest<AppSettings>({url:"/admin/settings"}),
  save:(data:AppSettings)=>apiRequest<AppSettings>({url:"/admin/settings",method:"PUT",data}),
  smtp:()=>apiRequest<SmtpSettings>({url:"/admin/smtp-settings"}),
  saveSmtp:(data:SmtpSettings)=>apiRequest<SmtpSettings>({url:"/admin/smtp-settings",method:"PUT",data}),
  testSmtp:(to:string)=>apiRequest<{message:string}>({url:"/admin/smtp-settings/test",method:"POST",data:{to}}),
  wave:()=>apiRequest<WaveSettings>({url:"/admin/wave-config"}),
  saveWave:(data:WaveSettings)=>apiRequest<WaveSettings>({url:"/admin/wave-config",method:"PUT",data}),
  testWave:()=>apiRequest<ConnectionTestResult>({url:"/admin/wave-config/test",method:"POST"}),
  ach:()=>apiRequest<AchSettings>({url:"/admin/ach-config"}),
  saveAch:(data:AchSettings)=>apiRequest<AchSettings>({url:"/admin/ach-config",method:"PUT",data}),
  testAch:()=>apiRequest<ConnectionTestResult>({url:"/admin/ach-config/test",method:"POST"}),
};
