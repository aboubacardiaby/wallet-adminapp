import { http, HttpResponse } from "msw";
import { env } from "../config/env";
import { mockUsers } from "./users";
import type { Country, Region, City, Page, ReferenceData } from "../features/geography/types";
import type { RemittanceCorridor } from "../features/corridors/types";
import { countrySchema, citySchema } from "../features/geography/schemas";
import { corridorSchema } from "../features/corridors/schemas";
import { agentSchema } from "../features/agents/schemas";
import type { Permission } from "../auth/permissions";
import Decimal from "decimal.js";
import type { Transaction } from "../features/transactions/types";
import type { KycSubmission } from "../features/kyc/types";
import type { AppSettings, SmtpSettings } from "../features/settings/types";
import type { Agent, AgentDocument, AgentService } from "../features/agents/types";

let currentRole: keyof typeof mockUsers | null = null;
let sequence = 20;
let agentCodeSequence = 1;
const url = (path: string) => `${env?.apiBaseUrl}${path}`;
const now = "2026-07-29T18:00:00.000Z";
const id = (prefix: string) => `${prefix}-${++sequence}`;

const initialCountries: Country[] = [
  { id:"country-sn",name:"Senegal",iso2Code:"SN",iso3Code:"SEN",defaultCurrencyCode:"XOF",timezone:"Africa/Dakar",phoneCountryCode:"+221",minimumCustomerAge:18,sendingEnabled:true,receivingEnabled:true,cashPickupEnabled:true,bankDepositEnabled:true,walletDepositEnabled:true,status:"ACTIVE",createdAt:now,updatedAt:now },
  { id:"country-gm",name:"The Gambia",iso2Code:"GM",iso3Code:"GMB",defaultCurrencyCode:"GMD",timezone:"Africa/Banjul",phoneCountryCode:"+220",minimumCustomerAge:18,sendingEnabled:true,receivingEnabled:true,cashPickupEnabled:true,bankDepositEnabled:true,walletDepositEnabled:false,status:"ACTIVE",createdAt:now,updatedAt:now },
  { id:"country-gn",name:"Guinea",iso2Code:"GN",iso3Code:"GIN",defaultCurrencyCode:"GNF",timezone:"Africa/Conakry",phoneCountryCode:"+224",minimumCustomerAge:18,sendingEnabled:false,receivingEnabled:true,cashPickupEnabled:true,bankDepositEnabled:false,walletDepositEnabled:true,status:"DRAFT",createdAt:now,updatedAt:now },
];
const initialRegions: Region[] = [
  { id:"region-dakar",countryId:"country-sn",name:"Dakar",code:"DK",status:"ACTIVE" },
  { id:"region-kanifing",countryId:"country-gm",name:"Kanifing",code:"KN",status:"ACTIVE" },
];
const initialCities: City[] = [
  { id:"city-dakar",countryId:"country-sn",regionId:"region-dakar",name:"Dakar",code:"DKR",timezone:"Africa/Dakar",serviceRadiusKm:35,cashPickupEnabled:true,bankDepositEnabled:true,walletDepositEnabled:true,status:"ACTIVE",version:1 },
  { id:"city-serrekunda",countryId:"country-gm",regionId:"region-kanifing",name:"Serrekunda",code:"SER",timezone:"Africa/Banjul",serviceRadiusKm:25,cashPickupEnabled:true,bankDepositEnabled:true,walletDepositEnabled:false,status:"ACTIVE",version:1 },
];
const initialCorridors: RemittanceCorridor[] = [
  { id:"corridor-sn-gm",originCountryId:"country-sn",destinationCountryId:"country-gm",sourceCurrencyCode:"XOF",destinationCurrencyCode:"GMD",allowedPayoutMethods:["CASH_PICKUP","BANK_DEPOSIT"],minimumAmount:"1000",maximumAmount:"500000",dailyCustomerLimit:"1000000",monthlyCustomerLimit:"5000000",feePlanId:"fee-standard",exchangeRatePlanId:"rate-daily",complianceRuleSetId:"compliance-standard",effectiveFrom:"2026-07-01",status:"ACTIVE",version:1 },
];
let countries = structuredClone(initialCountries);
let regions = structuredClone(initialRegions);
let cities = structuredClone(initialCities);
let corridors = structuredClone(initialCorridors);
const initialAgents: Agent[] = [
  { id:"agent-1", agentCode:"SN-DKR-0001", legalBusinessName:"Diallo Transferts", tradingName:"Diallo Cash", registrationNumber:"SN123456", taxIdentificationNumber:"TIN-SN-1", countryId:"country-sn", regionId:"region-dakar", cityId:"city-dakar", addressLine1:"12 Avenue Blaise Diagne", addressLine2:"Dakar Plateau", postalCode:"10000", latitude:14.7167, longitude:-17.4677, contactName:"Amadou Diallo", contactEmail:"amadou@diallo.test", contactPhone:"+221771234567", supportedServices:["CASH_PICKUP","BANK_DEPOSIT"], dailyPayoutLimit:"500000.00", maximumCashExposure:"1000000.00", minimumLiquidityThreshold:"100000.00", riskRating:"LOW", status:"ACTIVE", version:1, createdAt:now, updatedAt:now, countryName:"Senegal", cityName:"Dakar", countryCurrencyCode:"XOF", availablePayoutBalance:"125000.00" },
  { id:"agent-2", agentCode:"GM-SER-0001", legalBusinessName:"Banjul Express Ltd", registrationNumber:"GM987654", taxIdentificationNumber:"TIN-GM-1", countryId:"country-gm", regionId:"region-kanifing", cityId:"city-serrekunda", addressLine1:"45 Kairaba Avenue", postalCode:null as unknown as undefined, latitude:13.4412, longitude:-16.6828, contactName:"Fatou Jallow", contactEmail:"fatou@banjulexpress.test", contactPhone:"+2203812345", supportedServices:["CASH_PICKUP"], dailyPayoutLimit:"300000.00", maximumCashExposure:"600000.00", minimumLiquidityThreshold:"50000.00", riskRating:"MEDIUM", status:"ACTIVE", version:1, createdAt:now, updatedAt:now, countryName:"The Gambia", cityName:"Serrekunda", countryCurrencyCode:"GMD", availablePayoutBalance:"32000.00" },
  { id:"agent-3", agentCode:"SN-DKR-0002", legalBusinessName:"Ndiaye Money Services", registrationNumber:"SN789012", countryId:"country-sn", regionId:"region-dakar", cityId:"city-dakar", addressLine1:"Ngor Island Road", contactName:"Moussa Ndiaye", contactEmail:"moussa@ndiaye.test", contactPhone:"+221776543210", supportedServices:["CASH_PICKUP","WALLET_DEPOSIT"], dailyPayoutLimit:"250000.00", maximumCashExposure:"500000.00", minimumLiquidityThreshold:"75000.00", riskRating:"HIGH", status:"UNDER_REVIEW", version:1, createdAt:now, updatedAt:now, countryName:"Senegal", cityName:"Dakar", countryCurrencyCode:"XOF", availablePayoutBalance:"90000.00" },
  { id:"agent-4", agentCode:"GN-CKY-0001", legalBusinessName:"Conakry Transfers", registrationNumber:"GN456123", countryId:"country-gn", cityId:"country-gn", addressLine1:"Taouyah Market", contactName:"Aïcha Camara", contactEmail:"aicha@conakry.test", contactPhone:"+224621234567", supportedServices:["BANK_DEPOSIT"], dailyPayoutLimit:"100000.00", maximumCashExposure:"200000.00", minimumLiquidityThreshold:"25000.00", riskRating:"MEDIUM", status:"DRAFT", version:1, createdAt:now, updatedAt:now, countryName:"Guinea", cityName:"Conakry", countryCurrencyCode:"GNF", availablePayoutBalance:"30000.00" },
];
let agents = structuredClone(initialAgents);
const initialDocuments: AgentDocument[] = [
  { id:"doc-1", agentId:"agent-1", documentType:"Business registration", fileName:"business-reg.pdf", status:"PENDING", uploadedAt:now },
  { id:"doc-2", agentId:"agent-1", documentType:"Tax certificate", fileName:"tax-cert.pdf", status:"VERIFIED", uploadedAt:now, reviewedAt:now, reviewedBy:"usr-compliance" },
  { id:"doc-3", agentId:"agent-2", documentType:"Signed agent agreement", fileName:"agreement.pdf", status:"PENDING", uploadedAt:now },
];
let documents = structuredClone(initialDocuments);
const transactions:Transaction[]=[
  {id:"tx-1",transaction_ref:"KLP-8F24A1",type:"transfer",status:"completed",from_phone:"+221773201844",to_phone:"+2203812044",sender_name:"Amadou Diallo",recipient_name:"Fatou Koné",amount:"185000.00",fee:"2775.00",total_amount:"187775.00",currency:"XOF",description:"Family support",created_at:"2026-07-29T15:42:00Z",completed_at:"2026-07-29T15:43:00Z"},
  {id:"tx-2",transaction_ref:"KLP-3B97C2",type:"cash_pickup",status:"ready_for_pickup",from_phone:"+221771440291",to_phone:"+224622410987",sender_name:"Aïcha Ouedraogo",recipient_name:"Moussa Camara",amount:"75000.00",fee:"1125.00",total_amount:"76125.00",currency:"XOF",description:"Cash pickup",created_at:"2026-07-29T14:18:00Z"},
];
const initialKyc:KycSubmission[]=[
  {id:"kyc-1",user_id:"user-1",user_name:"Fatou Koné",user_phone:"+2250758140291",full_name:"Fatou Koné",date_of_birth:"1994-05-12",nationality:"Ivorian",address:"Plateau",city:"Dakar",region:"Dakar",country:"Senegal",id_type:"passport",id_number:"PA1234567",id_expiry:"2030-05-12",id_front_url:"",id_back_url:"",selfie_url:"",status:"pending",submitted_at:"2026-07-28T10:00:00Z",updated_at:"2026-07-28T10:00:00Z"},
  {id:"kyc-2",user_id:"user-2",user_name:"Ibrahim Traoré",user_phone:"+22376294410",full_name:"Ibrahim Traoré",date_of_birth:"1989-11-04",nationality:"Malian",address:"Medina",city:"Banjul",region:"Banjul",country:"The Gambia",id_type:"national_id",id_number:"ML9876543",id_expiry:"2029-03-01",id_front_url:"",id_back_url:"",selfie_url:"",status:"under_review",submitted_at:"2026-07-27T09:30:00Z",updated_at:"2026-07-27T09:30:00Z"},
];
let kycSubmissions=structuredClone(initialKyc);
let appSettings:AppSettings={transfer_fee_rate:0.015,daily_limit_default:500000,monthly_limit_default:2000000,min_transfer_amount:1,max_transfer_amount:10000,maintenance_mode:false,kyc_required:false,support_email:"support@kalipeh.com",app_name:"Kalipeh Wallet"};
let smtpSettings:SmtpSettings={host:"",port:587,username:"",password:"",from_email:"",from_name:"Kalipeh",use_tls:true,use_ssl:false,enabled:false,source:"database",updated_at:null};

const references: ReferenceData = {
  currencies:[{code:"XOF",name:"West African CFA franc"},{code:"GMD",name:"Gambian dalasi"},{code:"GNF",name:"Guinean franc"},{code:"USD",name:"US dollar"}],
  timezones:["Africa/Dakar","Africa/Banjul","Africa/Conakry","UTC"],
  payoutMethods:[{code:"CASH_PICKUP",name:"Cash pickup"},{code:"BANK_DEPOSIT",name:"Bank deposit"},{code:"WALLET_DEPOSIT",name:"Wallet deposit"}],
};
const forbidden = () => HttpResponse.json({title:"Forbidden",status:403,detail:"Your mock role does not permit this action.",traceId:"mock-403"}, {status:403});
const can = (permission: Permission) => Boolean(currentRole && mockUsers[currentRole].permissions.includes(permission));
const page = <T,>(items: T[], requestUrl: URL): Page<T> => {
  const pageNumber = Number(requestUrl.searchParams.get("page") || 1);
  const pageSize = Number(requestUrl.searchParams.get("pageSize") || 25);
  return { items:items.slice((pageNumber-1)*pageSize,pageNumber*pageSize),page:pageNumber,pageSize,totalItems:items.length,totalPages:Math.ceil(items.length/pageSize) };
};
const problem = (detail: string, errors?: Record<string,string[]>) => HttpResponse.json({title:"Validation failed",status:400,detail,traceId:"mock-validation",errors},{status:400});

export const handlers = [
  http.get(url("/auth/me"), () => currentRole ? HttpResponse.json(mockUsers[currentRole]) : HttpResponse.json({ title:"Unauthorized",status:401,detail:"Sign in is required.",traceId:"mock-auth-401" }, { status:401 })),
  http.post(url("/auth/mock-login"), async ({ request }) => {
    const body = await request.json() as { role?: keyof typeof mockUsers };
    if (!body.role || !mockUsers[body.role]) return HttpResponse.json({ title:"Invalid mock identity",status:400,detail:"Select a supported role.",traceId:"mock-login-400" }, { status:400 });
    currentRole = body.role;
    return HttpResponse.json({ authenticated:true });
  }),
  http.post(url("/auth/logout"), () => { currentRole = null; return new HttpResponse(null, { status:204 }); }),
  http.get(url("/configuration/reference-data"), () => HttpResponse.json(references)),
  http.get(url("/configuration/plans"), () => HttpResponse.json({ feePlans:[{id:"fee-standard",name:"Standard fee plan"}],exchangeRatePlans:[{id:"rate-daily",name:"Daily treasury rate"}],complianceRuleSets:[{id:"compliance-standard",name:"Standard screening"}] })),
  http.get(url("/countries"), ({request}) => {
    if (!can("countries.view")) return forbidden();
    const requestUrl = new URL(request.url);
    const search = (requestUrl.searchParams.get("search") || "").toLowerCase();
    const status = requestUrl.searchParams.get("status");
    const currency = requestUrl.searchParams.get("currency");
    const visible = currentRole === "COUNTRY_MANAGER" ? countries.filter(x => mockUsers.COUNTRY_MANAGER.scope.countryIds.includes(x.id)) : countries;
    return HttpResponse.json(page(visible.filter(x => (!search || `${x.name} ${x.iso2Code}`.toLowerCase().includes(search)) && (!status || x.status === status) && (!currency || x.defaultCurrencyCode === currency)),requestUrl));
  }),
  http.post(url("/countries"), async ({request}) => {
    if (!can("countries.manage")) return forbidden();
    const parsed = countrySchema.safeParse(await request.json());
    if (!parsed.success) return problem("Country fields are invalid.", parsed.error.flatten().fieldErrors as Record<string,string[]>);
    if (countries.some(x => x.iso2Code === parsed.data.iso2Code || x.iso3Code === parsed.data.iso3Code)) return problem("ISO codes must be unique.",{iso2Code:["A country already uses this ISO code."]});
    const country: Country = { id:id("country"),...parsed.data,createdAt:now,updatedAt:now };
    countries.push(country); return HttpResponse.json(country,{status:201});
  }),
  http.get(url("/countries/:countryId"), ({params}) => {
    if (!can("countries.view")) return forbidden();
    const country = countries.find(x => x.id === params.countryId);
    return country ? HttpResponse.json(country) : new HttpResponse(null,{status:404});
  }),
  http.put(url("/countries/:countryId"), async ({params,request}) => {
    if (!can("countries.manage")) return forbidden();
    const index = countries.findIndex(x => x.id === params.countryId);
    if (index < 0) return new HttpResponse(null,{status:404});
    const parsed = countrySchema.safeParse(await request.json());
    if (!parsed.success) return problem("Country fields are invalid.",parsed.error.flatten().fieldErrors as Record<string,string[]>);
    countries[index] = {...countries[index],...parsed.data,updatedAt:now}; return HttpResponse.json(countries[index]);
  }),
  http.get(url("/regions"), ({request}) => {
    if (!can("cities.view")) return forbidden();
    const requestUrl = new URL(request.url); const countryId=requestUrl.searchParams.get("countryId");
    return HttpResponse.json(page(regions.filter(x => !countryId || x.countryId === countryId),requestUrl));
  }),
  http.get(url("/cities"), ({request}) => {
    if (!can("cities.view")) return forbidden();
    const requestUrl = new URL(request.url); const countryId=requestUrl.searchParams.get("countryId"); const search=(requestUrl.searchParams.get("search")||"").toLowerCase();
    return HttpResponse.json(page(cities.filter(x => (!countryId || x.countryId === countryId) && (!search || `${x.name} ${x.code}`.toLowerCase().includes(search))),requestUrl));
  }),
  http.post(url("/cities"), async ({request}) => {
    if (!can("cities.manage")) return forbidden();
    const parsed=citySchema.safeParse(await request.json());
    if(!parsed.success)return problem("City fields are invalid.",parsed.error.flatten().fieldErrors as Record<string,string[]>);
    if(cities.some(x=>x.countryId===parsed.data.countryId&&x.code===parsed.data.code))return problem("City code must be unique within the country.",{code:["This code is already used."]});
    const city:City={id:id("city"),...parsed.data,version:1};cities.push(city);return HttpResponse.json(city,{status:201});
  }),
  http.get(url("/cities/:cityId"), ({params}) => {
    if(!can("cities.view"))return forbidden();const city=cities.find(x=>x.id===params.cityId);return city?HttpResponse.json(city):new HttpResponse(null,{status:404});
  }),
  http.put(url("/cities/:cityId"), async ({params,request}) => {
    if(!can("cities.manage"))return forbidden();const index=cities.findIndex(x=>x.id===params.cityId);if(index<0)return new HttpResponse(null,{status:404});
    const version=Number(request.headers.get("If-Match"));if(version!==cities[index].version)return HttpResponse.json({title:"Version conflict",status:412,detail:"This city was changed by another user.",traceId:"mock-city-conflict"},{status:412});
    const parsed=citySchema.safeParse(await request.json());if(!parsed.success)return problem("City fields are invalid.",parsed.error.flatten().fieldErrors as Record<string,string[]>);
    cities[index]={...cities[index],...parsed.data,version:cities[index].version+1};return HttpResponse.json(cities[index]);
  }),
  http.get(url("/corridors"), ({request}) => {
    if(!can("corridors.view"))return forbidden();return HttpResponse.json(page(corridors,new URL(request.url)));
  }),
  http.post(url("/corridors/preview"), async ({request}) => {
    if(!can("corridors.view"))return forbidden();
    const body=await request.json() as {amount?:string;sourceCurrencyCode?:string;destinationCurrencyCode?:string};
    if(!body.amount||!/^\d+(\.\d+)?$/.test(body.amount))return problem("Enter a valid preview amount.");
    const source=new Decimal(body.amount);const fee=source.mul("0.015");const payout=source.minus(fee).mul("0.067");
    return HttpResponse.json({sourceAmount:source.toFixed(2),fee:fee.toFixed(2),destinationAmount:payout.toFixed(2),sourceCurrencyCode:body.sourceCurrencyCode,destinationCurrencyCode:body.destinationCurrencyCode,estimated:true});
  }),
  http.post(url("/corridors"), async ({request}) => {
    if(!can("corridors.manage"))return forbidden();const parsed=corridorSchema.safeParse(await request.json());
    if(!parsed.success)return problem("Corridor fields are invalid.",parsed.error.flatten().fieldErrors as Record<string,string[]>);
    const corridor:RemittanceCorridor={id:id("corridor"),...parsed.data,status:"DRAFT",version:1};corridors.push(corridor);return HttpResponse.json(corridor,{status:201});
  }),
  http.get(url("/corridors/:corridorId"), ({params}) => {
    if(!can("corridors.view"))return forbidden();const corridor=corridors.find(x=>x.id===params.corridorId);return corridor?HttpResponse.json(corridor):new HttpResponse(null,{status:404});
  }),
  http.post(url("/corridors/:corridorId/activate"), ({params}) => {
    if(!can("corridors.manage"))return forbidden();const corridor=corridors.find(x=>x.id===params.corridorId);if(!corridor)return new HttpResponse(null,{status:404});
    const origin=countries.find(x=>x.id===corridor.originCountryId);const destination=countries.find(x=>x.id===corridor.destinationCountryId);
    if(origin?.status!=="ACTIVE"||destination?.status!=="ACTIVE")return problem("Both countries must be active before corridor activation.");
    corridor.status="ACTIVE";corridor.version++;return HttpResponse.json(corridor);
  }),
  http.post(url("/corridors/:corridorId/suspend"), async ({params,request}) => {
    if(!can("corridors.manage"))return forbidden();const body=await request.json() as {reason?:string};if(!body.reason?.trim())return problem("A suspension reason is required.",{reason:["Enter a reason."]});
    const corridor=corridors.find(x=>x.id===params.corridorId);if(!corridor)return new HttpResponse(null,{status:404});corridor.status="SUSPENDED";corridor.version++;return HttpResponse.json(corridor);
  }),
  http.get(url("/admin/transactions"), ({request})=>{
    if(!can("transactions.view"))return forbidden();const requestUrl=new URL(request.url);const search=(requestUrl.searchParams.get("search")||"").toLowerCase();const status=requestUrl.searchParams.get("status");const type=requestUrl.searchParams.get("type");const filtered=transactions.filter(x=>(!search||`${x.transaction_ref} ${x.from_phone} ${x.to_phone}`.toLowerCase().includes(search))&&(!status||x.status===status)&&(!type||x.type===type));const result=page(filtered,requestUrl);return HttpResponse.json({transactions:result.items,total:result.totalItems,page:result.page,pages:result.totalPages});
  }),
  http.get(url("/admin/kyc"), ({request})=>{
    if(!can("compliance.view"))return forbidden();const requestUrl=new URL(request.url);const status=requestUrl.searchParams.get("kyc_status");const filtered=kycSubmissions.filter(x=>!status||x.status===status);const result=page(filtered,requestUrl);return HttpResponse.json({submissions:result.items,total:result.totalItems,page:result.page,pages:result.totalPages});
  }),
  http.put(url("/admin/kyc/submissions/:submissionId/review"), async({params,request})=>{
    if(!can("compliance.decide"))return forbidden();const body=await request.json() as {action?:string;rejection_reason?:string;reviewer_id?:string};if(body.action!=="approve"&&body.action!=="reject")return problem("Invalid review action.");if(body.action==="reject"&&!body.rejection_reason?.trim())return problem("A rejection reason is required.",{rejection_reason:["Enter a reason."]});const item=kycSubmissions.find(x=>x.id===params.submissionId);if(!item)return new HttpResponse(null,{status:404});item.status=body.action==="approve"?"verified":"rejected";item.rejection_reason=body.action==="reject"?body.rejection_reason:null;item.reviewed_by=body.reviewer_id;item.reviewed_at=now;item.updated_at=now;return HttpResponse.json({message:`KYC ${item.status}`,status:item.status});
  }),
  http.get(url("/admin/settings"), ()=>can("roles.manage")?HttpResponse.json(appSettings):forbidden()),
  http.put(url("/admin/settings"), async({request})=>{if(!can("roles.manage"))return forbidden();appSettings={...appSettings,...await request.json() as AppSettings};return HttpResponse.json(appSettings)}),
  http.get(url("/admin/smtp-settings"), ()=>can("roles.manage")?HttpResponse.json({...smtpSettings,password:smtpSettings.password?"••••••••":""}):forbidden()),
  http.put(url("/admin/smtp-settings"), async({request})=>{if(!can("roles.manage"))return forbidden();const body=await request.json() as SmtpSettings;smtpSettings={...smtpSettings,...body,password:body.password&&body.password!=="••••••••"?body.password:smtpSettings.password,updated_at:now,source:"database"};return HttpResponse.json({...smtpSettings,password:smtpSettings.password?"••••••••":""})}),
  http.get(url("/agents"), ({request})=>{
    if(!can("agents.view"))return forbidden();
    const requestUrl = new URL(request.url);
    const search = (requestUrl.searchParams.get("search") || "").toLowerCase();
    const countryId = requestUrl.searchParams.get("countryId");
    const cityId = requestUrl.searchParams.get("cityId");
    const status = requestUrl.searchParams.get("status");
    const service = requestUrl.searchParams.get("service");
    const riskRating = requestUrl.searchParams.get("riskRating");
    const scope = currentRole ? mockUsers[currentRole].scope : null;
    const scoped = scope ? agents.filter(a => (!scope.countryIds.length || scope.countryIds.includes(a.countryId)) && (!scope.cityIds.length || scope.cityIds.includes(a.cityId))) : agents;
    const filtered = scoped.filter(a =>
      (!search || `${a.legalBusinessName} ${a.tradingName || ""} ${a.agentCode || ""}`.toLowerCase().includes(search)) &&
      (!countryId || a.countryId === countryId) &&
      (!cityId || a.cityId === cityId) &&
      (!status || a.status === status) &&
      (!service || a.supportedServices.includes(service as AgentService)) &&
      (!riskRating || a.riskRating === riskRating)
    );
    return HttpResponse.json(page(filtered, requestUrl));
  }),
  http.get(url("/agents/:agentId"), ({params}) => {
    if(!can("agents.view"))return forbidden();
    const agent = agents.find(a => a.id === params.agentId);
    if(!agent)return new HttpResponse(null,{status:404});
    const scope = currentRole ? mockUsers[currentRole].scope : null;
    if(scope && scope.countryIds.length && !scope.countryIds.includes(agent.countryId)) return forbidden();
    if(scope && scope.cityIds.length && !scope.cityIds.includes(agent.cityId)) return forbidden();
    return HttpResponse.json(agent);
  }),
  http.post(url("/agents"), async ({request}) => {
    if(!can("agents.create"))return forbidden();
    const body = await request.json() as unknown;
    const parsed = agentSchema.safeParse(body);
    if(!parsed.success) return problem("Agent fields are invalid.", parsed.error.flatten().fieldErrors as Record<string, string[]>);
    const data = parsed.data;
    const status = (body as { status?: string }).status === "SUBMITTED" ? "SUBMITTED" : "DRAFT";
    const country = countries.find(c => c.id === data.countryId);
    const city = cities.find(c => c.id === data.cityId);
    if(!country || !city) return problem("Country or city not found.");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { owners, documents, bank, ...rest } = data;
    const agent: Agent = {
      id: id("agent"),
      agentCode: `${country.iso2Code}-${city.code}-${String(++agentCodeSequence).padStart(4, "0")}`,
      ...rest,
      countryName: country.name,
      cityName: city.name,
      countryCurrencyCode: country.defaultCurrencyCode,
      availablePayoutBalance: "0.00",
      status: status as Agent["status"],
      version: 1,
      createdAt: now,
      updatedAt: now,
    };
    agents.push(agent);
    return HttpResponse.json(agent, { status: 201 });
  }),
  http.post(url("/agents/:agentId/approve"), ({params}) => {
    if(!can("agents.approve"))return forbidden();
    const agent = agents.find(a => a.id === params.agentId);
    if(!agent)return new HttpResponse(null,{status:404});
    agent.status = "APPROVED"; agent.version++; agent.updatedAt = now;
    return HttpResponse.json(agent);
  }),
  http.post(url("/agents/:agentId/reject"), async ({params,request}) => {
    if(!can("agents.reject"))return forbidden();
    const agent = agents.find(a => a.id === params.agentId);
    if(!agent)return new HttpResponse(null,{status:404});
    const body = await request.json() as {reason?:string};
    if(!body.reason?.trim())return problem("A rejection reason is required.",{reason:["Enter a reason."]});
    agent.status = "REJECTED"; agent.version++; agent.updatedAt = now;
    return HttpResponse.json(agent);
  }),
  http.post(url("/agents/:agentId/suspend"), async ({params,request}) => {
    if(!can("agents.suspend"))return forbidden();
    const agent = agents.find(a => a.id === params.agentId);
    if(!agent)return new HttpResponse(null,{status:404});
    const body = await request.json() as {reason?:string};
    if(!body.reason?.trim())return problem("A suspension reason is required.",{reason:["Enter a reason."]});
    agent.status = "SUSPENDED"; agent.version++; agent.updatedAt = now;
    return HttpResponse.json(agent);
  }),
  http.post(url("/agents/:agentId/activate"), ({params}) => {
    if(!can("agents.activate"))return forbidden();
    const agent = agents.find(a => a.id === params.agentId);
    if(!agent)return new HttpResponse(null,{status:404});
    agent.status = "ACTIVE"; agent.version++; agent.updatedAt = now;
    return HttpResponse.json(agent);
  }),
  http.post(url("/agents/:agentId/terminate"), async ({params,request}) => {
    if(!can("agents.suspend"))return forbidden();
    const agent = agents.find(a => a.id === params.agentId);
    if(!agent)return new HttpResponse(null,{status:404});
    const body = await request.json() as {reason?:string};
    if(!body.reason?.trim())return problem("A termination reason is required.",{reason:["Enter a reason."]});
    agent.status = "TERMINATED"; agent.version++; agent.updatedAt = now;
    return HttpResponse.json(agent);
  }),
  http.get(url("/agents/:agentId/documents"), ({params}) => {
    if(!can("agents.view"))return forbidden();
    const agent = agents.find(a => a.id === params.agentId);
    if(!agent)return new HttpResponse(null,{status:404});
    return HttpResponse.json(documents.filter(d => d.agentId === params.agentId));
  }),
  http.post(url("/agents/:agentId/documents"), async ({params,request}) => {
    if(!can("agents.create"))return forbidden();
    const agent = agents.find(a => a.id === params.agentId);
    if(!agent)return new HttpResponse(null,{status:404});
    const body = await request.json() as {documentType?:string;fileName?:string;fileUrl?:string};
    if(!body.documentType?.trim() || !body.fileName?.trim()) return problem("Document type and file name are required.");
    const doc: AgentDocument = { id:id("doc"), agentId:params.agentId as string, documentType:body.documentType, fileName:body.fileName, fileUrl:body.fileUrl, status:"PENDING", uploadedAt:now };
    documents.push(doc);
    return HttpResponse.json(doc,{status:201});
  }),
  http.post(url("/agents/:agentId/documents/:documentId/approve"), ({params}) => {
    if(!can("documents.review"))return forbidden();
    const doc = documents.find(d => d.id === params.documentId && d.agentId === params.agentId);
    if(!doc)return new HttpResponse(null,{status:404});
    doc.status = "VERIFIED"; doc.reviewedAt = now; doc.reviewedBy = currentRole ? mockUsers[currentRole].id : undefined;
    return HttpResponse.json(doc);
  }),
  http.post(url("/agents/:agentId/documents/:documentId/reject"), async ({params,request}) => {
    if(!can("documents.review"))return forbidden();
    const doc = documents.find(d => d.id === params.documentId && d.agentId === params.agentId);
    if(!doc)return new HttpResponse(null,{status:404});
    const body = await request.json() as {reason?:string};
    if(!body.reason?.trim())return problem("A rejection reason is required.",{reason:["Enter a reason."]});
    doc.status = "REJECTED"; doc.reviewedAt = now; doc.reviewedBy = currentRole ? mockUsers[currentRole].id : undefined; doc.rejectionReason = body.reason;
    return HttpResponse.json(doc);
  }),
  http.post(url("/admin/smtp-settings/test"), async({request})=>{if(!can("roles.manage"))return forbidden();const body=await request.json() as {to?:string};if(!body.to?.includes("@"))return problem("Enter a valid recipient.");if(!smtpSettings.host||!smtpSettings.from_email)return problem("SMTP is not configured.");return HttpResponse.json({message:`Test email queued for ${body.to}`})}),
];

export function resetMockSession() {
  currentRole = null; sequence=20; agentCodeSequence=1; countries=structuredClone(initialCountries); regions=structuredClone(initialRegions); cities=structuredClone(initialCities); corridors=structuredClone(initialCorridors);kycSubmissions=structuredClone(initialKyc);agents=structuredClone(initialAgents);documents=structuredClone(initialDocuments);
}
