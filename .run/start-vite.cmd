@echo off
cd /d C:\projects\repos\adminweb
"C:\Program Files\nodejs\node.exe" "C:\projects\repos\adminweb\node_modules\vite\bin\vite.js" --host localhost --port 5173 > "C:\projects\repos\adminweb\.run\vite.log" 2>&1
