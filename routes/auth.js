const jwtExpress = require('express-jwt');
const secret = require('../config').secret;
const jwt = require('jsonwebtoken');

function getTokenFromHeader(req) {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Token' ||
        req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        return req.headers.authorization.split(' ')[1];
    }
    return null;
}

function getUserIdFromToken(req) {
    try {
        return jwt.verify(getTokenFromHeader(req), secret).id;
    } catch (err) {
        return null;
    }
}

const auth = {
    required: jwtExpress({
        secret: secret,
        userProperty: 'payload',
        getToken: getTokenFromHeader
    }),
    optional: jwtExpress({
        secret: secret,
        userProperty: 'payload',
        credentialsRequired: false,
        getToken: getTokenFromHeader
    }),
    getUserIdFromToken
};

module.exports = auth;
