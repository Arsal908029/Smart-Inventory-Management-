const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const methodOverride = require('method-override');
require('dotenv').config();

// Import database connection
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const orderRoutes = require('./routes/orderRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const aggregationRoutes = require('./routes/aggregationRoutes');
const shardRoutes = require('./routes/shardRoutes');
const userRoutes = require('./routes/userRoutes');
const dbAdminRoutes = require('./routes/dbAdminRoutes');
const supplierRoutes = require('./routes/supplierRoutes');

// Import middleware
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

const app = express();

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false,
}));

// Compression middleware
app.use(compression());

// CORS middleware
app.use(cors());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret',
    resave: false,
    saveUninitialized: false,
    // store: MongoStore.create({
    //     mongoUrl: process.env.MONGODB_URI,
    //     ttl: 24 * 60 * 60 // 1 day
    // }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 1 day
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    }
}));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// EJS setup
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layouts/main');

// Make user available in all views
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.currentYear = new Date().getFullYear();
    res.locals.dbState = mongoose.connection.readyState;
    next();
});

// Routes
app.use('/', authRoutes);
app.use('/products', productRoutes);
app.use('/categories', (req, res, next) => { if(!categoryRoutes) return next(); categoryRoutes(req, res, next); });
app.use('/orders', (req, res, next) => { if(!orderRoutes) return next(); orderRoutes(req, res, next); });
app.use('/invoices', (req, res, next) => { if(!invoiceRoutes) return next(); invoiceRoutes(req, res, next); });
app.use('/dashboard', dashboardRoutes);
app.use('/transactions', (req, res, next) => { if(!transactionRoutes) return next(); transactionRoutes(req, res, next); });
app.use('/aggregation', (req, res, next) => { if(!aggregationRoutes) return next(); aggregationRoutes(req, res, next); });
app.use('/sharding', (req, res, next) => { if(!shardRoutes) return next(); shardRoutes(req, res, next); });
app.use('/user', (req, res, next) => { if(!userRoutes) return next(); userRoutes(req, res, next); });
app.use('/dbadmin', (req, res, next) => { if(!dbAdminRoutes) return next(); dbAdminRoutes(req, res, next); });
app.use('/suppliers', (req, res, next) => { if(!supplierRoutes) return next(); supplierRoutes(req, res, next); });

// Home page redirect
app.get('/', (req, res) => {
    if (req.session.user) {
        res.redirect('/dashboard');
    } else {
        res.redirect('/login');
    }
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Visit: http://localhost:${PORT}`);
});
 
