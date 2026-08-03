import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Box, Button, Card, CardContent, Checkbox, FormControl, InputLabel, ListItemText, MenuItem, OutlinedInput, Select, TextField, Typography } from "@mui/material";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { normalizeApiError } from "../../api/errors";
import { formatMoney } from "../../utils/money";
import { geographyApi } from "../geography/api";
import { corridorApi } from "./api";
import { corridorSchema, type CorridorInput } from "./schemas";

const defaults:CorridorInput={originCountryId:"",destinationCountryId:"",sourceCurrencyCode:"",destinationCurrencyCode:"",allowedPayoutMethods:[],minimumAmount:"",maximumAmount:"",dailyCustomerLimit:"",monthlyCustomerLimit:"",feePlanId:"",exchangeRatePlanId:"",complianceRuleSetId:"",effectiveFrom:"",effectiveTo:""};

export function CorridorFormPage(){
  const navigate=useNavigate();const client=useQueryClient();const countries=useQuery({queryKey:["countries"],queryFn:()=>geographyApi.countries()});const refs=useQuery({queryKey:["references"],queryFn:geographyApi.references});const plans=useQuery({queryKey:["corridor-plans"],queryFn:corridorApi.plans});
  const{control,handleSubmit,setError,formState}=useForm<CorridorInput>({resolver:zodResolver(corridorSchema),defaultValues:defaults});
  const values=useWatch({control});const create=useMutation({mutationFn:corridorApi.create,onSuccess:async item=>{await client.invalidateQueries({queryKey:["corridors"]});await navigate(`/corridors/${item.id}`)},onError:reason=>{const error=normalizeApiError(reason);Object.entries(error.fieldErrors).forEach(([field,messages])=>setError(field as keyof CorridorInput,{message:messages[0]}))}});
  const preview=useMutation({mutationFn:()=>corridorApi.preview({amount:values.minimumAmount??"",sourceCurrencyCode:values.sourceCurrencyCode??"",destinationCurrencyCode:values.destinationCurrencyCode??""})});
  const input=(name:keyof CorridorInput,label:string,props:Record<string,unknown>={})=><Controller name={name} control={control} render={({field,fieldState})=><TextField {...field} {...props} label={label} error={Boolean(fieldState.error)} helperText={fieldState.error?.message}/>}/>;
  const countrySelect=(name:"originCountryId"|"destinationCountryId",label:string)=><Controller name={name} control={control} render={({field,fieldState})=><TextField {...field} select label={label} error={Boolean(fieldState.error)} helperText={fieldState.error?.message}>{countries.data?.items.map(x=><MenuItem key={x.id} value={x.id} disabled={x.status!=="ACTIVE"}>{x.name} ({x.status})</MenuItem>)}</TextField>}/>;
  return <Box sx={{p:{xs:2,md:4},maxWidth:1050}}><Typography component="h1" variant="h1">Create remittance corridor</Typography><Typography color="text.secondary" sx={{mb:3}}>New corridors remain draft until explicitly activated.</Typography><Card><CardContent><Box component="form" onSubmit={handleSubmit(value=>create.mutate(value))}><Box sx={{display:"grid",gridTemplateColumns:{xs:"1fr",md:"1fr 1fr"},gap:2}}>
    {countrySelect("originCountryId","Origin country")}{countrySelect("destinationCountryId","Destination country")}
    {(["sourceCurrencyCode","destinationCurrencyCode"] as const).map((name,index)=><Controller key={name} name={name} control={control} render={({field})=><TextField {...field} select label={index?"Destination currency":"Source currency"}>{refs.data?.currencies.map(x=><MenuItem key={x.code} value={x.code}>{x.code} — {x.name}</MenuItem>)}</TextField>}/>)}
    <Controller name="allowedPayoutMethods" control={control} render={({field})=><FormControl><InputLabel>Payout methods</InputLabel><Select multiple value={field.value} onChange={field.onChange} input={<OutlinedInput label="Payout methods"/>} renderValue={selected=>selected.join(", ")}>{refs.data?.payoutMethods.map(x=><MenuItem key={x.code} value={x.code}><Checkbox checked={field.value.includes(x.code)}/><ListItemText primary={x.name}/></MenuItem>)}</Select></FormControl>}/>
    {input("minimumAmount","Minimum amount")}{input("maximumAmount","Maximum amount")}{input("dailyCustomerLimit","Daily customer limit")}{input("monthlyCustomerLimit","Monthly customer limit")}
    {(["feePlanId","exchangeRatePlanId","complianceRuleSetId"] as const).map(name=><Controller key={name} name={name} control={control} render={({field})=>{const options=name==="feePlanId"?plans.data?.feePlans:name==="exchangeRatePlanId"?plans.data?.exchangeRatePlans:plans.data?.complianceRuleSets;return <TextField {...field} select label={name.replace("Id","").replace(/([A-Z])/g," $1")}>{options?.map(x=><MenuItem key={x.id} value={x.id}>{x.name}</MenuItem>)}</TextField>}}/>)}
    {input("effectiveFrom","Effective from",{type:"date",slotProps:{inputLabel:{shrink:true}}})}{input("effectiveTo","Effective to",{type:"date",slotProps:{inputLabel:{shrink:true}}})}
    </Box>{preview.data&&<Alert severity="info" sx={{mt:2}}>Estimated fee: {formatMoney(preview.data.fee,preview.data.sourceCurrencyCode)} · Estimated payout: {formatMoney(preview.data.destinationAmount,preview.data.destinationCurrencyCode)}. Final pricing is confirmed by the backend.</Alert>}
    {(create.error||preview.error)&&<Alert severity="error" sx={{mt:2}}>{normalizeApiError(create.error||preview.error).message}</Alert>}
    <Box sx={{display:"flex",justifyContent:"flex-end",gap:1,mt:3}}><Button disabled={!values.minimumAmount||!values.sourceCurrencyCode||!values.destinationCurrencyCode||preview.isPending} onClick={()=>preview.mutate()}>Preview pricing</Button><Button type="submit" variant="contained" disabled={formState.isSubmitting||create.isPending}>{create.isPending?"Creating…":"Create draft"}</Button></Box>
  </Box></CardContent></Card></Box>;
}
