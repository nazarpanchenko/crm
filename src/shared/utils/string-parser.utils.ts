import { createLogger, format, transports } from 'winston';

type ExpiryDateSymbol = 's' | 'm' | 'h' | 'd';

const UNIT_TO_LABEL: Record<ExpiryDateSymbol, string> = {
  s: 'seconds',
  m: 'minutes',
  h: 'hours',
  d: 'days',
};

const { combine, timestamp, printf } = format;

const logger = createLogger({
  format: combine(
    timestamp(),
    printf(
      ({ timestamp, level, message }) =>
        `[${timestamp}] [${level.toUpperCase()}] [parseExpiryDateString] ${message}`,
    ),
  ),
  transports: [new transports.Console()],
});

export function getParsedExpiryDateString(str: string): string | null {
  try {
    const match = str.trim().match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(
        `Invalid expiry format: "${str}". Expected e.g. "30m", "7d", "24h"`,
      );
    }

    const value = match[1];
    const unit = match[2] as ExpiryDateSymbol;
    return `${value} ${UNIT_TO_LABEL[unit]}`;
  } catch (err) {
    logger.error(
      err instanceof Error ? err.message : 'Failed to parse expiry string',
    );
    return null;
  }
}
