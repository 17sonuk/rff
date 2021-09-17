const fs = require('fs'); // https
const https = require('https'); // https
const logger = require('./loggers/logger');

const certificate = fs.readFileSync('./sslcert/server.crt', 'utf8'); // https
const privateKey = fs.readFileSync('./sslcert/server.key', 'utf8'); // https

require('dotenv').config();
const { PORT, CA_EMAIL, GUEST_EMAIL } = process.env;

const { connectionToMongo } = require('./model/connection')
connectionToMongo();

const registerUser = require('./fabric-sdk/registerUser');

// Register ca in wallet (startup activity)
registerUser(CA_EMAIL.split('@')[0], 'creditsauthority')
    .then(_ => {
        logger.debug(_)
    })
    .catch(e => {
        logger.error(`${e.stack || e}`)
    });

// Register guest donor in wallet (startup activity)
registerUser(GUEST_EMAIL.split('@')[0], 'corporate')
    .then(_ => {
        logger.debug(_)
    })
    .catch(e => {
        logger.error(`${e.stack || e}`)
    })
// await registerUser(IT_EMAIL.split('@')[0], 'creditsauthority')

const app = require("./app");

app.get('/test', (req, res, next) => {
    res.send('success!!!!!!!!!!')
})

const credentials = { key: privateKey, cert: certificate }; // https

const httpsServer = https.createServer(credentials, app); // https

httpsServer.listen(PORT, () => logger.info(`Server running on Port ${PORT} (HTTPS)`)); //https

// app.listen(PORT, () => {
//     logger.info(`Application running on port ${PORT} (HTTP)`);
// })