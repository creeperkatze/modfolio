import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

const logger = pino({
    name: "modfolio-backend",
    level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
    transport: isProduction
        ? undefined
        : {
            target: "pino-pretty",
            options: {
                colorize: true,
                ignore: "pid,hostname",
                translateTime: "SYS:standard"
            }
        }
});

export default logger;
