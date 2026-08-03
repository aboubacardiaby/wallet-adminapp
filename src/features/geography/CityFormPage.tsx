import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Box, Button, Card, CardContent, Checkbox, FormControlLabel, MenuItem, TextField, Typography } from "@mui/material";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { normalizeApiError } from "../../api/errors";
import { geographyApi } from "./api";
import { citySchema, type CityInput } from "./schemas";

const defaults:CityInput={countryId:"",regionId:"",name:"",code:"",timezone:"",serviceRadiusKm:undefined,cashPickupEnabled:false,bankDepositEnabled:false,walletDepositEnabled:false,status:"ACTIVE"};

export function CityFormPage() {
  const {cityId}=useParams();const navigate=useNavigate();const client=useQueryClient();
  const countries=useQuery({queryKey:["countries"],queryFn:()=>geographyApi.countries()});const references=useQuery({queryKey:["references"],queryFn:geographyApi.references});
  const existing=useQuery({queryKey:["city",cityId],queryFn:()=>geographyApi.city(cityId!),enabled:Boolean(cityId)});
  const {control,handleSubmit,setError,formState}=useForm<CityInput>({resolver:zodResolver(citySchema),defaultValues:defaults,values:existing.data?{...existing.data}:undefined});
  const countryId=useWatch({control,name:"countryId"});const regions=useQuery({queryKey:["regions",countryId],queryFn:()=>geographyApi.regions(countryId),enabled:Boolean(countryId)});
  const mutation=useMutation({mutationFn:(value:CityInput)=>geographyApi.saveCity(value,cityId,existing.data?.version),onSuccess:async city=>{await client.invalidateQueries({queryKey:["cities"]});await navigate(`/cities/${city.id}`)},onError:reason=>{const error=normalizeApiError(reason);Object.entries(error.fieldErrors).forEach(([field,messages])=>setError(field as keyof CityInput,{message:messages[0]}))}});
  const input=(name:keyof CityInput,label:string,props:Record<string,unknown>={})=><Controller name={name} control={control} render={({field,fieldState})=><TextField {...field} value={field.value??""} {...props} label={label} error={Boolean(fieldState.error)} helperText={fieldState.error?.message}/>}/>;
  return <Box sx={{p:{xs:2,md:4},maxWidth:900}}><Typography component="h1" variant="h1">{cityId?"City details":"Create city"}</Typography><Typography color="text.secondary" sx={{mb:3}}>Referenced cities are deactivated rather than deleted.</Typography><Card><CardContent><Box component="form" onSubmit={handleSubmit(value=>mutation.mutate(value))}><Box sx={{display:"grid",gridTemplateColumns:{xs:"1fr",md:"1fr 1fr"},gap:2}}>
    <Controller name="countryId" control={control} render={({field,fieldState})=><TextField {...field} select label="Country" error={Boolean(fieldState.error)} helperText={fieldState.error?.message}>{countries.data?.items.map(x=><MenuItem key={x.id} value={x.id}>{x.name}</MenuItem>)}</TextField>}/>
    <Controller name="regionId" control={control} render={({field})=><TextField {...field} select label="Region (optional)"><MenuItem value="">No region</MenuItem>{regions.data?.items.map(x=><MenuItem key={x.id} value={x.id}>{x.name}</MenuItem>)}</TextField>}/>
    {input("name","City name")}{input("code","City code")}{input("serviceRadiusKm","Service radius (km)",{type:"number"})}
    <Controller name="timezone" control={control} render={({field})=><TextField {...field} select label="Timezone">{references.data?.timezones.map(x=><MenuItem key={x} value={x}>{x}</MenuItem>)}</TextField>}/>
    <Controller name="status" control={control} render={({field})=><TextField {...field} select label="Status"><MenuItem value="ACTIVE">ACTIVE</MenuItem><MenuItem value="INACTIVE">INACTIVE</MenuItem></TextField>}/>
    </Box><Box sx={{mt:2}}>{(["cashPickupEnabled","bankDepositEnabled","walletDepositEnabled"] as const).map(name=><Controller key={name} name={name} control={control} render={({field})=><FormControlLabel control={<Checkbox checked={field.value} onChange={e=>field.onChange(e.target.checked)}/>} label={name.replace("Enabled","").replace(/([A-Z])/g," $1")}/>}/>)}</Box>
    {mutation.error&&<Alert severity="error" sx={{mt:2}}>{normalizeApiError(mutation.error).message}{[409,412].includes(normalizeApiError(mutation.error).status)?" Reload before saving again.":""}</Alert>}
    <Box sx={{display:"flex",justifyContent:"flex-end",mt:3}}><Button type="submit" variant="contained" disabled={formState.isSubmitting||mutation.isPending}>{mutation.isPending?"Saving…":"Save city"}</Button></Box>
  </Box></CardContent></Card></Box>;
}
