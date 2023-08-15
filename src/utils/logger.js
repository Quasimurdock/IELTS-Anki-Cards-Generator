const fs = require("fs");
const LOG_FILE = "log_html2notes.txt";
function writeToLog(message) {
  const caller = arguments.callee.caller;
  let callerName = caller.name;
  if (caller && callerName === "") {
    callerName = "anonymous arrow function";
  }
  const logMessage = `[${new Date().toLocaleString()}] - ${message} - [${callerName}]\n`;
  console.log(logMessage);
  fs.appendFile("src/output/log/" + LOG_FILE, logMessage, (err) => {
    if (err) {
      console.error("[LOG-ERR] Failed to write to log file:", err);
    }
  });
}

module.exports = writeToLog;
