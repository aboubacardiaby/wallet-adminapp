import { useQuery } from "@tanstack/react-query";
import { Alert, Box, Button, Card, CardContent, Divider, Grid, Tab, Tabs, Typography } from "@mui/material";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Can } from "../../auth/Can";
import { ResourceState } from "../../components/data-grid/ResourceState";
import { StatusChip } from "../../components/feedback/StatusChip";
import { geographyApi } from "./api";

const tabs=["Overview","Regions and cities","Identification requirements","Transaction limits","Payout methods","Compliance configuration","Holidays","Audit history"];

export function CountryDetailPage() {
  const {countryId}=useParams();const[params,setParams]=useSearchParams();const tab=Number(params.get("tab")||0);
  const query=useQuery({queryKey:["country",countryId],queryFn:()=>geographyApi.country(countryId!)});
  if(query.isLoading||query.error||!query.data)return <Box sx={{p:4}}><ResourceState loading={query.isLoading} error={query.error}/></Box>;
  const country=query.data;const items=[["ISO codes",`${country.iso2Code} / ${country.iso3Code}`],["Currency",country.defaultCurrencyCode],["Timezone",country.timezone],["Phone prefix",country.phoneCountryCode],["Minimum age",String(country.minimumCustomerAge)],["Last updated",new Date(country.updatedAt).toLocaleString()]];
  return <Box sx={{p:{xs:2,md:4}}}><Box sx={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><Box><Typography component="h1" variant="h1">{country.name}</Typography><Box sx={{mt:1}}><StatusChip status={country.status}/></Box></Box><Can permission="countries.manage"><Button component={Link} to={`/countries/${country.id}/edit`} variant="contained">Edit country</Button></Can></Box>
    <Alert severity="warning" sx={{my:3}}>Activation requires documented legal and compliance approval. UI configuration is not regulatory authorization.</Alert>
    <Card><Tabs value={tab} onChange={(_,value)=>setParams({tab:String(value)})} variant="scrollable" scrollButtons="auto">{tabs.map(x=><Tab key={x} label={x}/>)}</Tabs><Divider/><CardContent>
      {tab===0?<Grid container spacing={2}>{items.map(([label,value])=><Grid key={label} size={{xs:12,sm:6,md:4}}><Typography variant="caption" color="text.secondary">{label}</Typography><Typography fontWeight={700}>{value}</Typography></Grid>)}</Grid>:tab===1?<Box><Typography variant="h2">Geographic structure</Typography><Button component={Link} to={`/countries/${country.id}/regions`}>View regions</Button><Button component={Link} to={`/countries/${country.id}/cities`}>View cities</Button></Box>:<Alert severity="info">This configuration tab is scheduled with its associated domain workflow.</Alert>}
    </CardContent></Card>
  </Box>;
}
