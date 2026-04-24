# 🚀 Quick Start Guide — Vidya Jyothi School Management System

## ⚡ FASTEST WAY (Windows)

### Step 1 — Fix SWC Error & Setup Everything:
```
Right-click setup_windows.ps1 → Run with PowerShell
```

### Step 2 — Start Backend:
```
Double-click: backend/START_BACKEND.bat
```

### Step 3 — Start Frontend (new window):
```
Double-click: frontend/START_FRONTEND.bat
```

### Step 4 — Open Browser:
```
http://localhost:3000
```

---

## 🔧 Manual Setup (VS Code Terminal)

### Fix the SWC Error First:
```powershell
# Allow scripts to run
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Go to frontend folder
cd frontend

# Delete old node_modules (THIS FIXES THE SWC ERROR)
Remove-Item -Recurse -Force node_modules

# Clear npm cache
npm cache clean --force

# Fresh install
npm install --legacy-peer-deps
```

### Terminal 1 — Backend:
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install flask PyJWT werkzeug scikit-learn numpy pandas joblib
python app.py
```

### Terminal 2 — Frontend:
```powershell
cd frontend
npm run dev
```

---

## 🔑 Login Credentials

| Role    | Username              | Password    |
|---------|-----------------------|-------------|
| Admin   | vijayalakshmi.iyer    | admin123    |
| Admin   | raghavan.sub          | admin123    |
| Teacher | lakshmi_narayanan     | teacher123  |
| Student | student0001           | student123  |
| Parent  | parent0001            | parent123   |

---

## ❗ Common Errors & Fixes

### Error: "next-swc.win32-x64-msvc.node is not a valid Win32 application"
**Fix:**
```powershell
cd frontend
Remove-Item -Recurse -Force node_modules
npm cache clean --force
npm install --legacy-peer-deps
npm run dev
```

### Error: "Activate.ps1 cannot be loaded"
**Fix:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Error: "Port 5000 already in use"
**Fix:**
```powershell
netstat -ano | findstr :5000
taskkill /PID <number> /F
```

### Error: "Port 3000 already in use"
**Fix:**
```powershell
npx next dev -p 3001
# Then open http://localhost:3001
```

### Error: "pip not recognized"
**Fix:**
```powershell
python -m pip install flask PyJWT werkzeug
```

---

## ✅ System Requirements
- Python 3.10 or higher
- Node.js 18 or higher (LTS recommended)
- Windows 10/11 (64-bit)
- 4GB RAM minimum
- Google Chrome / Firefox / Edge browser
