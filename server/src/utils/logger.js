/** Timestamped leveled logger. Usage: logger.info(msg, ...meta) */
function log(level, args) {
  const ts = new Date().toISOString();
  const line = `[${ts}] [${level.toUpperCase()}]`;
  if (level === 'error') console.error(line, ...args);
  else if (level === 'warn') console.warn(line, ...args);
  else console.log(line, ...args);
}

module.exports = {
  info: (...args) => log('info', args),
  warn: (...args) => log('warn', args),
  error: (...args) => log('error', args),
};
