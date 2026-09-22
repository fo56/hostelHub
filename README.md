# HostelHub

<div align="center">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-404D59?style=for-the-badge" alt="Express.js" />
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
</div>

**HostelHub** is a comprehensive, enterprise-grade multi-tenant hostel management platform. Engineered to digitize and streamline the administrative and operational workflows of modern student housing, it provides a centralized system for mess menu optimization, facility maintenance, and seamless student engagement.

## Key Features

### 1. Intelligent Menu Optimization
- **Algorithmic Generation**: Utilizes an advanced Mixed-Integer Linear Programming (MILP) solver to automatically generate weekly menus. It ensures optimal variety, respects dietary gap spacing, and balances nutritional and pricing scores.
- **Dynamic Voting System**: Empowers students to cast votes on preferred dishes, directly influencing the automated menu generation process.

### 2. Multi-Tenant Architecture
- **Strict Data Siloing**: Securely isolates data across different hostels within the same backend infrastructure.
- **Role-Based Access Control (RBAC)**: Enforces precise access levels for administrators, support staff, and students, guaranteeing data integrity and privacy.

### 3. Streamlined Maintenance Operations
- **Incident Reporting**: Allows students to submit categorized facility issues seamlessly.
- **Resolution Tracking**: Provides administrators and workers with dedicated tools to assign, monitor, and resolve maintenance tickets efficiently.

### 4. Advanced Security & Authentication
- **Robust JWT Implementation**: Ensures session security with automated refresh token rotation and comprehensive cryptographic hashing.

---

## Installation and Setup

### Prerequisites
- Node.js (v18.x or higher)
- Active MongoDB instance (v6.0+ local or MongoDB Atlas)

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/fo56/hostelHub.git
   cd hostelHub
   ```

2. **Install dependencies:**
   Open two terminals, one for the frontend and one for the backend.
   ```bash
   # Terminal 1 (Backend)
   cd backend && npm install
   
   # Terminal 2 (Frontend)
   cd frontend && npm install
   ```

3. **Configure Environment Variables:**
   We have provided `.env.example` files in both the frontend and backend directories. 
   
   Copy `.env.example` to `.env` in the `backend` directory:
   ```bash
   cp backend/.env.example backend/.env
   ```
   **Backend `.env` configuration:**
   ```env
   MONGODB_URI=mongodb://localhost:27017/hostelHub
   JWT_SECRET=your_secure_jwt_secret_key
   PORT=8000
   FRONTEND_URL=http://localhost:5173
   GEMINI_API_KEY=your_gemini_api_key
   ```
   *(Note: Ensure you put your valid MongoDB URI and Gemini API key here)*

   Copy `.env.example` to `.env` in the `frontend` directory:
   ```bash
   cp frontend/.env.example frontend/.env
   ```
   **Frontend `.env` configuration:**
   ```env
   VITE_API_URL=http://localhost:8000/api
   VITE_APP_NAME=HostelHub
   VITE_APP_ENVIRONMENT=development
   ```

4. **Seed the Database (Optional but Recommended):**
   To easily generate initial admin and student accounts, you can seed the database.
   ```bash
   # In the backend directory
   npm run seed
   ```

5. **Start the application:**
   In Terminal 1 (Backend):
   ```bash
   npm run dev
   ```
   In Terminal 2 (Frontend):
   ```bash
   npm run dev
   ```

The application will now be running. The frontend operates on `http://localhost:5173` and the backend operates on `http://localhost:8000`.

---

## Technical Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS v4, React Router v7, Lucide React (Icons), React Hot Toast (Notifications).
- **Backend**: Node.js, Express.js, TypeScript, jsonwebtoken.
- **Database**: MongoDB & Mongoose ODM.
- **Algorithms**: javascript-lp-solver (MILP constraint engine), json-logic-js.

## System Architecture Principles
- **Single Responsibility Principle:** Code is highly modularized into logical layers: `controllers`, `services`, `middlewares`, and `models`.
- **Centralized Error Handling:** Global error catching safely parses Duplicate Key errors and Validation failures centrally.

## API Documentation
The platform utilizes a secure REST API architecture. All protected routes require a valid JWT via the `Authorization: Bearer <token>` header. Comprehensive routing logic is maintained within the `backend/src/routes` directory.