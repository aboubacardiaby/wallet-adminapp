import { Alert, Box, Card, CardContent, LinearProgress, Typography } from "@mui/material";
import { useAuth } from "../../auth/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import { transactionApi } from "../transactions/api";
import { formatMoney } from "../../utils/money";

export function DashboardPage() {
  const { user } = useAuth();
  const activity=useQuery({queryKey:["transactions","dashboard"],queryFn:()=>transactionApi.list({page:1,limit:5}),enabled:Boolean(user?.permissions.includes("transactions.view"))});
  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Typography component="h1" variant="h1">Operations dashboard</Typography>
      <Typography color="text.secondary" sx={{ mt: 1 }}>Authorized scope summary for {user?.displayName}.</Typography>
      <Card sx={{ mt: 3 }}><CardContent><Typography variant="h2">Recent transaction activity</Typography>{activity.isLoading&&<LinearProgress sx={{mt:2}}/>}{activity.data?.transactions.map(tx=><Box key={tx.id} sx={{display:"flex",justifyContent:"space-between",py:1.5,borderBottom:1,borderColor:"divider"}}><Box><Typography fontWeight={700}>{tx.transaction_ref}</Typography><Typography variant="caption" color="text.secondary">{tx.type} · {tx.status}</Typography></Box><Typography fontWeight={700}>{formatMoney(String(tx.amount),tx.currency)}</Typography></Box>)}{activity.data && activity.data.transactions.length===0 && <Typography color="text.secondary" sx={{mt:2}}>No recent transactions.</Typography>}{activity.error&&<Alert severity="error" sx={{mt:2}}>Transaction activity is unavailable.</Alert>}</CardContent></Card>
    </Box>
  );
}
