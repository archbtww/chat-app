"use strict";

const username = window.sessionStorage.getItem("username");

const messagesDiv = document.getElementById("messages");

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
      if (!this.read) {
        this.btn.innerText = this.btn.innerText.slice(4);
        this.read = true;
      }

      socket.send(JSON.stringify({ type: 0, conversation: this.user }));
    });

    this.messages = new Map();
    this.read = true;

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
      data.conversations.forEach((conversation) => {
        new Conversation(conversation);
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
          const atBottom =
            messagesDiv.scrollHeight - messagesDiv.clientHeight <=
            messagesDiv.scrollTop + 5;
          if (atBottom) {
            conversation.scroll();
          }
          if ((conversation.div.hidden || atBottom) && conversation.read) {
            const atBottom =
              conversation.div.scrollHeight - conversation.div.clientHeight <=
              conversation.div.scrollTop + 5;
            conversation.read = false;
            conversation.btn.innerText = "* - " + conversation.btn.innerText;
          }
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

  const toUsername = currentChat.user;
  currentChat.scroll();

  socket.send(JSON.stringify({ type: 1, to: toUsername, message: message }));

  input.value = "";
}

document.getElementById("messageInput").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    sendMessage();
  }
});

document.getElementById("sendButton").addEventListener("click", () => {
  sendMessage();
});

document.getElementById("newChatButton").addEventListener("click", () => {
  const input = document.getElementById("newChatInput");
  const name = input.value.trim();
  if (!name) return;
  if (!conversations.has(name)) new Conversation(name);
  input.value = "";
});

const token = window.sessionStorage.getItem("token");
if (token) {
  connectSocket(token);
} else {
  window.location.pathname = "/login";
}
