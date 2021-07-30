const { createLogger, format, transports } = require('winston');
const { combine, colorize, json, prettyPrint, printf, simple, splat, timestamp } = format;

const formatDate = (t, a, s) => {
    let format = (m) => {
        let f = new Intl.DateTimeFormat('en', m);
        return f.format(t);
    }
    return a.map(format).join(s);
}

let a = [{ day: 'numeric' }, { month: 'short' }, { year: 'numeric' }];
let fileName = formatDate(new Date, a, '-');

const myFormat = printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}] : ${message}`
    if (metadata && JSON.stringify(metadata) !== '{}') {
        msg += JSON.stringify(metadata, null, 2);
    }
    return msg
});

const options = {
    file: {
        level: 'debug',
        filename: `logs/${fileName}.log`,
        handleExceptions: true,
        json: true,
        maxsize: '20m', // 20MB
        maxFiles: '14d',
        // zippedArchive: true,
        colorize: false,
        format: combine(
            timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
            myFormat
        )
    },
    console: {
        level: 'debug',
        handleExceptions: true,
        json: false,
        format: combine(
            colorize({ all: true }), // remove all true to show only [console type] as colored
            timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
            myFormat
        )
    }
};

let logger = createLogger({
    exitOnError: false, // wont cause process.exit
    level: 'debug',
    transports: [
        new transports.Console(options.console),
        new transports.File(options.file)
    ]
});

module.exports = logger;