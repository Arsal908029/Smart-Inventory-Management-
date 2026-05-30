const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Category = require('./models/Category');
const Product = require('./models/Product');

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    console.log('Cleared existing data.');

    // 1. Create Admin User
    const adminUser = new User({
      username: 'admin',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin'
    });
    await adminUser.save();
    console.log('Admin user created (username: admin, password: password123).');

    // 2. Create Categories
    const categories = await Category.insertMany([
      { name: 'Electronics', description: 'Gadgets, devices, and accessories' },
      { name: 'Clothing', description: 'Apparel and fashion items' },
      { name: 'Office Supplies', description: 'Stationery and office equipment' }
    ]);
    console.log('Categories created.');

    // 3. Create Products
    const electronicsId = categories.find(c => c.name === 'Electronics')._id;
    const clothingId = categories.find(c => c.name === 'Clothing')._id;

    await Product.insertMany([
      {
        name: 'Wireless Mouse',
        description: 'Ergonomic wireless mouse',
        category: electronicsId,
        price: 29.99,
        quantity: 50,
        sku: 'ELEC-MOU-001'
      },
      {
        name: 'Mechanical Keyboard',
        description: 'RGB mechanical keyboard with blue switches',
        category: electronicsId,
        price: 89.99,
        quantity: 30,
        sku: 'ELEC-KEY-002'
      },
      {
        name: 'Cotton T-Shirt',
        description: 'Comfortable 100% cotton t-shirt',
        category: clothingId,
        price: 15.99,
        quantity: 100,
        sku: 'CLO-TSH-001'
      }
    ]);
    console.log('Sample products created.');

    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
