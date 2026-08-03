import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Box, Button, Card, CardContent, Checkbox, FormControlLabel, MenuItem, TextField, Typography } from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { normalizeApiError } from "../../api/errors";
import { geographyApi } from "./api";
import { countrySchema, type CountryInput } from "./schemas";

const defaults:CountryInput={name:"",iso2Code:"",iso3Code:"",defaultCurrencyCode:"",timezone:"",phoneCountryCode:"",minimumCustomerAge:18,sendingEnabled:false,receivingEnabled:false,cashPickupEnabled:false,bankDepositEnabled:false,walletDepositEnabled:false,status:"DRAFT"};

export function CountryFormPage() {
  const {countryId}=useParams();const navigate=useNavigate();const client=useQueryClient();
  const references=useQuery({queryKey:["references"],queryFn:geographyApi.references});
  const existing=useQuery({queryKey:["country",countryId],queryFn:()=>geographyApi.country(countryId!),enabled:Boolean(countryId)});
  const {control,handleSubmit,reset,setError,formState}=useForm<CountryInput>({resolver:zodResolver(countrySchema),defaultValues:defaults,values:existing.data?{...existing.data}:undefined});
  const mutation=useMutation({mutationFn:(value:CountryInput)=>geographyApi.saveCountry(value,countryId),onSuccess:async country=>{await client.invalidateQueries({queryKey:["countries"]});await navigate(`/countries/${country.id}`)},onError:reason=>{const error=normalizeApiError(reason);Object.entries(error.fieldErrors).forEach(([field,messages])=>setError(field as keyof CountryInput,{message:messages[0]}))}});
  const field=(name:keyof CountryInput,label:string,props:Record<string,unknown>={})=><Controller name={name} control={control} render={({field,fieldState})=><TextField {...field} {...props} label={label} error={Boolean(fieldState.error)} helperText={fieldState.error?.message}/>}/>;
  return <Box sx={{p:{xs:2,md:4},maxWidth:1000}}><Typography component="h1" variant="h1">{countryId?"Edit country":"Create country"}</Typography><Typography color="text.secondary" sx={{mb:3}}>Country activation requires separate legal and compliance approval.</Typography>
    <Card><CardContent><Box component="form" onSubmit={handleSubmit(value=>mutation.mutate(value))}>
      <Box sx={{display:"grid",gridTemplateColumns:{xs:"1fr",md:"1fr 1fr"},gap:2}}>
        {field("name","Country name")}{field("phoneCountryCode","Telephone prefix")}
        {field("iso2Code","ISO 2 code",{inputProps:{maxLength:2}})}{field("iso3Code","ISO 3 code",{inputProps:{maxLength:3}})}
        <Controller name="defaultCurrencyCode" control={control} render={({field,fieldState})=><TextField {...field} select label="Default currency" error={Boolean(fieldState.error)} helperText={fieldState.error?.message}>{references.data?.currencies.map(x=><MenuItem key={x.code} value={x.code}>{x.code} — {x.name}</MenuItem>)}</TextField>}/>
        <Controller name="timezone" control={control} render={({field,fieldState})=><TextField {...field} select label="Timezone" error={Boolean(fieldState.error)} helperText={fieldState.error?.message}>{references.data?.timezones.map(x=><MenuItem key={x} value={x}>{x}</MenuItem>)}</TextField>}/>
        {field("minimumCustomerAge","Minimum customer age",{type:"number"})}
        <Controller name="status" control={control} render={({field})=><TextField {...field} select label="Status">{["DRAFT","ACTIVE","SUSPENDED","INACTIVE"].map(x=><MenuItem key={x} value={x}>{x}</MenuItem>)}</TextField>}/>
      </Box>
      <Typography variant="h2" sx={{mt:3}}>Enabled services</Typography><Box>{(["sendingEnabled","receivingEnabled","cashPickupEnabled","bankDepositEnabled","walletDepositEnabled"] as const).map(name=><Controller key={name} name={name} control={control} render={({field})=><FormControlLabel control={<Checkbox checked={field.value} onChange={e=>field.onChange(e.target.checked)}/>} label={name.replace("Enabled","").replace(/([A-Z])/g," $1")}/>}/>)}</Box>
      {mutation.error&&<Alert severity="error" sx={{mt:2}}>{normalizeApiError(mutation.error).message}</Alert>}
      <Box sx={{display:"flex",justifyContent:"flex-end",gap:1,mt:3}}><Button onClick={()=>countryId?reset():navigate("/countries")}>Cancel</Button><Button type="submit" variant="contained" disabled={formState.isSubmitting||mutation.isPending}>{mutation.isPending?"Saving…":"Save country"}</Button></Box>
    </Box></CardContent></Card>
  </Box>;
}
