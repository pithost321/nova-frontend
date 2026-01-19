# CRM-NOVA

A comprehensive multi-role call center analytics dashboard built with React, TypeScript, and Spring Boot.

## 🚀 Quick Start

**For complete setup instructions, see [SETUP_GUIDE.md](SETUP_GUIDE.md)**

### Start the Application

1. **Start everything at once:**
   ```bash
   start-all.bat
   ```

2. **Or start individually:**
   ```bash
   # Backend (in one terminal)
   start-backend.bat
   
   # Frontend (in another terminal)  
   start-frontend.bat
   ```

3. **Open your browser:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080

## 📋 Prerequisites

- Java JDK 17+
- Node.js 18+
- Maven (or use included wrapper)
- MySQL Database (pre-configured)

## 🔑 Key Features

- ✅ Role-based dashboards (NOVA/HQ, Team, Agent)
- ✅ Real-time performance metrics
- ✅ JWT authentication
- ✅ AI-powered insights
- ✅ Responsive design
- ✅ Complete backend integration

## 📚 Documentation

- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Complete setup and configuration guide
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture documentation
- **[INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)** - Frontend-backend integration

## 🛠️ Tech Stack

### Frontend
- React 19
- TypeScript
- Vite
- Axios
- Recharts
- Tailwind CSS (via inline styles)

### Backend  
- Spring Boot 3
- Spring Security with JWT
- MySQL
- JPA/Hibernate

## 🔐 Authentication

Login with any email and select your role:
- **NOVA:** Full system access (HQ Dashboard)
- **TEAM:** Team management and metrics
- **AGENT:** Individual performance tracking

## 📡 API Integration

The frontend is fully integrated with the Spring Boot backend:
- Auto-reconnection on network issues
- JWT token management
- CORS properly configured
- Comprehensive error handling

## 🐛 Troubleshooting

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed troubleshooting steps.

Common issues:
- Port 8080 or 3000 already in use
- MySQL connection issues
- CORS errors
- Missing dependencies

## 📝 License

Copyright © 2025 Nova Development Team

---

**Ready to start?** See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed instructions.
