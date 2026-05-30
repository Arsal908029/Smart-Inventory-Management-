#!/bin/bash

echo "==============================================="
echo " MongoDB Sharding Setup (Local Sandbox)"
echo "==============================================="

# Create necessary directories
echo "Creating data directories..."
mkdir -p /data/config1 /data/config2 /data/config3
mkdir -p /data/shard1 /data/shard2

# 1. Start Config Servers (Replica Set)
echo "Starting Config Servers..."
mongod --configsvr --replSet configReplSet --port 27019 --dbpath /data/config1 --bind_ip localhost --fork --logpath /data/config1/mongod.log
mongod --configsvr --replSet configReplSet --port 27020 --dbpath /data/config2 --bind_ip localhost --fork --logpath /data/config2/mongod.log
mongod --configsvr --replSet configReplSet --port 27021 --dbpath /data/config3 --bind_ip localhost --fork --logpath /data/config3/mongod.log

echo "Waiting for config servers to start..."
sleep 5

echo "Initializing Config Replica Set..."
mongosh --port 27019 --eval 'rs.initiate({ _id: "configReplSet", configsvr: true, members: [ { _id: 0, host: "localhost:27019" }, { _id: 1, host: "localhost:27020" }, { _id: 2, host: "localhost:27021" } ] })'

# 2. Start Shard Servers (Single nodes for demo, ideally replica sets)
echo "Starting Shard Servers..."
mongod --shardsvr --replSet shard1ReplSet --port 27022 --dbpath /data/shard1 --bind_ip localhost --fork --logpath /data/shard1/mongod.log
mongod --shardsvr --replSet shard2ReplSet --port 27023 --dbpath /data/shard2 --bind_ip localhost --fork --logpath /data/shard2/mongod.log

echo "Waiting for shard servers to start..."
sleep 5

echo "Initializing Shard Replica Sets..."
mongosh --port 27022 --eval 'rs.initiate({ _id: "shard1ReplSet", members: [{ _id: 0, host: "localhost:27022" }] })'
mongosh --port 27023 --eval 'rs.initiate({ _id: "shard2ReplSet", members: [{ _id: 0, host: "localhost:27023" }] })'

# 3. Start Mongos Router
echo "Starting Mongos Router..."
mongos --configdb configReplSet/localhost:27019,localhost:27020,localhost:27021 --port 27017 --bind_ip localhost --fork --logpath /data/mongos.log

echo "Waiting for mongos to start..."
sleep 5

# 4. Add Shards and Enable Sharding
echo "Adding shards to the cluster..."
mongosh --port 27017 --eval 'sh.addShard("shard1ReplSet/localhost:27022")'
mongosh --port 27017 --eval 'sh.addShard("shard2ReplSet/localhost:27023")'

echo "Enabling sharding for database..."
mongosh --port 27017 --eval 'sh.enableSharding("inventory_db")'

echo "Creating Hashed Index and Sharding Users Collection..."
mongosh --port 27017 --eval 'db.getSiblingDB("inventory_db").users.createIndex({ _id: "hashed" }); sh.shardCollection("inventory_db.users", { _id: "hashed" })'

echo "Creating Range Index and Sharding Orders Collection..."
mongosh --port 27017 --eval 'db.getSiblingDB("inventory_db").orders.createIndex({ orderDate: 1 }); sh.shardCollection("inventory_db.orders", { orderDate: 1 })'

echo "==============================================="
echo " Sharding Setup Complete!"
echo " Connect to router using: mongosh --port 27017"
echo " Run sh.status() to view cluster state."
echo "==============================================="
