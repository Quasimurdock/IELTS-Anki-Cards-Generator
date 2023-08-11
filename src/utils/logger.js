const fs = require("fs");
const LOG_FILE = "log_html2notes.txt";
function writeToLog(message) {
  console.log(message);
  const logMessage = `[${new Date().toLocaleString()}] ${message}\n`;
  fs.appendFile("src/output/log/" + LOG_FILE, logMessage, (err) => {
    if (err) {
      console.error("[LOG-ERR] Failed to write to log file:", err);
    }
  });
}

module.exports = writeToLog;
