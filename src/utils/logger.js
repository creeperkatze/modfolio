import { format, createLogger, transports } from "winston";
import LokiTransport from "winston-loki";
import path from "path";

const LOG_DIRECTORY = process.env.LOG_DIRECTORY || "./logs";
const LOKI_HOST = process.env.LOKI_HOST || "http://localhost:3100";

const isVercel = process.env.VERCEL === "1";

const consoleFormat = isVercel
    ? format.combine(
        format.printf(({ message }) => message)
    )
    : format.combine(
        format.colorize(),
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        format.printf(({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`)
    );

const fileFormat = format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.printf(({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`)
);

const loggerTransports = [
    new transports.Console({ format: consoleFormat })
];

// Only add file and loki transports when not running on Vercel
if (!isVercel) {
    loggerTransports.push(
        new LokiTransport({
            host: LOKI_HOST,
            json: true,
            labels: { job: "modfolio" },
            format: fileFormat,
        }),
        new transports.File({
            filename: path.join(LOG_DIRECTORY, "error.log"),
            level: "error",
            maxsize: 5000000000, // 5 GB
            format: fileFormat,
        }),
        new transports.File({
            filename: path.join(LOG_DIRECTORY, "warn.log"),
            level: "warn",
            maxsize: 5000000000, // 5 GB
            format: fileFormat,
        }),
        new transports.File({
            filename: path.join(LOG_DIRECTORY, "info.log"),
            level: "info",
            maxsize: 5000000000, // 5 GB
            format: fileFormat,
        }),
        new transports.File({
            filename: path.join(LOG_DIRECTORY, "main.log"),
            maxsize: 5000000000, // 5 GB
            format: fileFormat
        })
    );
}

const logger = createLogger({
    level: "info",
    format: format.errors({ stack: true }),
    defaultMeta: { service: "superslide-backend" },
    transports: loggerTransports,
});

export default logger;