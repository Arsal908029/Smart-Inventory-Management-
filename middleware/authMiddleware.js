const authMiddleware = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
};

const adminMiddleware = (req, res, next) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).render('errors/403', { title: 'Access Denied' });
    }
    next();
};

const managerMiddleware = (req, res, next) => {
    if (!req.session.user || (req.session.user.role !== 'admin' && req.session.user.role !== 'manager')) {
        return res.status(403).render('errors/403', { title: 'Access Denied' });
    }
    next();
};

module.exports = { authMiddleware, adminMiddleware, managerMiddleware };