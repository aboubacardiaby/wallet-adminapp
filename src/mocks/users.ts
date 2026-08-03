import type { CurrentUser } from "../api/contracts";
import { permissionCodes, type Permission } from "../auth/permissions";

const operational: Permission[] = ["dashboard.view","countries.view","cities.view","corridors.view","agents.view","agents.create","agents.update","agents.submit","outlets.manage","cashiers.manage","transactions.view"];

export const mockUsers: Record<string, CurrentUser> = {
  SUPER_ADMINISTRATOR: { id:"usr-super",displayName:"Samira Diallo",email:"samira@example.test",role:"SUPER_ADMINISTRATOR",permissions:[...permissionCodes],scope:{countryIds:[],cityIds:[]} },
  COUNTRY_MANAGER: { id:"usr-country",displayName:"Moussa Ndiaye",email:"moussa@example.test",role:"COUNTRY_MANAGER",permissions:[...operational,"countries.manage","cities.manage","corridors.manage","agents.suspend","agents.activate"],scope:{countryIds:["country-sn"],cityIds:[]} },
  COMPLIANCE_OFFICER: { id:"usr-compliance",displayName:"Awa Bah",email:"awa@example.test",role:"COMPLIANCE_OFFICER",permissions:["dashboard.view","countries.view","agents.view","agents.approve","agents.reject","documents.review","compliance.view","compliance.decide","transactions.view","audit.view"],scope:{countryIds:["country-sn","country-gm"],cityIds:[]} },
  FINANCE_OFFICER: { id:"usr-finance",displayName:"Ibrahim Touré",email:"ibrahim@example.test",role:"FINANCE_OFFICER",permissions:["dashboard.view","agents.view","liquidity.view","liquidity.adjust","commissions.view","commissions.manage","transactions.view","settlements.view","settlements.manage","reconciliation.manage","audit.view"],scope:{countryIds:["country-sn","country-gm"],cityIds:[]} },
  AUDITOR: { id:"usr-auditor",displayName:"Fatou Camara",email:"fatou@example.test",role:"AUDITOR",permissions:["dashboard.view","countries.view","cities.view","corridors.view","agents.view","compliance.view","liquidity.view","commissions.view","transactions.view","settlements.view","users.view","audit.view"],scope:{countryIds:[],cityIds:[]} },
};
