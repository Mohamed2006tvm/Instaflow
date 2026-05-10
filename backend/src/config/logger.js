const fs = require('fs');
const path = require('path');

// Ensure logs directory exists - skip on Vercel
const isVercel = process.env.VERCEL === '1';
const logsDir = path.join(process.cwd(), 'logs');

if (!isVercel) {
  if (!fs.existsSync(logsDir)) {
    try {
      fs.mkdirSync(logsDir, { recursive: true });
    } catch (err) {
      console.error('Failed to create logs directory:', err.message);
    }
  }
}

const logFile = path.join(logsDir, 'app.log');

function timestamp() {
  return new Date().toISOString();
}

function formatLine(level, context, message, data) {
  const entry = {
    timestamp: timestamp(),
    level,
    context,
    message,
    ...(data ? { data } : {}),
  };
  return JSON.stringify(entry);
}

function writeToFile(line) {
  if (isVercel) return; // Skip file logging on Vercel
  
  fs.appendFile(logFile, line + '\n', (err) => {
    if (err) console.error('Logger write error:', err.message);
  });
}

function log(level, context, message, data) {
  const line = formatLine(level, context, message, data);

  // Console output with color
  const colors = {
    INFO: '\x1b[36m',   // cyan
    WARN: '\x1b[33m',   // yellow
    ERROR: '\x1b[31m',  // red
    DEBUG: '\x1b[90m',  // gray
  };
  const reset = '\x1b[0m';
  const color = colors[level] || '';

  console.log(`${color}[${level}]${reset} [${context}] ${message}`, data ? JSON.stringify(data) : '');
  writeToFile(line);
}

const logger = {
  info: (context, message, data) => log('INFO', context, message, data),
  warn: (context, message, data) => log('WARN', context, message, data),
  error: (context, message, data) => log('ERROR', context, message, data),
  debug: (context, message, data) => log('DEBUG', context, message, data),
};

module.exports = logger;
