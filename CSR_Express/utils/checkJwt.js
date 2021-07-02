const jwt = require("express-jwt");
const jwksRsa = require("jwks-rsa");

const dotenv = require("dotenv");
dotenv.config();

const audience = process.env.AUTH0_AUDIENCE;
const domain = process.env.AUTH0_DOMAIN;

const checkJwt = jwt({
    secret: jwksRsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${domain}/.well-known/jwks.json`,
    }),

    audience: audience,
    issuer: `https://${domain}/`,
    algorithms: ["RS256"],
}).unless((req) => {
    let skip = ['/mongo/user/login', '/mongo/user/onboard', '/users', '/psp/coinbase/chargeStatus']
    return skip.includes(req.originalUrl) || req.userName === 'guest'
})

module.exports = checkJwt;