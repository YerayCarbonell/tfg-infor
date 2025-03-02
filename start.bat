@echo off
start "Backend" cmd /k "cd backend && npm start"
timeout /t 3 /nobreak >nul
start "Frontend" cmd /k "cd frontend && npx expo start && timeout /t 10 && echo w"
