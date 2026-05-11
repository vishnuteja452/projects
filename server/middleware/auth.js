const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
    const token = req.header('x-auth-token');
    
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

exports.isLoggedIn = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return next();

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        next();
    }
};

exports.restrictBoardAccess = (req, res, next) => {
    const board = req.params.board || req.body.category || req.query.category;
    const restrictedBoards = ['politics', 'healthcare', 'collaboration'];

    if (restrictedBoards.includes(board) && !req.user) {
        return res.status(403).json({ 
            msg: "Login required to access this content",
            restricted: true
        });
    }
    next();
};

