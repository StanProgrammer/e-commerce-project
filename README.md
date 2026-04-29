# Wiles and Rues Ecommerce Project

A full-stack MERN ecommerce application with a React storefront, user dashboard, admin dashboard, product management, blogs, reviews, policies, contact handling, image uploads, and online payments.

## Features

- Product browsing, search, category pages, and product details
- Shopping cart and checkout flow
- Stripe payment integration
- User authentication with JWT and Google login support
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

Create a `.env` file in `server/`:

```env
DB_URL=your_mongodb_connection_string
PORT=5000
JWT_SECRET=your_jwt_secret
JWT_EXPIRES=7d
CLIENT_URL=http://localhost:5173
CLIENT_URLS=http://localhost:5173
STRIPE_SECRET_KEY=your_stripe_secret_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
RESEND_API_KEY=your_resend_api_key
CONTACT_TO_EMAIL=your_contact_receiver_email
CONTACT_FROM_EMAIL=your_verified_sender_email
GOOGLE_CLIENT_ID=your_google_client_id
```

Create a `.env` file in `client/`:

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

Both `client/` and `server/` include Vercel configuration files. For deployment, configure the same environment variables in your hosting dashboard and make sure the deployed client URL is allowed by the server CORS settings.

## License

This project is licensed under the ISC License.
