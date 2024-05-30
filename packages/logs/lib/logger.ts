import { createLogger, format, transports } from "winston";

const customFormat = format.combine(
  format.colorize({
    all: true,
  }),
  format.printf(({ message, ...rest }) => {
    return `${message} ${JSON.stringify(rest)}`.trim();
  }),
);

export const logger = createLogger({
  level: "info",
  transports: [
    new transports.Console({
      format: customFormat,
    }),
  ],
});
