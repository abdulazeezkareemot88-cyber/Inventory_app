# 📦 CoreStock - Online Inventory Management System

A full-stack, responsive **Inventory Management System** built with **HTML5, CSS3, Vanilla JavaScript, Node.js, Express.js, and Supabase PostgreSQL**.

---

## 🌟 Key Features

- 📊 **Real-time Dashboard Analytics**:
  - **Total Products** (Unique SKUs count)
  - **Total Stock Quantity** (Total units across warehouse)
  - **Low Stock Alerts** (Highlights items with $<5$ units)
  - **Total Inventory Value** (Computed dynamically via $\text{Price} \times \text{Quantity}$)
- 🛠️ **Full Product CRUD (Create, Read, Update, Delete)**:
  - **Add Product Modal** with real-time form validation.
  - **Edit Product Modal** with pre-filled inputs and live DOM updating without page reload.
  - **Delete Confirmation Modal** with safe record removal from Supabase PostgreSQL.
- 🔍 **Instant Search & Multi-Filter Engine**:
  - Search by Product Name, Category, or Product UUID.
  - Filter by Category dropdown.
  - Quick Toggle for "Low Stock Only" items.
  - Sortable table columns (Product Name, Category, Quantity, Unit Price).
- 💾 **Persistent Cloud Storage via Supabase PostgreSQL**:
  - Real database storage; data remains intact across page refreshes, browser restarts, and across devices.
- 📱 **Fully Responsive SaaS Interface**:
  - Tailored layouts for Desktop, Laptop, Tablet, and Mobile.
  - Mobile slide-out navigation drawer.
  - Toast notification alerts (Success, Error, Info).
  - CSV Data Export capability.

---

## 📁 Project Structure

```
Inventory-app/
│
├── public/                     # Frontend Client Files
│   ├── index.html              # Modern Dashboard & Inventory UI
│   ├── style.css               # Responsive Slate SaaS Styling
│   └── script.js               # Vanilla JS Fetch API & DOM Controller
│
├── server.js                   # Express.js REST API Server & Supabase Client
├── schema.sql                  # PostgreSQL Schema & Sample Seed Data
├── package.json                # Project Dependencies & Scripts
├── .env.example                # Example environment variables
├── .env                        # Local Environment Configuration (Private)
└── README.md                   # Documentation & Setup Guide
```

---

## 🚀 Quick Setup Guide

### 1. Install Node.js Dependencies

In your terminal, navigate to the project directory and run:

```bash
npm install
```

### 2. Configure Supabase PostgreSQL

1. Log in to [Supabase](https://supabase.com/) and create a new project.
2. Go to the **SQL Editor** in your Supabase project dashboard.
3. Open the `schema.sql` file from this project, copy its contents, paste it into the Supabase SQL Editor, and click **Run**.
   - This creates the `products` table, enables Row Level Security policies, and inserts starter seed products.
4. Go to **Project Settings** -> **API** in Supabase:
   - Copy the **Project URL**
   - Copy the **`anon` `public` key**

### 3. Configure `.env` File

Open the `.env` file in the root directory and add your Supabase credentials:

```env
PORT=3000
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_public_key
```

### 4. Start the Application

Start the server:

```bash
npm start
```

Or for development mode with automatic reload:

```bash
npm run dev
```

Open your browser and visit:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🔌 REST API Endpoints

| Method | Endpoint | Description | Status Code |
|---|---|---|---|
| `GET` | `/products` or `/api/products` | Retrieve all products (sorted newest first) | `200 OK` |
| `GET` | `/products/:id` or `/api/products/:id` | Retrieve single product by UUID | `200 OK` / `404 Not Found` |
| `POST` | `/products` or `/api/products` | Create a new product | `201 Created` / `400 Bad Request` |
| `PUT` | `/products/:id` or `/api/products/:id` | Update an existing product | `200 OK` / `400 Bad Request` |
| `DELETE` | `/products/:id` or `/api/products/:id` | Delete product from Supabase | `200 OK` / `404 Not Found` |
| `GET` | `/api/config-status` | Health & Supabase configuration check | `200 OK` |

---

## 🛡️ Input Validation Rules

- **Product Name**: Required, non-empty text (max 255 chars).
- **Category**: Required, non-empty text (max 100 chars).
- **Quantity**: Required integer $\ge 0$.
- **Price**: Required numeric value $\ge 0.00$.
- **Description**: Optional text (max 1000 chars).

---

## 💻 Tech Stack

- **Frontend**: HTML5, CSS3 (Modern Flexbox/Grid), Vanilla JavaScript (ES6+), Fetch API, Font Awesome.
- **Backend**: Node.js, Express.js, `@supabase/supabase-js`, `dotenv`, `cors`.
- **Database**: Supabase PostgreSQL.
