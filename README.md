# HostelHub - Hostel Management System

A comprehensive hostel management platform built with TypeScript, React, and Express, designed to streamline hostel operations including mess menus, issue tracking, and user management.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)

## ✨ Features

- **User Management**: Role-based access control (Admin, Worker, Student)
- **Authentication**: JWT-based secure authentication
- **Mess Menu Management**: Vote on dishes, manage weekly menus
- **Issue Tracking**: Report and assign maintenance issues
- **Activity Logging**: Track all user actions for audit purposes
- **Admin Dashboard**: Comprehensive admin panel for system management
- **Real-time Updates**: Activity logs and notifications

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **MongoDB** for data persistence
- **JWT** for authentication
- **Mongoose** for ODM (Object Document Mapper)

### Frontend
- **React 19** with TypeScript
- **Vite** for fast bundling
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API calls

## 📦 Prerequisites

Before you begin, ensure you have installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (v9 or higher) - Comes with Node.js
- **MongoDB** - Either:
  - Local MongoDB installation - [Download](https://www.mongodb.com/try/download/community)
  - MongoDB Atlas account (cloud) - [Sign Up Free](https://www.mongodb.com/cloud/atlas)

### Verify Installation

```bash
node --version    # Should be v18+
npm --version     # Should be v9+
```

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd hostelHub
```

### 2. Install Dependencies

Install dependencies for both backend and frontend:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Return to root directory
cd ..
```

Or use the automated setup script (if available):

```bash
./setup.sh  # On Linux/macOS
.\setup.ps1 # On Windows
```

## ⚙️ Configuration

### Backend Configuration

1. Create a `.env` file in the `backend/` directory:

```bash
cp backend/.env.example backend/.env
```

2. Edit `backend/.env` with your settings:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@your-cluster.mongodb.net/hostelHub?retryWrites=true&w=majority

# JWT Secret (use a strong random string in production)
JWT_SECRET=your_very_secret_key_change_this_in_production_123!@#

# Server Port
PORT=8000

# Environment
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

#### MongoDB Setup

**Option A: Using MongoDB Atlas (Recommended)**
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Create a database user (Database Access)
4. Get your connection string and add it to `.env` as `MONGODB_URI`
5. Update your IP address in Network Access

**Option B: Local MongoDB**
1. Install MongoDB Community Edition
2. Start MongoDB service
3. Use connection string: `mongodb://localhost:27017/hostelHub`

### Frontend Configuration

1. Create a `.env` file in the `frontend/` directory:

```bash
cp frontend/.env.example frontend/.env
```

2. Edit `frontend/.env` with your settings:

```env
VITE_API_URL=http://localhost:8000/api
VITE_DEBUG=false
```

## 🎯 Running the Application

### Development Mode

**Terminal 1 - Start Backend Server:**

```bash
cd backend
npm run dev
```

Expected output:
```
Server running on port 8000
MongoDB connected to hostelHub
```

**Terminal 2 - Start Frontend Dev Server:**

```bash
cd frontend
npm run dev
```

Expected output:
```
  VITE v5.0.0  ready in 123 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

3. Open your browser and navigate to `http://localhost:5173`

### Production Build

**Build Frontend:**

```bash
cd frontend
npm run build
```

**Build Backend:**

```bash
cd backend
npm run build
```

## 📂 Project Structure

```
hostelHub/
├── backend/                      # Express.js backend
│   ├── src/
│   │   ├── server.ts            # Server entry point
│   │   ├── config/
│   │   │   └── db.ts            # Database connection
│   │   ├── models/              # Mongoose schemas
│   │   │   ├── User.ts
│   │   │   ├── Hostel.ts
│   │   │   ├── Dish.ts
│   │   │   ├── MenuVote.ts
│   │   │   ├── Issue.ts
│   │   │   └── ActivityLog.ts
│   │   ├── controllers/         # Business logic
│   │   ├── services/            # Reusable services
│   │   ├── routes/              # API routes
│   │   ├── middleware/          # Custom middleware
│   │   ├── types/               # TypeScript types
│   │   └── utils/               # Utility functions
│   ├── .env.example             # Environment template
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                     # React + Vite frontend
│   ├── src/
│   │   ├── main.tsx             # Entry point
│   │   ├── App.tsx              # Root component
│   │   ├── app/
│   │   │   └── router.tsx       # React Router configuration
│   │   ├── pages/               # Page components
│   │   │   ├── login/
│   │   │   ├── student/
│   │   │   ├── admin/
│   │   │   └── worker/
│   │   ├── components/          # Reusable components
│   │   ├── hooks/               # Custom hooks
│   │   │   └── useApi.ts        # API integration hook
│   │   ├── services/            # Services
│   │   │   └── authService.ts   # Authentication service
│   │   ├── types/               # TypeScript types
│   │   ├── utils/               # Utility functions
│   │   └── store/               # State management
│   ├── .env.example             # Environment template
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── .gitignore
└── README.md
```

## 🔌 API Documentation

### Base URL
```
http://localhost:8000/api
```

### Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### Endpoints

#### Users
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user
- `GET /users` - Get all users (Admin only)

#### Mess Menu
- `GET /menu` - Get current menu
- `POST /menu` - Create menu (Admin only)
- `PUT /menu/:id` - Update menu (Admin only)
- `DELETE /menu/:id` - Delete menu (Admin only)

#### Dishes & Voting
- `GET /dishes` - Get all dishes
- `POST /dishes` - Create dish (Admin only)
- `POST /menu/vote` - Vote on dish

#### Issues
- `GET /issues` - Get issues (filtered by role)
- `POST /issues` - Report new issue
- `PUT /issues/:id` - Update issue status (Worker/Admin)
- `DELETE /issues/:id` - Delete issue (Admin only)

#### Activity Log
- `GET /activity-logs` - Get activity logs (Admin only)

## 🐛 Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Ensure MongoDB is running. Start the MongoDB service or check MongoDB Atlas connection string.

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::8000
```
**Solution:** Change the PORT in `.env` or kill the process using port 8000

### CORS Error
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution:** Ensure `FRONTEND_URL` in backend `.env` matches your frontend URL

### Module Not Found Errors
```
Error: Cannot find module 'express'
```
**Solution:** Run `npm install` in the respective directory (backend or frontend)

## 🔐 Security Recommendations

1. **Never commit `.env` files** - Use `.env.example` as a template
2. **Change default JWT_SECRET** - Use a strong random string in production
3. **Enable HTTPS** in production
4. **Set strong MongoDB passwords** - Use at least 16 characters
5. **Regular updates** - Keep dependencies updated with `npm audit fix`
6. **Input validation** - Always validate and sanitize user inputs

## 📝 Environment Variables Checklist

### Backend
- [ ] `MONGODB_URI` - MongoDB connection string
- [ ] `JWT_SECRET` - Secure random string
- [ ] `PORT` - Server port (default: 8000)
- [ ] `NODE_ENV` - development/production
- [ ] `FRONTEND_URL` - Frontend URL for CORS

### Frontend
- [ ] `VITE_API_URL` - Backend API URL

## 🤝 Contributing

1. Create a new feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -m 'Add your feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📧 Support

For issues and questions, please create an issue on the GitHub repository.

---

**Last Updated:** December 2025