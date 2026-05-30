const User = require('../models/User');

// @desc    Load login page
// @route   GET /login
const loadLogin = (req, res) => {
    if (req.session.user) {
        return res.redirect('/dashboard');
    }
    res.render('auth/login', { title: 'Login', error: null });
};

// @desc    Load register page
// @route   GET /register
const loadRegister = (req, res) => {
    if (req.session.user) {
        return res.redirect('/dashboard');
    }
    res.render('auth/register', { title: 'Register', error: null });
};

// @desc    Login user
// @route   POST /login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.render('auth/login', {
                title: 'Login',
                error: 'Please provide email and password'
            });
        }

        // Check for user
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.render('auth/login', {
                title: 'Login',
                error: 'Invalid credentials'
            });
        }

        // Check password
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.render('auth/login', {
                title: 'Login',
                error: 'Invalid credentials'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.render('auth/login', {
                title: 'Login',
                error: 'Your account has been deactivated'
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Create session
        req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            theme: user.preferences && user.preferences.theme ? user.preferences.theme : 'light'
        };

        res.redirect('/dashboard');
    } catch (error) {
        console.error(error);
        res.render('auth/login', {
            title: 'Login',
            error: 'Server error. Please try again.'
        });
    }
};

// @desc    Register user
// @route   POST /register
const register = async (req, res) => {
    try {
        const { name, email, password, confirmPassword } = req.body;

        // Validate input
        if (!name || !email || !password) {
            return res.render('auth/register', {
                title: 'Register',
                error: 'Please fill all required fields'
            });
        }

        if (password !== confirmPassword) {
            return res.render('auth/register', {
                title: 'Register',
                error: 'Passwords do not match'
            });
        }

        if (password.length < 6) {
            return res.render('auth/register', {
                title: 'Register',
                error: 'Password must be at least 6 characters'
            });
        }

        // Check if user exists
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.render('auth/register', {
                title: 'Register',
                error: 'Email already registered'
            });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            role: 'staff' // Default role
        });

        // Create session
        req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            theme: 'light'
        };

        res.redirect('/dashboard');
    } catch (error) {
        console.error(error);
        res.render('auth/register', {
            title: 'Register',
            error: error.message || 'Server error. Please try again.'
        });
    }
};

// @desc    Logout user
// @route   GET /logout
const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error(err);
        }
        res.redirect('/login');
    });
};

module.exports = {
    loadLogin,
    loadRegister,
    login,
    register,
    logout
};