const notFound = (req, res, next) => {
    res.status(404);
    res.render('errors/404', { title: 'Page Not Found' });
};

const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    
    console.error(err.stack);
    
    res.render('errors/500', { 
        title: 'Server Error',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
};

module.exports = { notFound, errorHandler };
