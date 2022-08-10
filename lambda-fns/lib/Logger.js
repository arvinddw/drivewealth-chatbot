import winston from 'winston';

winston.add(
new winston.transports.Console({
    format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`),
    ),
    level: 'verbose',
}),
);

export default winston;