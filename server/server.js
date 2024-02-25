/*
* Project: Assignment 3
* File: server.js
* Author: Darsh Patel(8870657) and Bhumitkumar Patel(8847159)
* Description: A simple WebSocket server that logs messages to a file
* Date: 2024-02-24
*/

const WebSocket = require("ws");
const fs = require("fs");

const port = process.argv[2] || 3000;
const connectedClients = new Set(); // Set to store connected client usernames

/*
* Function: readLogConfig(configFilePath)
* Parameters: configFilePath - the path to the logging configuration file
* Description: Reads the logging configuration from a file
* Return values: The logging configuration as a JSON object
*/
function readLogConfig(configFilePath) {
    try {
      const configData = fs.readFileSync(configFilePath);
      return JSON.parse(configData);
    } catch (err) {
      console.error("Error reading log config file:", err);
      return null;
    }
  }
  
/*
* Function: function saveLog(logFilePath, logData)
* Parameters: logFilePath - the path to the log file, logData - the log data to be saved
* Description: Appends log data to a log file
* Return values: None
*/
function saveLog(logFilePath, logData) {
    let logMessage = "";
    const logConfig = readLogConfig(logConfigFilePath);
    // Check the logging format specified in the configuration
    switch (logConfig.logFormat.toLowerCase()) {
        case "json":
        // Log in JSON format
        logMessage = JSON.stringify(logData) + "\n";
        logMessage = logMessage.replace(/\\/g, ""); // Remove backslashes from the JSON string
        break;
        case "plaintext":
        // Log in plaintext format
        logMessage = `${logData.timestamp} [${logData.level}] ${logData.username}: ${logData.message}\n`;
        break;
        case "xml":
        // Log in XML format
        logMessage = `<log><timestamp>${logData.timestamp}</timestamp><level>${logData.level}</level><username>${logData.username}</username><message>${logData.message}</message></log>\n`;
        break;
        default:
        logMessage = `${logData.timestamp} [${logData.level}] ${logData.username}: ${logData.message}\n`;
        break;
    }

    // Append the log message to the log file
  fs.appendFile(logFilePath, logMessage, (err) => {
    if (err) {
      console.error("Error logging message:", err);
    }
  });
}

// WebSocket server setup
const wss = new WebSocket.Server({ port: port });

wss.on("connection", function connection(ws) {
  console.log("Client connected");
  ws.login = false;
  ws.on("message", function incoming(message) {
    const decodedMessage = Buffer.from(message).toString("utf8");

    
  });

  ws.on("close", function close() {
    console.log("Client disconnected");
  });
});

console.log(`Server running on port ${port}`);