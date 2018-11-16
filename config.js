'use strict';
let databaseUrl = '';
if (process.env.NODE_ENV === 'test') {
    databaseUrl = process.env.TEST_DATABASE_URL;
} else {
    databaseUrl = process.env.DATABASE_URL;
}
// exports.DATABASE_URL =
//     process.env.DATABASE_URL ||
//     global.DATABASE_URL ||
//     'mongodb://localhost/jwt-auth-demo';
exports.DATABASE_URL = databaseUrl;
exports.PORT = process.env.PORT || 8080;
exports.JWT_SECRET = process.env.JWT_SECRET;
exports.JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

