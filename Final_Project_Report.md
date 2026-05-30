# CSC316 - Advanced Database Systems
## Final Semester Project

**Project Title:** Smart Inventory & E-commerce Management System  
**Theme:** E-commerce / Inventory  
**Submitted To:** Lecturer Mr. Salman Khan  
**Submitted By:** Arsalan Ali  
**Date:** May 19, 2026

---

## Section 1: Project Overview

### Project Name and Theme
**Smart Inventory System** is a full-stack, enterprise-grade inventory and e-commerce management platform built using Node.js, Express, EJS, and MongoDB.

### Core Functionality Summary
- **Authentication & Authorization**: Role-based access control (Admin, Manager, Staff).
- **Product & Category Management**: Comprehensive CRUD operations for managing products, metadata, pricing, and hierarchical categories.
- **Order & Invoice Processing**: End-to-end lifecycle management of customer orders, stock deductions, and automated invoice generation.
- **Advanced Aggregations**: Detailed business analytics including sales reports, low stock alerts, and revenue trends using complex MongoDB aggregation pipelines.
- **Transaction Management**: Secure ACID multi-document transactions ensuring data integrity during order placements, status updates, and point transfers.
- **Horizontal Scaling (Sharding)**: Configuration for distributing users and orders data across multiple shards to support large-scale enterprise data.

---

## Section 2: Final Database Schema

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

## Section 3: GUI Documentation

### Technologies Used
- **Backend:** Node.js, Express.js, Mongoose
- **Frontend:** EJS Templating, Bootstrap 5, Vanilla JavaScript
- **Database:** MongoDB Atlas (or Local Sandbox)

### Connection Setup Instructions
1. Install dependencies using `npm install`.
2. Configure `.env` with your `MONGODB_URI` (either local or Atlas).
3. Start the application using `npm run dev` or `node server.js`.
4. The GUI provides a "Database Admin" panel to monitor the active connection state dynamically.

### Features Implemented
- **Database Admin Dashboard:** Dedicated views for checking Database Connection status, viewing existing indexes, and executing Transaction Demos.
- **Index Management:** The `dbAdmin/indexes` view lists all indexes natively pulled from MongoDB via `collection.indexes()` and provides functionality to create and drop custom indexes.
- **Transaction Demo Panel:** A specialized form to execute multi-collection point transfers with a toggleable feature to intentionally trigger an error, demonstrating transaction rollbacks natively in the UI.

### Known Limitations
- The MongoDB Node.js driver cannot dynamically reconnect to a new Database URI seamlessly without restarting the Express server instance, so the Connection GUI acts as an active monitor rather than an interactive connector.
- Sharding commands (`sh.enableSharding`, etc.) require cluster administration privileges, which are restricted on free-tier Atlas.

---

## Section 4: Transaction Management Report

### Transaction Scenarios Explained

1. **Write-Write Transaction (Order Placement)**
   - **Operation:** Deduct product stock from `products`, log history in `stockhistories`, and create the `order` document.
   - **Mechanism:** Implemented in `orderController.js` inside `createOrder()`. Validates stock, performs deductions, logs data, and saves the order within a single active `session.startTransaction()`.

2. **Read-Write Transaction with Validation (Order Cancellation)**
   - **Operation:** Read the current order status. If valid (e.g., not completed), update the `order` status to cancelled, restore stock to `products`, and record the adjustment.
   - **Mechanism:** Using `{ readConcern: 'snapshot', writeConcern: 'majority' }` in `updateOrderStatus()`. Throws an error before any writes if validation rules fail, ensuring no partial refunds or stock mismatches occur.

3. **Multi-Collection Transaction (Point Transfers)**
   - **Operation:** Deduct points from User A, add points to User B, and insert an audit document in `transactionlogs`.
   - **Mechanism:** Accessible via the GUI Transaction Demo. Wraps modifications to two separate documents in the `users` collection and an insertion in `transactionlogs`.

### Error Scenarios Tested
- **Simulated Failure:** In the multi-collection demo, checking "Simulate Error" intentionally throws an exception after User A's points are deducted. The `catch` block successfully executes `session.abortTransaction()`, restoring User A's points and leaving User B and the logs untouched. This perfectly demonstrates Atomicity.

---

## Section 5: Sharding Implementation Report

### Shard Key Selection Rationale
- **Users Collection:** Sharded on `{ _id: "hashed" }`.
  - *Rationale:* User IDs are monotonically increasing or heavily clustered (e.g., generated ObjectIds). Hashed sharding ensures users are evenly distributed across all available shards, preventing "hot shards" during bulk signups or mass user queries.
- **Orders Collection:** Sharded on `{ createdAt: 1 }`.
  - *Rationale:* Range sharding. Orders are heavily queried by date (e.g., "Get all sales for Q3"). Range sharding ensures that documents created around the same time live on the same shard, optimizing read operations for time-series and aggregate reports.

### Implementation Guide
The commands necessary to set up a replica set configuration and shard the collections locally are provided in `scripts/setup_sharding.sh`. The application GUI under **Database Admin -> Sharding** outlines these steps visually for the end-user.

---

## Section 6: Challenges & Solutions

**Challenge:** Handling transactions on Atlas Free Tier.
**Solution:** The free tier (M0) doesn't fully support all administrative multi-document replica set requirements natively for cluster management, so I implemented a resilient local strategy using the official `mongodb-memory-server` or `mongod` instances simulating a replica set (`--replSet rs0`). Express uses explicit sessions `await mongoose.startSession()` which safely falls back or throws descriptive errors if replica sets aren't running.

**Challenge:** Building a GUI for purely administrative database commands (like dropping indexes).
**Solution:** I utilized the native Mongoose connections (`mongoose.connection.db`) to access the raw MongoDB Node Driver, allowing the execution of `.createIndex()`, `.dropIndex()`, and fetching `.collections()`.

---

## Section 7: Conclusion & Future Work

### Conclusion
This project successfully transitions a standard CRUD application into an enterprise-ready system. By implementing multi-document transactions, the integrity of order processing and inventory management is mathematically guaranteed. Furthermore, by structuring collections for horizontal scaling (Sharding), the foundation is laid out for processing millions of rows concurrently.

### Comparison: Single Node vs Sharded Cluster
A single node handles all read/write locks, leading to bottlenecks under heavy transactional loads. A sharded cluster delegates data ranges to specific hardware, exponentially increasing write throughput. However, transactions spanning multiple shards (`commitTransaction`) introduce slight latency due to two-phase commit overhead, making shard-key selection incredibly crucial.

### Future Work
- Deploying the infrastructure on AWS using Terraform to orchestrate true physical shards.
- Implementing Redis caching for frequently accessed aggregation data.
- Connecting external payment gateways directly inside the transaction sessions to guarantee absolute financial consistency.
