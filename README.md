# Wiles and Rues Ecommerce Project

A full-stack MERN ecommerce application with a React storefront, user dashboard, admin dashboard, product management, blogs, reviews, policies, contact handling, image uploads, and online payments.

## Features

- Product browsing, search, category pages, and product details
- Shopping cart and checkout flow
- Stripe payment integration
- User authentication with JWT, Google login support, and email password resets
- User dashboard for orders, payments, reviews, and profile management
- Admin dashboard for products, users, orders, blogs, policies, and statistics
- Product image uploads with Cloudinary
- Blog and policy management
- Contact form support
- MongoDB data persistence with Mongoose
- Stripe 

## Tech Stack

**Client**

- React 19
- Vite
- React Router
- Redux Toolkit and Redux Persist
- Tailwind CSS
- Chart.js
- Stripe client SDK

**Server**

- Node.js
- Express
- MongoDB and Mongoose
- JWT authentication
- Joi validation
- Multer and Cloudinary
- Stripe

## Project Structure

```text
.
+-- client/          # React + Vite frontend
|   +-- src/
|   +-- public/
|   +-- package.json
+-- server/          # Express API backend
|   +-- controllers/
|   +-- middlewares/
|   +-- models/
|   +-- routes/
|   +-- utils/
|   +-- validation/
|   +-- server.js
+-- README.md
```

## Getting Started

### Prerequisites

- Node.js
- npm
- MongoDB database
- Stripe account for Stripe payments
- Cloudinary account for image uploads

### 1. Clone the Repository

```bash
git clone <repository-url>
cd "mern stack project"
```

### 2. Install Dependencies

From the repository root:

```bash
npm run install:all
```

Or install each app separately:

Install frontend dependencies:

```bash
cd client
npm install
```

Install backend dependencies:

```bash
cd ../server
npm install
```

### 3. Configure Environment Variables

Copy `server/.env.example` to `server/.env` and fill in real values:

```env
NODE_ENV=development
DB_URL=your_mongodb_connection_string
PORT=5000
JWT_SECRET=your_jwt_secret
JWT_EXPIRES=7d
CLIENT_URL=http://localhost:5173
CLIENT_URLS=http://localhost:5173
CORS_ORIGINS=
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax
STRIPE_SECRET_KEY=your_stripe_secret_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
RESEND_API_KEY=your_resend_api_key
CONTACT_TO_EMAIL=your_contact_receiver_email
CONTACT_FROM_EMAIL=your_verified_sender_email
GOOGLE_CLIENT_ID=your_google_client_id
GMAIL_USER=your_gmail_address
GMAIL_APP_PASSWORD=your_gmail_app_password
PASSWORD_RESET_CLIENT_URL=http://localhost:5173
```

Copy `client/.env.example` to `client/.env.development` for local development:

```env
VITE_API_BACKEND_URL=http://localhost:5000
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

## Running Locally

Start the backend:

```bash
cd server
npm run dev
```

Start the frontend in a second terminal:

```bash
cd client
npm run dev
```

Or from the repository root:

```bash
npm run dev:server
npm run dev:client
```

The frontend will usually run at:

```text
http://localhost:5173
```

The backend will usually run at:

```text
http://localhost:5000
```

## Available Scripts

### Client

```bash
npm run dev      # Start Vite dev server
npm run build    # Build production frontend
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Server

```bash
npm run dev      # Start backend with nodemon
npm start        # Start backend with node
```

### Root

```bash
npm run install:all  # Install client and server dependencies
npm run build        # Build the client
npm run lint         # Lint the client
npm start            # Start the server
```

## API Overview

The backend mounts these API route groups:

```text
/api/auth
/api/user
/api/admin
/api/products
/api/reviews
/api/orders
/api/stats
/api/contact
/api/blogs
/api/policy
```

## Deployment Notes

Both `client/` and `server/` include Vercel configuration files. Configure production environment variables in the hosting dashboard rather than committing `.env` files.

For the deployed server, set:

```text
NODE_ENV=production
DB_URL
JWT_SECRET
JWT_EXPIRES=7d
CLIENT_URL=https://your-client-domain
CLIENT_URLS=https://your-client-domain
PASSWORD_RESET_CLIENT_URL=https://your-client-domain
COOKIE_SECURE=true
COOKIE_SAME_SITE=none
STRIPE_SECRET_KEY
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
GOOGLE_CLIENT_ID
RESEND_API_KEY
CONTACT_TO_EMAIL
CONTACT_FROM_EMAIL
GMAIL_USER
GMAIL_APP_PASSWORD
```

For the deployed client, set:

```text
VITE_API_BACKEND_URL=https://your-server-domain
VITE_STRIPE_PUBLISHABLE_KEY
VITE_GOOGLE_CLIENT_ID
```

The server accepts local Vite origins by default and reads additional production origins from `CLIENT_URLS` or `CORS_ORIGINS`. Authentication uses an HTTP-only cookie; deployed client and server domains must be HTTPS, and cross-site deployments require `COOKIE_SAME_SITE=none` with `COOKIE_SECURE=true`.

## License

This project is licensed under the ISC License.
