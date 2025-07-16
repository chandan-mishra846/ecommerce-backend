# 🛒 E-commerce Backend API

This is the complete backend of an e-commerce website, built using **Node.js, Express.js, and MongoDB**.  
It includes full authentication, product management, user roles (admin & user), and order management.

---

## 🚀 Features

- 🔐 **User Authentication & Authorization**  
  - JWT-based login and registration  
  - Password encryption with bcrypt  
  - Role-based access control (Admin & User)

- 📦 **Product Management**  
  - Create, update, delete, and view products (Admin only)  
  - Search, filter, and pagination support (for users)

- 🛍️ **Order Management**  
  - Place orders  
  - Track order status  
  - Admin access to all orders

- 👨‍💼 **Admin Dashboard (Backend)**  
  - View all users  
  - Manage products  
  - Manage orders

- ✉️ **Email Support**  
  - Send emails via Nodemailer (e.g., password reset links)

---

## 🧰 Tech Stack

- **Backend:** Node.js, Express.js  
- **Database:** MongoDB (with Mongoose)  
- **Auth:** JWT, bcryptjs  
- **Other Tools:** dotenv, nodemailer

---

## 📂 Project Structure

---

## 🧪 API Endpoints

| Method | Endpoint                                      | Description                      | Access   |
|--------|-----------------------------------------------|----------------------------------|----------|
| POST   | `/api/v1/register`                            | Register a new user              | Public   |
| POST   | `/api/v1/login`                               | Login user                       | Public   |
| POST   | `/api/v1/logout`                              | Logout user                      | Private  |
| POST   | `/api/v1/password/forgot`                     | Send password reset email        | Public   |
| POST   | `/api/v1/reset/:token`                        | Reset password                   | Public   |
| GET    | `/api/v1/me`                                  | Get current user profile         | Private  |
| POST   | `/api/v1/profile/update`                      | Update user profile              | Private  |
| POST   | `/api/v1/password/update`                     | Change user password             | Private  |
| GET    | `/api/v1/products`                            | Get all products                 | Public   |
| GET    | `/api/v1/products/:id`                        | Get single product               | Public   |
| PUT    | `/api/v1/review`                              | Create or update review          | Private  |
| GET    | `/api/v1/reviews`                             | Get product reviews              | Public   |
| DELETE | `/api/v1/reviews`                             | Delete a review                  | Private  |
| POST   | `/api/v1/new/order`                           | Create new order                 | Private  |
| GET    | `/api/v1/order/user`                          | Get logged-in user's orders      | Private  |
| GET    | `/api/v1/admin/products`                      | Get all products (admin)         | Admin    |
| POST   | `/api/v1/admin/products/create`               | Create a new product             | Admin    |
| PUT    | `/api/v1/admin/products/:id`                  | Update a product                 | Admin    |
| DELETE | `/api/v1/admin/products/:id`                  | Delete a product                 | Admin    |
| GET    | `/api/v1/admin/users`                         | Get all users                    | Admin    |
| GET    | `/api/v1/admin/user/:id`                      | Get a single user                | Admin    |
| PUT    | `/api/v1/admin/user/:id`                      | Update user role                 | Admin    |
| DELETE | `/api/v1/admin/user/:id`                      | Delete a user                    | Admin    |
| GET    | `/api/v1/admin/order`                         | Get all orders                   | Admin    |
| GET    | `/api/v1/admin/order/:id`                     | Get single order details         | Admin    |
| PUT    | `/api/v1/admin/order/:id`                     | Update order status              | Admin    |
| DELETE | `/api/v1/admin/order/:id`                     | Delete an order                  | Admin    |

---

## 🛠️ Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/chandan-mishra846/ecommerce-backend
   cd ecommerce-backend


