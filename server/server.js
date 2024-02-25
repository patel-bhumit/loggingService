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
const attempts = new Map(); // Map to store login attempts

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

/* 
* Function: handleLoginAttempts(ws, username)
* Parameters: ws - the WebSocket connection, username - the username to check
* Description: Handles login attempts and bans users after 5 failed attempts
* Return values: None
*/
function handleLoginAttempts(ws, username) {
    if (attempts.has(username)) {
      if (attempts.get(username) >= 5) {
        ws.send("Error: Too many login attempts. Please try again later.");
        ws.close(); // Close the WebSocket connection
      }
    } else {
      attempts.set(username, 1);
    }
}

/* 
* Function: handleLoginRequest(ws, parsedMessage, username)
* Parameters: ws - the WebSocket connection, parsedMessage - the parsed message, username - the username to check
* Description: Handles login requests and checks if the username is already connected
* Return values: None
*/
function handleLoginRequest(ws, parsedMessage, username) {
    // check is the username is in attempts
    handleLoginAttempts(ws, parsedMessage.username);
    
    // check if the username is noisy
    handleNoisyUsers(ws, parsedMessage.username);
    // Check if the username is already connected
    if (connectedClients.has(username)) {
      ws.send(
        "Error: Username already exists. Please choose a different username."
      );
      const logData = {
        username: username,
        level: "WARN",
        message: "Username already exists. Connection rejected.",
        timestamp: new Date().toISOString(),
      };
      saveLog(logConfig.logFilePath, logData);
      attempts.set(username, attempts.get(username) + 1);
      ws.close(); // Close the WebSocket connection
    } else {

      // Construct a login message (assuming a JSON format)
      const loginMsg = {
        username: username,
        level: "INFO",
        message: "User logged in",
        timestamp: new Date().toISOString(),
      };

      // Append the login message to a log file (log.txt)
      saveLog(logConfig.logFilePath, loginMsg);

      // Echo back the username to the client
      ws.send(`Welcome, ${username}! You are now connected.`);
      ws.username = username; // Set the username for the WebSocket connection
      ws.login = true; // Set the login status for the WebSocket connection

      // Add the username to the set of connected clients
      connectedClients.add(username);
    }
}

/*
* Function: unauthorizedAccess(ws, parsedMessage)
* Parameters: ws - the WebSocket connection, parsedMessage - the parsed message
* Description: Handles unauthorized access attempts and bans users after 5 failed attempts
* Return values: None
*/
function unauthorizedAccess(ws, parsedMessage) {
  
    handleNoisyUsers(ws, parsedMessage.username);
    ws.send("Error: Please login first.");
  
    const logData = {
      username: username,
      level: "WARN",
      message: "Unauthorized access attempt detected.",
      timestamp: new Date().toISOString(),
    };
  
    saveLog(logConfig.logFilePath, logData);
  
    handleNoisyUsers(ws, parsedMessage.username);
  
    ws.close(); // Close the WebSocket connection
}

// Read logging configuration from the config file
const logConfigFilePath = "config.json";
let logConfig = readLogConfig(logConfigFilePath);
if (!logConfig) {
  console.error("Logging configuration not found. Exiting.");
  process.exit(1);
}

console.log("Logging configuration:", logConfig);

// WebSocket server setup
const wss = new WebSocket.Server({ port: port });

wss.on("connection", function connection(ws) {
  console.log("Client connected");
  ws.login = false;
  ws.on("message", function incoming(message) {
    const decodedMessage = Buffer.from(message).toString("utf8");
    try {
        // Parse the received message as JSON
        let parsedMessage;
  
        parsedMessage = parseMessage(decodedMessage);
        
  
        // Check if the message indicates a login request
        if (parsedMessage.level === "REQ" && parsedMessage.message === "login") {
          const username = parsedMessage.username; // Get username from the message
          handleLoginRequest(ws, parsedMessage, username);
        } else if ( parsedMessage.level === "REQ" && parsedMessage.message === "logout" && ws.login) {
            ws.close(); // Close the WebSocket connection
        } else if (!ws.login) {
            unauthorizedAccess(ws, parsedMessage);
        }
    }
    catch (error) {
        console.error("Error parsing message:", error);
    }
  });

  ws.on("close", function close() {
    console.log("Client disconnected");

    // Find the username associated with the WebSocket connection
    const username = ws.username;
      console.log(`Username ${username} disconnected`);

      // Remove the username from the set of connected clients
      connectedClients.delete(username);

      // Construct a logout message (assuming a JSON format)
      const logoutMsg = {
        username: username,
        level: "INFO",
        message: "User logged out",
        timestamp: new Date().toISOString(),
      };

      // Append the logout message to a log file (log.txt)
      saveLog(logConfig.logFilePath, logoutMsg);
  });
});

console.log(`Server running on port ${port}`);