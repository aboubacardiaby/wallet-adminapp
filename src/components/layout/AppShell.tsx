import { LogOut, Menu as MenuIcon } from "lucide-react";
import {
  AppBar, Avatar, Box, Divider, Drawer, IconButton, List, ListItemButton,
  ListItemIcon, ListItemText, Toolbar, Tooltip, Typography, useMediaQuery,
} from "@mui/material";
import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { hasPermission } from "../../auth/permissions";
import { env } from "../../config/env";
import { navigation } from "./navigation";

const drawerWidth = 272;

export function AppShell() {
  const compact = useMediaQuery("(max-width:900px)");
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const go = (path: string) => { void navigate(path); setOpen(false); };

  const drawer = (
    <Box sx={{ bgcolor: "#102a26", color: "white", height: "100%", display: "flex", flexDirection: "column" }}>
      <Toolbar sx={{ gap: 1.5 }}>
        <Avatar sx={{ bgcolor: "secondary.main", width: 36, height: 36 }}>R</Avatar>
        <Box><Typography sx={{ fontWeight: 800, fontSize: 14 }}>REMITTANCE</Typography><Typography sx={{ fontSize: 10, color: "#a8beb8" }}>ADMINISTRATION</Typography></Box>
      </Toolbar>
      <Divider sx={{ borderColor: "#28443f" }} />
      <Box component="nav" aria-label="Main navigation" sx={{ overflowY: "auto", px: 1.5, py: 1, flex: 1 }}>
        {navigation.map((group) => {
          const items = group.items.filter((item) => user && hasPermission(user.permissions, item.permission));
          if (!items.length) return null;
          return <Box key={group.label} sx={{ mb: 1.5 }}>
            <Typography sx={{ px: 2, py: 1, fontSize: 10, fontWeight: 800, color: "#89a19b", letterSpacing: 1 }}>{group.label.toUpperCase()}</Typography>
            <List disablePadding>{items.map(({ label, path, icon: Icon }) => (
              <ListItemButton key={label} selected={location.pathname === path.split("?")[0]} onClick={() => go(path)} sx={{ borderRadius: 1.5, mb: .25, "&.Mui-selected": { bgcolor: "#1c4a42" } }}>
                <ListItemIcon sx={{ minWidth: 36, color: "inherit" }}><Icon fontSize="small" /></ListItemIcon>
                <ListItemText primary={label} slotProps={{ primary: { sx: { fontSize: 13, fontWeight: 600 } } }} />
              </ListItemButton>
            ))}</List>
          </Box>;
        })}
      </Box>
      <Divider sx={{ borderColor: "#28443f" }} />
      <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
        <Avatar sx={{ width: 34, height: 34 }}>{user?.displayName.slice(0, 1)}</Avatar>
        <Box sx={{ minWidth: 0, flex: 1 }}><Typography noWrap sx={{ fontSize: 12, fontWeight: 700 }}>{user?.displayName}</Typography><Typography noWrap sx={{ fontSize: 10, color: "#a8beb8" }}>{user?.role.replaceAll("_", " ")}</Typography></Box>
        <Tooltip title="Sign out"><IconButton color="inherit" aria-label="Sign out" onClick={async () => { await logout(); await navigate("/login"); }}><LogOut size={18} /></IconButton></Tooltip>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="fixed" color="inherit" elevation={0} sx={{ ml: compact ? 0 : `${drawerWidth}px`, width: compact ? "100%" : `calc(100% - ${drawerWidth}px)`, borderBottom: 1, borderColor: "divider" }}>
        <Toolbar>{compact && <IconButton edge="start" aria-label="Open navigation" onClick={() => setOpen(true)}><MenuIcon /></IconButton>}<Typography sx={{ fontWeight: 700, flex: 1 }}>{env?.appName}</Typography><Typography variant="caption" color="text.secondary">Secure administration</Typography></Toolbar>
      </AppBar>
      <Drawer variant={compact ? "temporary" : "permanent"} open={!compact || open} onClose={() => setOpen(false)} ModalProps={{ keepMounted: true }} sx={{ "& .MuiDrawer-paper": { width: drawerWidth, border: 0 } }}>{drawer}</Drawer>
      <Box component="main" sx={{ ml: compact ? 0 : `${drawerWidth}px`, pt: 8, minHeight: "100vh" }}><Outlet /></Box>
    </Box>
  );
}
