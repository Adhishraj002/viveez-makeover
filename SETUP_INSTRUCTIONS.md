# How to Run the Admin Pages

## Prerequisites
1. Make sure you have Node.js installed
2. Make sure MongoDB Atlas is connected (or local MongoDB is running)
3. All dependencies should be installed

## Step 1: Install Dependencies (if not already done)

Open a terminal in the `backend` folder and run:
```bash
cd backend
npm install
```

## Step 2: Create Environment Variables

Create a `.env` file in the `backend` folder with the following variables:

```env
MONGO_URL=your_mongodb_atlas_connection_string
JWT_SECRET=your-secret-key-here-make-it-long-and-random
PORT=5000
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
OWNER_EMAIL=owner@example.com
```

**Important:** 
- Replace `your_mongodb_atlas_connection_string` with your actual MongoDB Atlas connection string
- Replace `your-secret-key-here-make-it-long-and-random` with a long random string (e.g., use a password generator)
- The JWT_SECRET is required for admin authentication to work

## Step 3: Start the Backend Server

Open a terminal in the `backend` folder and run:

**For development (with auto-restart):**
```bash
cd backend
npm run dev
```

**OR for production:**
```bash
cd backend
npm start
```

You should see:
```
✔ MongoDB Connected
✔ Backend running on port 5000
```

## Step 4: Access the Pages

Once the server is running, open your web browser and visit:

### 1. Main Website
- **URL:** `http://localhost:5000/`
- This is your main customer-facing website

### 2. Admin Setup Page (First Time Only)
- **URL:** `http://localhost:5000/setup`
- Use this page to create your first admin account
- Enter a username and password
- After successful setup, you'll be redirected to the login page

### 3. Admin Login Page
- **URL:** `http://localhost:5000/admin`
- Enter the username and password you created in the setup page
- After successful login, you'll be redirected to the dashboard

### 4. Admin Dashboard
- **URL:** `http://localhost:5000/dashboard`
- View all customer bookings/orders
- See statistics
- Search and filter bookings
- Export bookings to PDF
- Click any booking card to see full details

## Quick Start Checklist

- [ ] Install dependencies: `cd backend && npm install`
- [ ] Create `.env` file in `backend` folder with required variables
- [ ] Start server: `cd backend && npm run dev`
- [ ] Visit `http://localhost:5000/setup` to create admin account
- [ ] Visit `http://localhost:5000/admin` to login
- [ ] Access dashboard at `http://localhost:5000/dashboard`

## Troubleshooting

### "MongoDB Error"
- Check your `MONGO_URL` in the `.env` file
- Make sure MongoDB Atlas is accessible or local MongoDB is running

### "JWT_SECRET is not defined"
- Make sure you have `JWT_SECRET=...` in your `.env` file

### "Cannot GET /setup" or "Cannot GET /admin"
- Make sure the server is running
- Check that you're accessing `http://localhost:5000` (or the port specified in your `.env`)

### "Unauthorized" when accessing dashboard
- Make sure you logged in first at `/admin`
- The token is stored in browser localStorage
- Try logging out and logging in again

## Notes

- The admin setup page can only create ONE admin account. If an admin already exists, you'll get an error.
- Admin tokens are valid for 7 days
- All pages use the same beautiful color theme matching your main website
- The dashboard automatically refreshes data when you click the refresh button

