import { useQuery } from "@tanstack/react-query";
import { Box, Card, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { useParams } from "react-router-dom";
import { ResourceState } from "../../components/data-grid/ResourceState";
import { StatusChip } from "../../components/feedback/StatusChip";
import { geographyApi } from "./api";

export function RegionListPage() {
  const {countryId}=useParams();const countries=useQuery({queryKey:["countries"],queryFn:()=>geographyApi.countries()});
  const query=useQuery({queryKey:["regions",countryId],queryFn:()=>geographyApi.regions(countryId)});
  const country=countries.data?.items.find(x=>x.id===countryId);
  return <Box sx={{p:{xs:2,md:4}}}><Typography component="h1" variant="h1">Regions{country?` in ${country.name}`:""}</Typography><Typography color="text.secondary" sx={{mb:3}}>Administrative subdivisions supplied by the geography API.</Typography><Card sx={{p:2}}><ResourceState loading={query.isLoading} error={query.error} empty={!query.data?.items.length}/>{query.data?.items.length?<Table><TableHead><TableRow><TableCell>Region</TableCell><TableCell>Code</TableCell><TableCell>Country</TableCell><TableCell>Status</TableCell></TableRow></TableHead><TableBody>{query.data.items.map(region=><TableRow key={region.id}><TableCell>{region.name}</TableCell><TableCell>{region.code}</TableCell><TableCell>{countries.data?.items.find(x=>x.id===region.countryId)?.name}</TableCell><TableCell><StatusChip status={region.status}/></TableCell></TableRow>)}</TableBody></Table>:null}</Card></Box>;
}
