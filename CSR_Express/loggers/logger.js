const { createLogger, format, transports } = require('winston');
const { combine, colorize, printf, timestamp } = format;

const myFormat = format.combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
    printf(
        (info) => `${info.timestamp} [${info.level}]: ${info.message}`
    )
);

const options = {
    console: {
        level: 'debug',
        format: combine(
            myFormat,
            colorize({ all: true })
        ),
    },
    // file: {
    //     level: 'info',
    //     filename: 'app.log',
    //     format: combine(
    //         myFormat
    //     ),
    // }
};

let logger = createLogger({
    exitOnError: false,
    level: 'debug',
    transports: [
        new transports.Console(options.console),
        // new transports.File(options.file)
    ]
});

module.exports = logger;