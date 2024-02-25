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