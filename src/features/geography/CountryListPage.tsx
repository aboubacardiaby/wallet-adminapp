import { Plus, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Box, Button, Card, FormControl, InputAdornment, InputLabel, MenuItem, Pagination, Select, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Can } from "../../auth/Can";
import { ResourceState } from "../../components/data-grid/ResourceState";
import { StatusChip } from "../../components/feedback/StatusChip";
import { geographyApi } from "./api";

export function CountryListPage() {
  const [search,setSearch]=useState("");const[status,setStatus]=useState("");const[currency,setCurrency]=useState("");const[page,setPage]=useState(1);
  const references=useQuery({queryKey:["references"],queryFn:geographyApi.references});
  const query=useQuery({queryKey:["countries",{search,status,currency,page}],queryFn:()=>geographyApi.countries({search,status,currency,page})});
  return <Box sx={{p:{xs:2,md:4}}}>
    <Box sx={{display:"flex",justifyContent:"space-between",alignItems:"center",mb:3}}><Box><Typography component="h1" variant="h1">Countries</Typography><Typography color="text.secondary">Configure authorized remittance markets and services.</Typography></Box><Can permission="countries.manage"><Button component={Link} to="/countries/new" variant="contained" startIcon={<Plus size={16}/>}>Create country</Button></Can></Box>
    <Card sx={{p:2}}>
      <Box sx={{display:"grid",gridTemplateColumns:{xs:"1fr",md:"2fr 1fr 1fr"},gap:2,mb:2}}>
        <TextField label="Search countries" value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} slotProps={{input:{startAdornment:<InputAdornment position="start"><Search size={16}/></InputAdornment>}}}/>
        <FormControl><InputLabel>Status</InputLabel><Select label="Status" value={status} onChange={e=>setStatus(e.target.value)}><MenuItem value="">All statuses</MenuItem>{["DRAFT","ACTIVE","SUSPENDED","INACTIVE"].map(x=><MenuItem key={x} value={x}>{x}</MenuItem>)}</Select></FormControl>
        <FormControl><InputLabel>Currency</InputLabel><Select label="Currency" value={currency} onChange={e=>setCurrency(e.target.value)}><MenuItem value="">All currencies</MenuItem>{references.data?.currencies.map(x=><MenuItem key={x.code} value={x.code}>{x.code} — {x.name}</MenuItem>)}</Select></FormControl>
      </Box>
      <ResourceState loading={query.isLoading} error={query.error} empty={!query.data?.items.length} retry={()=>query.refetch()} />
      {query.data?.items.length ? <><Table><TableHead><TableRow><TableCell>Country</TableCell><TableCell>Currency</TableCell><TableCell>Timezone</TableCell><TableCell>Services</TableCell><TableCell>Status</TableCell><TableCell/></TableRow></TableHead><TableBody>{query.data.items.map(country=><TableRow key={country.id} hover><TableCell><b>{country.name}</b><br/><Typography variant="caption">{country.iso2Code} / {country.iso3Code}</Typography></TableCell><TableCell>{country.defaultCurrencyCode}</TableCell><TableCell>{country.timezone}</TableCell><TableCell>{[country.sendingEnabled&&"Send",country.receivingEnabled&&"Receive"].filter(Boolean).join(" · ")}</TableCell><TableCell><StatusChip status={country.status}/></TableCell><TableCell><Button component={Link} to={`/countries/${country.id}`}>View</Button></TableCell></TableRow>)}</TableBody></Table><Pagination sx={{mt:2,display:"flex",justifyContent:"flex-end"}} count={query.data.totalPages||1} page={page} onChange={(_,value)=>setPage(value)}/></>:null}
    </Card>
  </Box>;
}
