require('dotenv').config();
const { connect, connection } = require('mongoose');

const logger = require('../loggers/logger');

const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || '27017';
const dbName = process.env.DB_NAME || 'CSR';

const url = `mongodb://${dbHost}:${dbPort}/${dbName}`;
const mongooseOptions = {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
}

const connectionToMongo = () => {
    connect(url, mongooseOptions);
    const db = connection;
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', async function () {
        logger.debug('Mongo connection established');
    });
}

module.exports = connectionToMongo;