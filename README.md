# Smart Inventory & E-commerce Management System

A robust, enterprise-grade full-stack Node.js, Express, and MongoDB application designed to demonstrate advanced database system concepts, including role-based authentication, CRUD operations, aggregation pipelines, multi-document ACID transactions, index optimization, and horizontal scaling via sharding.

Developed as a Final Semester Project for **CSC316 - Advanced Database Systems**.

---

## 🚀 Key Features

### 1. Authentication & Role-Based Access Control (RBAC)
- **Roles:** Admin, Manager, and Staff.
- **Security:** Password hashing using `bcryptjs` and session-based authentication with `express-session` and `connect-mongo`.
- **Permissions:**
  - **Admin:** Full system control, user management, and Database Administration (Index Management, Sharding Configuration, Transaction Demos).
  - **Manager:** Product management, supplier coordination, and viewing advanced sales aggregation reports.
  - **Staff:** Read-only access to inventory, sales registration, order creation, and invoice generation.

### 2. Product & Category Management
- Full CRUD operations on products with SKU tracking, dynamic pricing, and stock monitoring.
- Hierarchical category tracking with parent-child relationships.
- Image uploads handled via `multer`.

### 3. Order Lifecycle & Automated Invoicing
- Transaction-safe order processing that verifies and deducts stock levels.
- Automated invoice generation following completed orders.
- On-the-fly PDF invoice generation and download using `pdfkit`.

### 4. Advanced MongoDB Aggregation Pipelines
- **Sales Analytics:** Aggregated revenue statistics grouped by day, category, and payment methods.
- **Stock Control:** Dynamic reporting on low-stock items, fast-moving items, and out-of-stock products.
- **Interactive Visuals:** Clean dashboard charts rendered using `chart.js` connected to database aggregation endpoints.

### 5. Multi-Document ACID Transactions
- Native session-based multi-document transaction blocks ensuring consistency across collections:
  - **Order Placement (Write-Write):** Deducts product stock, logs stock changes, and creates order within a single session.
  - **Order Cancellation (Read-Write with Validation):** Restores inventory level and cancels order only if order hasn't been completed.
  - **Points Transfer Demo:** An interactive administration panel demonstrating point transfers between users with simulated error rollbacks.

### 6. Sharding & Horizontal Scaling
- Structural support for horizontal database scaling:
  - **`users` Collection:** Hashed Sharding on `_id` to distribute write/read operations uniformly across shards.
  - **`orders` Collection:** Range Sharding on `createdAt` to optimize time-series queries and range-based sales reporting.

---

## 📊 Database Schema Design

The application utilizes MongoDB with the following collections and optimized indexes:

```json
{
  "database": "inventory_db",
  "collections": [
    {
      "name": "users",
      "indexes": ["_id_", "email_1", "_id_hashed"],
      "shardKey": { "_id": "hashed" }
    },
    {
      "name": "products",
      "indexes": ["_id_", "sku_1", "category_1", "status_1"]
    },
    {
      "name": "orders",
      "indexes": ["_id_", "orderNumber_1", "createdAt_-1", "status_1_createdAt_-1"],
      "shardKey": { "createdAt": 1 }
    },
    {
      "name": "invoices",
      "indexes": ["_id_", "invoiceNumber_1", "order_1", "status_1"]
    },
    {
      "name": "transactionlogs",
      "indexes": ["_id_", "transactionId_1", "reference_1", "createdAt_-1"]
    }
  ]
}
```

---

## 🛠️ Technology Stack

- **Backend:** Node.js, Express.js, Mongoose (MongoDB ODM)
- **Frontend:** HTML5, CSS3, EJS Templating, Bootstrap 5, Chart.js
- **Database:** MongoDB (Local Replica Set or MongoDB Atlas M10+)
- **Security & Compression:** Helmet, CORS, Compression, Bcrypt.js

---

## 📂 Directory Structure

```text
├── config/                  # Database and server configuration files
├── controllers/             # Express controllers separating route logic
├── database/                # Seeding and schema configuration files
├── middleware/              # Authentication, Authorization, and Error handlers
├── models/                  # Mongoose models (User, Product, Order, Invoice, etc.)
├── public/                  # Static assets (CSS, JS, images, uploads)
├── routes/                  # Express routing modules
├── scripts/                 # Administration and setup shell scripts
├── views/                   # EJS templating pages and layouts
├── server.js                # Main application entry point
└── package.json             # App metadata and dependencies
```

---

## ⚙️ Setup and Installation

### 1. Prerequisites
- **Node.js** (v14 or higher)
- **MongoDB** (Local replica set recommended to run Transactions, or a free Atlas M0 tier for basic operations)

### 2. Installation
Clone the repository and install the dependencies:
```bash
git clone https://github.com/Arsal908029/Smart-Inventory-Management-.git
cd Smart-Inventory-Management-
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/inventory_db
SESSION_SECRET=your_super_secret_session_key
```
*Note: If connecting to MongoDB Atlas, replace `MONGODB_URI` with your connection string and ensure your local IP is whitelisted.*

### 4. Database Seeding (Optional)
Populate the database with pre-configured users (Admin, Manager, Staff), products, and suppliers:
```bash
npm run seed
```

### 5. Running the Application
Start the Node.js express server:

**For Production:**
```bash
npm start
```

**For Development (using nodemon):**
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000`.

---

## ⚡ Testing Database Features

### ACID Transactions
Navigate to **Database Admin → Transactions Demo** in the web dashboard. You can test point transfers and intentionally check "Simulate Error" to observe automatic rollback (`abortTransaction()`), which leaves the user balances unmodified.
Alternatively, run the concurrent transaction tester script:
```bash
node scripts/concurrent_transactions_test.js
```

### Dynamic Index Management
Navigate to **Database Admin → Index Management** to view all active collection indexes. You can dynamically create and drop custom indexes directly from the dashboard.

### Local Sharding Cluster Simulation
To setup a sharded environment locally:
1. Ensure MongoDB community tools (`mongod`, `mongos`) are installed in your shell path.
2. Execute the sharding setup script:
   ```bash
   bash scripts/setup_sharding.sh
   ```
3. Navigate to **Database Admin → Sharding** to verify sharded cluster statistics and status.

---

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
