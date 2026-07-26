# HostelHub

<div align="center">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-404D59?style=for-the-badge" alt="Express.js" />
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
</div>

**HostelHub** is an enterprise-grade, multi-tenant hostel management platform engineered to digitize and streamline the administrative and operational workflows of modern student housing. It is a fully **deployed application** ready for production use. Developed on a robust **TypeScript**, **React**, and **Express** technology stack, HostelHub integrates students, administration, and support staff into a unified, high-performance ecosystem.

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation and Setup](#installation-and-setup)
- [Deployment](#deployment)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Future Updates](#future-updates)

## Features

### Multi-Tenant Architecture
- **Isolated Environments**: Supports the management of multiple distinct hostels on a single backend infrastructure.
- **Strict Data Governance**: Enforces rigid data siloing, ensuring administrators, workers, and students interact exclusively with data pertaining to their registered hostel.
- **Automated Provisioning**: Secure administrative registration automatically provisions dedicated workspaces and isolated instances for new hostels.

### Dynamic Mess Menu & Voting System
- **Student Engagement**: Empowers students to suggest new culinary items, review past meals, and securely cast votes on preferred menu selections.
- **Algorithmic Recommendations**: A proprietary backend computation engine analyzes active student votes, nutritional values, and pricing metrics to automatically propose the optimal weekly menu.
- **Real-Time Synchronization**: WebSocket integration ensures instantaneous, zero-latency broadcasting of menu publications and voting statistics.
- **Advanced Visual Analytics**: Integrated data visualization delivers comprehensive, date-wise trending of student satisfaction and cumulative ratings.

### Real-Time Issue Tracking & Resolution
- **Incident Reporting**: Facilitates seamless reporting of maintenance and facility issues by students, featuring priority and category tagging.
- **Dedicated Dashboards**: Specialized interfaces for maintenance staff to monitor assigned tickets, process status updates, and append resolution notes.
- **Administrative Oversight**: Provides administrators with comprehensive tools to filter, assign, and audit maintenance operations for maximum efficiency.

### Advanced Authentication & Security
- **Role-Based Access Control (RBAC)**: Enforces distinct authorization parameters for administrative, student, and worker access levels.
- **Frictionless Onboarding**: Enables passwordless initial authentication via dynamically generated QR codes and secure magic links.
- **Robust Security Posture**: Secured by JSON Web Tokens (JWT) with automated refresh rotation, bcrypt cryptographic hashing, strict Cross-Origin Resource Sharing (CORS) policies, Helmet.js header protection, and comprehensive Insecure Direct Object Reference (IDOR) mitigation.

## Tech Stack

### Backend
- **Node.js** & **Express.js**: RESTful API infrastructure.
- **TypeScript**: End-to-end strict type safety.
- **MongoDB** & **Mongoose ODM**: Scalable document database layer.
- **Socket.io**: Real-time bidirectional event-based communication.
- **JWT & Bcrypt**: Industry-standard security and authentication.

### Frontend
- **React 18**: Component-based user interface architecture.
- **TypeScript**: Typed structural integrity.
- **Vite**: High-performance module bundling.
- **Tailwind CSS v4**: Utility-first, responsive design system.
- **React Router v7**: Client-side routing logic.

---

## Installation and Setup

### Prerequisites & System Requirements
- **OS**: Windows, macOS, or Linux.
- **Node.js**: v18.x or higher.
- **npm**: v9.x or higher.
- **Database**: Active MongoDB instance (v6.0+ local or MongoDB Atlas).

### Clone the Repository
Clone the repository to your local environment:
```bash
git clone https://github.com/fo56/hostelHub.git
cd hostelHub
```

### Install Dependencies
Initialize dependencies across the stack:
```bash
cd backend && npm install
cd ../frontend && npm install
```

### Environment Configuration
Establish the backend environment variables in `backend/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/hostelHub
JWT_SECRET=enter-a-long-private-jwt-key-here
PORT=8000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

Establish the frontend environment variables in `frontend/.env`:
```env
VITE_API_URL=http://localhost:8000/api
VITE_WS_URL=http://localhost:5000
```

### Start the Servers
Initialize the development servers in separate terminal instances.

**Terminal 1 (Backend):**
```bash
cd backend && npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend && npm run dev
```

---

## Deployment

HostelHub is architected for immediate deployment across modern cloud infrastructure:

- **Frontend Integration**: Optimized for high-performance delivery via **Vercel** or **Netlify**.
- **Backend Application**: Configured for scalable deployment on platforms such as **Render** or **Railway**.
- **Database Layer**: Fully compatible with **MongoDB Atlas** for enterprise-grade managed database hosting.
- **In-Memory Datastore**: Designed to integrate with **Upstash** or **Redis Enterprise** for robust caching and WebSocket message brokering.

*Note: Ensure all cross-platform environment variables are correctly synchronized prior to production initialization.*

---

## Usage

### System Workflows

**1. Administrative Provisioning:**
- Access the application root and initialize a new organizational workspace.
- The system will immediately grant access to the centralized Administrative Dashboard.

**2. User Lifecycle Management:**
- Navigate to the User Management module to generate Student and Worker profiles.
- Distribute the generated cryptographic QR Codes or Magic Links to grant initial access, prompting users to establish private credentials.

**3. Menu Optimization Workflow:**
- Students utilize their dashboards to cast dietary preferences.
- Administrators review aggregate analytics and trigger the Menu Generation algorithm.
- Authorized menus are broadcasted system-wide via WebSocket events.

**4. Maintenance Resolution:**
- Students submit categorized maintenance requests.
- Administrators assign tickets to the appropriate workforce.
- Workers execute repairs and close tickets with appended operational notes.

---

## Project Structure

```text
hostelHub/
├── backend/                      # API Service layer
│   ├── src/
│   │   ├── config/              # Infrastructure configurations
│   │   ├── controllers/         # Request handling and business logic
│   │   ├── middlewares/         # Security and validation pipelines
│   │   ├── models/              # Data schema definitions
│   │   ├── routes/              # Endpoint mappings
│   │   ├── services/            # Algorithmic and external integrations
│   │   ├── server.ts            # Application bootstrap
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                     # Client Application layer
│   ├── src/
│   │   ├── assets/              # Static resources
│   │   ├── components/          # Modular interface elements
│   │   ├── contexts/            # Global state management
│   │   ├── hooks/               # Custom React integrations
│   │   ├── pages/               # Top-level view controllers
│   │   ├── App.tsx              # Application root
│   │   ├── main.tsx             # DOM entry point
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
└── README.md
```

---

## API Documentation

All secured endpoints enforce JSON Web Token validation via the standard authorization header: `Authorization: Bearer <token>`

### Authentication Service (`/api/auth`)
- `POST /register-admin` - Initializes a new administrative tenant.
- `POST /login-admin` - Administrative authentication vector.
- `POST /login-user` - Standard user authentication vector.
- `POST /login-qr` - Cryptographic QR token authentication.
- `POST /login-url` - Cryptographic Magic Link authentication.
- `POST /set-password` - Credential initialization process.
- `POST /refresh` - Issues new access tokens via valid refresh tokens.
- `POST /logout` - Terminates the active session.
- `GET /qr/:userId` - Generates a new authentication QR code.

### Identity Management (`/api/admin/users`)
- `POST /` - Provisions new user profiles.
- `GET /` - Retrieves the tenant user directory.
- `GET /:userId` - Retrieves a specific user profile.
- `PATCH /:userId/deactivate` - Suspends user access.
- `PATCH /:userId/reactivate` - Restores user access.
- `DELETE /:userId` - Permanently purges a user profile.
- `POST /:userId/qr-code` - Rotates the user's QR authentication token.
- `POST /:userId/login-token` - Rotates the user's Magic Link token.

### Incident Management (`/api/issues`)
- `POST /` - Registers a new incident ticket.
- `GET /my-issues` - Retrieves tickets originated by the authenticated user.
- `GET /assigned` - Retrieves tickets assigned to the authenticated worker.
- `GET /admin/all` - Retrieves the master incident ledger.
- `PATCH /:issueId/assign` - Delegates a ticket to a worker.
- `PATCH /:issueId/status` - Modifies the resolution state of a ticket.
- `DELETE /:issueId` - Purges an incident ticket.

### Culinary Management
- `POST /api/dishes` - Submits a new culinary item for review.
- `GET /api/admin/dishes` - Retrieves the master culinary catalog.
- `POST /api/admin/dishes` - Bypasses review and inserts a culinary item directly.
- `POST /api/admin/dishes/:id/approve` - Approves a suggested culinary item.
- `POST /api/admin/dishes/:id/reject` - Rejects a suggested culinary item.
- `PUT /api/admin/dishes/:id` - Mutates the properties of a culinary item.
- `DELETE /api/admin/dishes/:id` - Purges a culinary item from the catalog.

### Menu Operations & Analytics
- `GET /api/student/menu/today` - Retrieves the active daily menu.
- `GET /api/student/menu/current` - Retrieves the active weekly schedule.
- `GET /api/student/dishes/active` - Retrieves items available for algorithmic voting.
- `GET /api/menu-votes/votes` - Retrieves the authenticated user's current voting ledger.
- `POST /api/menu-votes/votes` - Mutates the user's voting ledger.
- `GET /api/admin/menu/voting/stats` - Retrieves real-time telemetry on active voters.
- `POST /api/admin/menu/generate` - Triggers the recommendation engine.
- `GET /api/admin/menu/preview` - Previews the generated algorithmic schedule.
- `POST /api/admin/menu/publish` - Commits the schedule and triggers system-wide broadcast.
- `POST /api/reviews/submit` - Appends a rating to a served item.
- `GET /api/admin/reviews/stats` - Retrieves aggregated satisfaction metrics.
- `GET /api/admin/dashboard` - Retrieves comprehensive system telemetry.

---

## Future Updates

Looking forward for more features.