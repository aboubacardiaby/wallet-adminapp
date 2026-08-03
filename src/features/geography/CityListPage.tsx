import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Box, Button, Card, MenuItem, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Can } from "../../auth/Can";
import { ResourceState } from "../../components/data-grid/ResourceState";
import { StatusChip } from "../../components/feedback/StatusChip";
import { geographyApi } from "./api";

export function CityListPage() {
  const route=useParams();const[countryId,setCountryId]=useState(route.countryId||"");const[search,setSearch]=useState("");
  const countries=useQuery({queryKey:["countries"],queryFn:()=>geographyApi.countries()});
  const query=useQuery({queryKey:["cities",{countryId,search}],queryFn:()=>geographyApi.cities({countryId,search})});
  return <Box sx={{p:{xs:2,md:4}}}><Box sx={{display:"flex",justifyContent:"space-between",mb:3}}><Box><Typography component="h1" variant="h1">Cities</Typography><Typography color="text.secondary">Service locations and payout capabilities.</Typography></Box><Can permission="cities.manage"><Button component={Link} to="/cities/new" variant="contained" startIcon={<Plus size={16}/>}>Create city</Button></Can></Box>
    <Card sx={{p:2}}><Box sx={{display:"grid",gridTemplateColumns:{xs:"1fr",md:"1fr 1fr"},gap:2,mb:2}}><TextField select label="Country" value={countryId} onChange={e=>setCountryId(e.target.value)}><MenuItem value="">All countries</MenuItem>{countries.data?.items.map(x=><MenuItem key={x.id} value={x.id}>{x.name}</MenuItem>)}</TextField><TextField label="Search city or code" value={search} onChange={e=>setSearch(e.target.value)}/></Box>
    <ResourceState loading={query.isLoading} error={query.error} empty={!query.data?.items.length}/>{query.data?.items.length?<Table><TableHead><TableRow><TableCell>City</TableCell><TableCell>Country</TableCell><TableCell>Timezone</TableCell><TableCell>Radius</TableCell><TableCell>Status</TableCell><TableCell/></TableRow></TableHead><TableBody>{query.data.items.map(city=><TableRow key={city.id}><TableCell>{city.name}<Typography variant="caption" display="block">{city.code}</Typography></TableCell><TableCell>{countries.data?.items.find(x=>x.id===city.countryId)?.name}</TableCell><TableCell>{city.timezone}</TableCell><TableCell>{city.serviceRadiusKm?`${city.serviceRadiusKm} km`:"—"}</TableCell><TableCell><StatusChip status={city.status}/></TableCell><TableCell><Button component={Link} to={`/cities/${city.id}`}>View</Button></TableCell></TableRow>)}</TableBody></Table>:null}</Card>
  </Box>;
}
