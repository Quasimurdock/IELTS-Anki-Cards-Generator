const fs = require("fs");
const LOG_FILE = "log_html2notes.txt";
const DEFAULT_ROOT_DIR = "src/output/log/";

function write(message) {
  fs.appendFile(DEFAULT_ROOT_DIR + LOG_FILE, message, (err) => {
    if (err) {
      console.error("[LOG-ERR] WRITE TO LOG FAILED:", err);
    }
  });
}

function logFormatter(type, logTime, message, callerName) {
  const basicFormat = `[${type}] [${logTime}] - ${message}`;
  if (
    callerName === null ||
    callerName === undefined ||
    callerName === "" ||
    callerName.trim() === ""
  ) {
    return basicFormat + "\n";
  }
  return basicFormat + ` - [${callerName}]\n`;
}

function writeToLog(message) {
  const logTime = new Date().toLocaleString();
  const caller = arguments.callee.caller;
  let callerName = caller.name;
  if (caller && callerName === "") {
    callerName = "ANONYMOUS ARROW FUNCTION";
  }
  if (!fs.existsSync(DEFAULT_ROOT_DIR)) {
    try {
      fs.mkdirSync(DEFAULT_ROOT_DIR);
      const successInfo = logFormatter(
        "INFO",
        logTime,
        "DIR LOG CREATED",
        callerName
      );
      console.log(successInfo);
      write(successInfo);
    } catch (err) {
      const msg = logFormatter(
        "ERR",
        logTime,
        `MKDIR FAILED ` + err.message,
        callerName
      );
      console.err(msg);
      write(msg);
    }
  } else {
    console.log(
      logFormatter("INFO", logTime, "LOG DIR ALREADY EXISTS", callerName)
    );
  }
  const typeAndMsgArr = splitHelper(message);
  const type = typeAndMsgArr[0] ?? "ERR";
  const msgBody = typeAndMsgArr[1];
  const logMessage = logFormatter(type, logTime, msgBody, callerName);
  console.log(logMessage);
  write(logMessage);
}

function splitHelper(errMessage) {
  const regex = /\[(.*?)\]/;
  const match = errMessage.match(regex);
  if (match) {
    const prefix = match[1];
    const remaining = errMessage.replace(match[0], "").trim();
    return [prefix, remaining];
  } else {
    return [null, errMessage];
  }
}

module.exports = writeToLog;
