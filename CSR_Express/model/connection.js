require('dotenv').config();
const { connect, disconnect, connection } = require('mongoose');
const logger = require('../loggers/logger');
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || '27017';
const dbName = process.env.DB_NAME || 'CSR';
const dbUsername = process.env.DB_USERNAME || '';
let dbPassword = process.env.DB_PASSWORD || '';
dbPassword = encodeURIComponent(dbPassword);

const url = process.env.NODE_ENV === 'development' ? `mongodb://${dbHost}:${dbPort}/${dbName}` : `mongodb://${dbUsername}:${dbPassword}@${dbHost}:${dbPort}/${dbName}?authSource=admin`;

const mongooseOptions = {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
}

const connectionToMongo = (db_Name = '') => {
    connect(url + db_Name, mongooseOptions);
    const db = connection;
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', async function () {
        logger.debug('Mongo connection established');
        if (db_Name === '_test') {
            connection.db.dropDatabase();
            logger.debug('database dropped for tests!')
        }
    });
}

function connectToMongo(db_Name = '') {
    return new Promise((resolve, reject) => {
        connect(url + db_Name, mongooseOptions)
            .then((res, err) => {
                if (err) {
                    return reject(err);
                }
                logger.debug('Mongo connection established.............');
                console.log(res.connections);
                resolve(res);
            })
    })
}

function disconnectMongo() {
    return disconnect();
}

module.exports = { connectionToMongo, connectToMongo, disconnectMongo };