import { Alert, Box, Button, CircularProgress, Typography } from "@mui/material";

export function ResourceState({loading,error,empty,retry}:{loading:boolean;error?:Error|null;empty?:boolean;retry?:()=>void}) {
  if(loading)return <Box sx={{py:8,textAlign:"center"}}><CircularProgress aria-label="Loading" /></Box>;
  if(error)return <Alert severity="error" action={retry&&<Button onClick={retry}>Retry</Button>}>{error.message}</Alert>;
  if(empty)return <Box sx={{py:8,textAlign:"center"}}><Typography variant="h6">No records found</Typography><Typography color="text.secondary">Adjust the current filters or create the first record.</Typography></Box>;
  return null;
}
