🏨 HostelHub Backend API Documentation
🌐 BASE URL
http://localhost:8000/api

🔐 AUTHENTICATION
🔑 Tokens

Access Token → Required for all protected routes

Refresh Token → Used only to refresh access tokens

🔒 Authorization Header

All protected routes require:

Authorization: Bearer <accessToken>


⚠️ Never use refresh token for protected APIs

🔑 AUTH ROUTES (/auth)
Register Admin
POST /auth/register-admin


Body

{
  "hostelName": "Hostel 1",
  "adminName": "Hostel Admin",
  "adminEmail": "admin@hostel1.com",
  "adminPassword": "password123"
}

Login Admin
POST /auth/login-admin

Login User (Student / Worker)
POST /auth/login-user

Login via QR
POST /auth/login-qr


Body

{
  "qrToken": "qr-token"
}

Login via One-Time URL
POST /auth/login-url


🔒 Protected

First-Time User QR Login
GET /auth/qr/:userId


🔒 Protected

Set Password (First-Time Users)
POST /auth/set-password

Refresh Access Token
POST /auth/refresh


Body

{
  "refreshToken": "<refreshToken>"
}

Logout
POST /auth/logout


🔒 Protected

👤 USER IDENTITY
Get Current User
GET /api/users/me


🔒 Protected

Response

{
  "id": "...",
  "role": "ADMIN | STUDENT | WORKER",
  "hostelId": "...",
  "name": "User Name",
  "email": "user@hostel.com"
}

👑 ADMIN ROUTES

All admin routes require:

Authorization: Bearer <ADMIN_ACCESS_TOKEN>

👥 Admin – User Management (/api/admin/users)
Create User (Student / Worker)
POST /api/admin/users


Body

{
  "name": "User One",
  "email": "user1@hostel1.com",
  "role": "STUDENT",
  "roomNo": 301,
  "registrationNo": 20243270
}

Get All Users
GET /api/admin/users?role=STUDENT&status=active

Get Single User
GET /api/admin/users/:userId

Deactivate User
PATCH /api/admin/users/:userId/deactivate

Reactivate User
PATCH /api/admin/users/:userId/reactivate

Delete User
DELETE /api/admin/users/:userId

Regenerate QR Code
POST /api/admin/users/:userId/qr-code

Regenerate Login URL
POST /api/admin/users/:userId/login-token

🍽️ Admin – Dish Management (/api/admin/dishes)
Get Dishes (Under Review / Active)
GET /api/admin/dishes?status=UNDER_REVIEW

Approve Dish
POST /api/admin/dishes/:id/approve

Reject Dish
POST /api/admin/dishes/:id/reject

🗳️ Admin – Menu Voting & Menu Lifecycle (/api/admin/menu)
Open Voting Window
POST /api/admin/menu/voting/open


Body

{
  "week": 4,
  "durationInDays": 7
}

Close Voting Window
POST /api/admin/menu/voting/close

Get Voting Status
GET /api/admin/menu/voting/status

Generate Final Mess Menu
POST /api/admin/menu/generate

Preview Menu (Draft)
GET /api/admin/menu/preview

Publish Menu
POST /api/admin/menu/publish

⭐ Admin – View Reviews (Paginated)
GET /api/admin/reviews?page=1&limit=10


Optional Filters

mealType=Breakfast|Lunch|Dinner
date=YYYY-MM-DD
dishId=<dishId>


Response

{
  "reviews": [],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}

🎓 STUDENT ROUTES

All student routes require:

Authorization: Bearer <STUDENT_ACCESS_TOKEN>

🍽️ Student – Dish Suggestion
Suggest New Dish
POST /api/dishes/suggest


⏱️ Rate-limited: 3 suggestions / week

🗳️ Student – Menu Voting
Submit Votes
POST /api/menu-votes/vote


✔ One vote per week (idempotent)

📊 Student – Menu Access (/api/student/menu)
Get Current Menu
GET /api/student/menu/current

Get Menu by Week
GET /api/student/menu/:week

Get Today’s Served Dishes
GET /api/student/menu/today


Used for review creation.

Get Voting Status
GET /api/student/menu/voting/status

⭐ Student – Meal Reviews
Submit Review
POST /api/reviews


Body

{
  "dishId": "<dishId>",
  "mealType": "Lunch",
  "servedOn": "2025-02-01",
  "rating": 4,
  "comment": "Good taste",
  "images": ["https://image.url"]
}


✔ One review per dish per day
✔ Only for served dishes

📦 POSTMAN / CURL EXAMPLES
Example: Admin Get Reviews
curl -H "Authorization: Bearer <ADMIN_TOKEN>" \
http://localhost:8000/api/admin/reviews?page=1&limit=5

Example: Student Get Today’s Menu
curl -H "Authorization: Bearer <STUDENT_TOKEN>" \
http://localhost:8000/api/student/menu/today

Example: Student Submit Review
curl -X POST http://localhost:8000/api/reviews \
-H "Authorization: Bearer <STUDENT_TOKEN>" \
-H "Content-Type: application/json" \
-d '{
  "dishId": "65ab3f9c2e9b1a7d4e2c91f0",
  "mealType": "Dinner",
  "servedOn": "2025-02-01",
  "rating": 5,
  "comment": "Excellent!"
}'

🔐 SECURITY & DESIGN NOTES

Role-based access enforced server-side

Hostel-level isolation everywhere

Voting & reviews are idempotent

Pagination enabled for unbounded lists

Refresh tokens never used for protected routes