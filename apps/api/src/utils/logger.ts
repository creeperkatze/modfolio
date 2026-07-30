import pino from 'pino'

const logger = pino({
	level: process.env.LOG_LEVEL ?? 'info',
	formatters: {
		level: (label) => ({ level: label }),
	},
	transport: {
		target: 'pino-pretty',
		options: { colorize: true },
	},
})

export default logger
