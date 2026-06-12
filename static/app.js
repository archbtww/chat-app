"use strict";

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

      document.getElementById("currentChat").innerText = this.user;

      socket.send(JSON.stringify({ type: 0, conversation: this.user }));
    });

    this.messages = new Map();

    document.getElementById("conversations").appendChild(this.btn);
    document.getElementById("messages").appendChild(this.div);

    conversations.set(user, this);
  }

  hide() {
    this.div.hidden = true;
    this.btn.style["font-weight"] = "normal";
  }

  show() {
    this.div.hidden = false;
    this.btn.style["font-weight"] = "bold";
  }

  scroll() {
    const messagesDiv = document.getElementById("messages");
    messagesDiv.scrollTo(0, messagesDiv.scrollHeight);
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
          (message.from_username === username ? "You" : message.from_username) +
          ": " +
          message.message;
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
          conversation.scroll();
        }
      }
    }
  });
}
function sendMessage() {
  if (!currentChat) return;

  const input = document.getElementById("messageInput");
  const message = input.value.trim();
  if (!message) return;

  const messageElement = document.createElement("p");
  messageElement.innerText = `You: ${message}`;

  const toUsername = currentChat.user;
  let conversation =
    conversations.get(toUsername) ?? new Conversation(toUsername);
  conversation.div.appendChild(messageElement);
  conversation.scroll();

  socket.send(JSON.stringify({ type: 1, to: toUsername, message: message }));

  input.value = "";
}

document.getElementById("messageInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    sendMessage();
  }
});

document.getElementById("sendButton").addEventListener("click", () => {
  sendMessage();
});

const token = window.sessionStorage.getItem("token");
if (token) {
  connectSocket(token);
} else {
  window.location.pathname = "/login";
}
