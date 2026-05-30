const User = require('../models/User');

// @desc    Get user profile
// @route   GET /user/profile
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.session.user.id);
        res.render('user/profile', { title: 'Profile', userDoc: user, success: null, error: null });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

// @desc    Update user profile
// @route   POST /user/profile
const updateProfile = async (req, res) => {
    try {
        const { name, email } = req.body;
        const user = await User.findById(req.session.user.id);
        
        user.name = name;
        user.email = email;
        await user.save();
        
        // Update session
        req.session.user.name = user.name;
        req.session.user.email = user.email;

        res.render('user/profile', { title: 'Profile', userDoc: user, success: 'Profile updated successfully', error: null });
    } catch (error) {
        console.error(error);
        const user = await User.findById(req.session.user.id);
        res.render('user/profile', { title: 'Profile', userDoc: user, success: null, error: 'Error updating profile' });
    }
};

// @desc    Get user settings
// @route   GET /user/settings
const getSettings = async (req, res) => {
    try {
        const user = await User.findById(req.session.user.id);
        res.render('user/settings', { title: 'Settings', userDoc: user, success: null, error: null });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

// @desc    Update user settings
// @route   POST /user/settings
const updateSettings = async (req, res) => {
    try {
        const { theme, notifications, password, newPassword, confirmPassword } = req.body;
        const user = await User.findById(req.session.user.id).select('+password');

        // Update preferences
        if (theme) {
            user.preferences.theme = theme;
            req.session.user.theme = theme;
        }
        user.preferences.notifications = notifications === 'on';

        // Update password if provided
        if (password || newPassword || confirmPassword) {
            if (!password || !newPassword || !confirmPassword) {
                return res.render('user/settings', { title: 'Settings', userDoc: user, success: null, error: 'Please fill all password fields' });
            }
            const isMatch = await user.matchPassword(password);
            if (!isMatch) {
                return res.render('user/settings', { title: 'Settings', userDoc: user, success: null, error: 'Incorrect current password' });
            }
            if (newPassword !== confirmPassword) {
                return res.render('user/settings', { title: 'Settings', userDoc: user, success: null, error: 'New passwords do not match' });
            }
            if (newPassword.length < 6) {
                return res.render('user/settings', { title: 'Settings', userDoc: user, success: null, error: 'Password must be at least 6 characters' });
            }
            user.password = newPassword;
        }

        await user.save();

        res.render('user/settings', { title: 'Settings', userDoc: user, success: 'Settings updated successfully', error: null });
    } catch (error) {
        console.error(error);
        const user = await User.findById(req.session.user.id);
        res.render('user/settings', { title: 'Settings', userDoc: user, success: null, error: 'Error updating settings' });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    getSettings,
    updateSettings
};
