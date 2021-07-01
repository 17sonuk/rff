const fs = require('fs'); // https
const https = require('https'); // https
const logger = require('./loggers/logger');

const certificate = fs.readFileSync('./sslcert/server.crt', 'utf8'); // https
const privateKey = fs.readFileSync('./sslcert/server.key', 'utf8'); // https

require('dotenv').config();
const { PORT } = process.env;

const app = require("./app");

app.get('/test', (req, res, next) => {
    res.send('success!!!!!!!!!!')
})

const credentials = { key: privateKey, cert: certificate }; // https

const httpsServer = https.createServer(credentials, app); // https

httpsServer.listen(PORT, () => logger.info(`Server running on Port ${PORT}`)); //https
