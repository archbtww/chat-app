"use strict";

function register() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  fetch("/reg", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  }).then((response) => {
    if (response.status === 200) {
      window.location.reload();
    } else {
      document.getElementById("registerError").hidden = false;
    }
  });
}
function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  window.sessionStorage.setItem("username", username);

  fetch("/log", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  }).then((response) => {
    if (response.status === 200) {
      response.json().then((data) => {
        window.sessionStorage.setItem("token", data.token);
        window.location.pathname = "/chat";
      });
    } else {
      document.getElementById("loginError").hidden = false;
    }
  });
}

const username = window.sessionStorage.getItem("username");

let socket;

let currentChat;

const conversations = new Map();

class Conversation {
  constructor(user) {
    this.user = user;

    this.div = document.createElement("div");
    this.div.id = "c$" + this.user;
    this.div.hidden = true;

    this.btn = document.createElement("button");
    this.btn.innerText = this.user;
    this.btn.addEventListener("click", () => {
      currentChat?.hide();
      this.show();
      currentChat = this;

      socket.send(JSON.stringify({ type: 0, conversation: this.user }));
    });

    this.messages = new Map();

    document.getElementById("conversations").appendChild(this.btn);
    document.getElementById("messages").appendChild(this.div);

    conversations.set(user, this);
  }

  hide() {
    this.div.hidden = true;
    this.btn.style.color = "";
  }

  show() {
    this.div.hidden = false;
    this.btn.style.color = "#22ff99";
  }
}

class Message {
  constructor(id, from, to, timestamp) {
    this.id = id;
    this.from = from;
    this.to = to;
    this.timestamp = timestamp;
  }
}

function connectSocket(token) {
  socket = new WebSocket(`ws://localhost:3000/ws?token=${token}`);
  socket.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "conversations") {
      const conversations = data.conversations;
      conversations.forEach((conversation) => {
        const conv = new Conversation(conversation);
      });
    } else {
      for (let message of data) {
        const messageElement = document.createElement("p");
        const user =
          message.from_username === username
            ? message.to_username
            : message.from_username;
        messageElement.innerText =
          message.from_username + ": " + message.message;
        const conversation = conversations.get(user) ?? new Conversation(user);
        if (!conversation.messages.has(message.id)) {
          conversation.messages.set(
            message.id,
            new Message(
              message.id,
              message.from_username,
              message.to_username,
              message.timestamp,
            ),
          );
          conversation.div.appendChild(messageElement);
        }
      }
    }
  });
}
function sendMessage(socket, toUsername, message) {
  const messageElement = document.createElement("p");
  messageElement.innerText = `You: ${message}`;
  let conversation =
    conversations.get(toUsername) ?? new Conversation(toUsername);
  conversation.div.appendChild(messageElement);
  socket.send(JSON.stringify({ type: 1, to: toUsername, message: message }));
}
