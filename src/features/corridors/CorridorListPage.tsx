import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Box, Button, Card, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { Can } from "../../auth/Can";
import { ResourceState } from "../../components/data-grid/ResourceState";
import { StatusChip } from "../../components/feedback/StatusChip";
import { geographyApi } from "../geography/api";
import { corridorApi } from "./api";

export function CorridorListPage(){
  const query=useQuery({queryKey:["corridors"],queryFn:corridorApi.list});const countries=useQuery({queryKey:["countries"],queryFn:()=>geographyApi.countries()});
  const name=(id:string)=>countries.data?.items.find(x=>x.id===id)?.name||"Unavailable";
  return <Box sx={{p:{xs:2,md:4}}}><Box sx={{display:"flex",justifyContent:"space-between",mb:3}}><Box><Typography component="h1" variant="h1">Remittance corridors</Typography><Typography color="text.secondary">Effective, versioned transfer configuration between active markets.</Typography></Box><Can permission="corridors.manage"><Button component={Link} to="/corridors/new" variant="contained" startIcon={<Plus size={16}/>}>Create corridor</Button></Can></Box><Card sx={{p:2}}><ResourceState loading={query.isLoading} error={query.error} empty={!query.data?.items.length}/>{query.data?.items.length?<Table><TableHead><TableRow><TableCell>Route</TableCell><TableCell>Currencies</TableCell><TableCell>Amount range</TableCell><TableCell>Effective</TableCell><TableCell>Status</TableCell><TableCell/></TableRow></TableHead><TableBody>{query.data.items.map(item=><TableRow key={item.id}><TableCell>{name(item.originCountryId)} → {name(item.destinationCountryId)}</TableCell><TableCell>{item.sourceCurrencyCode} → {item.destinationCurrencyCode}</TableCell><TableCell>{item.minimumAmount}–{item.maximumAmount}</TableCell><TableCell>{item.effectiveFrom}{item.effectiveTo?` to ${item.effectiveTo}`:" onward"}</TableCell><TableCell><StatusChip status={item.status}/></TableCell><TableCell><Button component={Link} to={`/corridors/${item.id}`}>View</Button></TableCell></TableRow>)}</TableBody></Table>:null}</Card></Box>;
}
