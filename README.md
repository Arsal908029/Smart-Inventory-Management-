# Smart Inventory & E-commerce Management System

A robust Node.js and MongoDB application demonstrating advanced database systems concepts including CRUD, aggregation pipelines, multi-document transactions, and sharding.

## Prerequisites
- Node.js (v14 or higher)
- MongoDB Database (Local Replica Set or Atlas M10+ Cluster recommended for full feature support)

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file in the root directory based on your MongoDB setup:
   ```env
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/inventory_db
   SESSION_SECRET=your_super_secret_session_key
   ```
   *Note: If using Atlas, ensure your IP is whitelisted.*

3. **Database Seeding (Optional)**
   If you want to populate the database with initial users and products:
   ```bash
   npm run seed
   ```

4. **Start the Application**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`.

## Advanced Features Usage

### Transactions
To test the transaction capabilities:
- Navigate to the **Database Admin -> Transactions Demo** panel in the GUI.
- You can perform point transfers and force errors to observe automatic rollback (Atomicity).
- Alternatively, run the concurrent transaction test script:
  ```bash
  node scripts/concurrent_transactions_test.js
  ```

### Sharding
To simulate the sharded environment locally:
1. Ensure `mongod` and `mongos` are installed.
2. Run the provided bash script to spin up the local clusters:
   ```bash
   bash scripts/setup_sharding.sh
   ```
3. Navigate to **Database Admin -> Sharding** in the GUI to verify cluster status.

## Screenshots
Please refer to the `screenshots/` directory for visual evidence of all features (GUI Main, CRUD operations, Aggregation Results, Index Management, and Transaction execution) as required by the final project rubric.
