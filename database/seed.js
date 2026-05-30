const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');

const categories = [
    { name: 'Electronics', description: 'Electronic devices and accessories' },
    { name: 'Clothing', description: 'Apparel and fashion items' },
    { name: 'Books', description: 'Books and publications' },
    { name: 'Home & Garden', description: 'Home improvement and garden supplies' },
    { name: 'Sports', description: 'Sports equipment and accessories' }
];

const products = [
    { name: 'Laptop Pro', sku: 'ELEC001', description: 'High-performance laptop', price: 999.99, cost: 700, quantity: 50 },
    { name: 'Smartphone X', sku: 'ELEC002', description: 'Latest smartphone', price: 699.99, cost: 450, quantity: 100 },
    { name: 'Wireless Headphones', sku: 'ELEC003', description: 'Noise-cancelling headphones', price: 199.99, cost: 120, quantity: 200 },
    { name: 'T-Shirt', sku: 'CLOTH001', description: 'Cotton t-shirt', price: 19.99, cost: 8, quantity: 500 },
    { name: 'Jeans', sku: 'CLOTH002', description: 'Denim jeans', price: 49.99, cost: 25, quantity: 300 }
];

async function seedDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        
        // Clear existing data
        await User.deleteMany({});
        await Category.deleteMany({});
        await Product.deleteMany({});
        console.log('Cleared existing data');
        
        // Create admin user
        const adminPassword = await bcrypt.hash('Admin123!', 10);
        const admin = await User.create({
            name: 'Admin User',
            email: 'admin@smartinventory.com',
            password: adminPassword,
            role: 'admin',
            isActive: true
        });
        console.log('Admin user created');
        
        // Create categories
        const createdCategories = await Category.insertMany(categories);
        console.log(`${createdCategories.length} categories created`);
        
        // Create products
        const categoryMap = {};
        createdCategories.forEach(cat => {
            categoryMap[cat.name] = cat._id;
        });
        
        const productsWithCategories = products.map(product => ({
            ...product,
            category: categoryMap[product.sku.startsWith('ELEC') ? 'Electronics' : 
                      product.sku.startsWith('CLOTH') ? 'Clothing' : 'Books']
        }));
        
        await Product.insertMany(productsWithCategories);
        console.log(`${products.length} products created`);
        
        console.log('Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase();
