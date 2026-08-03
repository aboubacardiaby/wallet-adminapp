import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, Grid, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { Can } from "../../auth/Can";
import { normalizeApiError } from "../../api/errors";
import { ResourceState } from "../../components/data-grid/ResourceState";
import { StatusChip } from "../../components/feedback/StatusChip";
import { geographyApi } from "../geography/api";
import { corridorApi } from "./api";

export function CorridorDetailPage(){
  const{corridorId}=useParams();const client=useQueryClient();const[reason,setReason]=useState("");const[dialog,setDialog]=useState(false);
  const query=useQuery({queryKey:["corridor",corridorId],queryFn:()=>corridorApi.get(corridorId!)});const countries=useQuery({queryKey:["countries"],queryFn:()=>geographyApi.countries()});
  const refresh=async()=>{await client.invalidateQueries({queryKey:["corridor",corridorId]});await client.invalidateQueries({queryKey:["corridors"]})};
  const activate=useMutation({mutationFn:()=>corridorApi.activate(corridorId!),onSuccess:refresh});const suspend=useMutation({mutationFn:()=>corridorApi.suspend(corridorId!,reason),onSuccess:async()=>{setDialog(false);setReason("");await refresh()}});
  if(query.isLoading||query.error||!query.data)return <Box sx={{p:4}}><ResourceState loading={query.isLoading} error={query.error}/></Box>;
  const item=query.data;const country=(id:string)=>countries.data?.items.find(x=>x.id===id)?.name||id;const details=[["Route",`${country(item.originCountryId)} → ${country(item.destinationCountryId)}`],["Currencies",`${item.sourceCurrencyCode} → ${item.destinationCurrencyCode}`],["Amount range",`${item.minimumAmount}–${item.maximumAmount}`],["Daily limit",item.dailyCustomerLimit],["Monthly limit",item.monthlyCustomerLimit],["Effective from",item.effectiveFrom],["Payout methods",item.allowedPayoutMethods.join(", ")],["Version",String(item.version)]];
  return <Box sx={{p:{xs:2,md:4}}}><Box sx={{display:"flex",justifyContent:"space-between",alignItems:"center",mb:3}}><Box><Typography component="h1" variant="h1">Corridor details</Typography><Box sx={{mt:1}}><StatusChip status={item.status}/></Box></Box><Can permission="corridors.manage"><Box sx={{display:"flex",gap:1}}>{item.status==="DRAFT"&&<Button variant="contained" disabled={activate.isPending} onClick={()=>activate.mutate()}>Activate</Button>}{item.status==="ACTIVE"&&<Button color="error" variant="outlined" onClick={()=>setDialog(true)}>Suspend</Button>}</Box></Can></Box>
    {(activate.error||suspend.error)&&<Alert severity="error" sx={{mb:2}}>{normalizeApiError(activate.error||suspend.error).message}</Alert>}<Card><CardContent><Grid container spacing={3}>{details.map(([label,value])=><Grid key={label} size={{xs:12,sm:6,md:4}}><Typography variant="caption" color="text.secondary">{label}</Typography><Typography fontWeight={700}>{value}</Typography></Grid>)}</Grid></CardContent></Card>
    <Dialog open={dialog} onClose={()=>setDialog(false)}><DialogTitle>Suspend corridor?</DialogTitle><DialogContent><Alert severity="warning" sx={{mb:2}}>New transfers will be blocked; historical transactions remain unchanged.</Alert><TextField autoFocus fullWidth multiline minRows={3} label="Required reason" value={reason} onChange={e=>setReason(e.target.value)}/></DialogContent><DialogActions><Button onClick={()=>setDialog(false)}>Cancel</Button><Button color="error" disabled={!reason.trim()||suspend.isPending} onClick={()=>suspend.mutate()}>Suspend corridor</Button></DialogActions></Dialog>
  </Box>;
}
