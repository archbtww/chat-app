"use strict";

const username = window.sessionStorage.getItem("username");
const messagesDiv = document.getElementById("messages");
const conversationsDiv = document.getElementById("conversations");

let socket;
let currentChat;

const conversations = new Map();

class Conversation {
  constructor(user) {
    this.user = user;

    this.div = document.createElement("div");
    this.div.hidden = true;

    this.btn = document.createElement("button");
    this.btn.innerText = this.user;
    this.btn.addEventListener("click", () => {
      currentChat?.hide();
      this.show();
      currentChat = this;

      this.markAsRead();

      socket.send(JSON.stringify({ type: 0, conversation: this.user }));

      this.scroll();
    });

    this.messages = new Set();
    this.read = true;

    conversationsDiv.appendChild(this.btn);
    messagesDiv.appendChild(this.div);

    conversations.set(user, this);
  }

  hide() {
    this.div.hidden = true;
    this.btn.classList.remove("active");
  }

  show() {
    this.div.hidden = false;
    this.btn.classList.add("active");

    document.getElementById("currentChat").innerText = this.user;
  }

  markAsRead() {
    if (!this.read) {
      this.btn.innerText = this.btn.innerText.slice(4);
      this.read = true;
    }
  }

  scroll() {
    messagesDiv.scrollTo(0, messagesDiv.scrollHeight);
  }
}

function isAtBottom() {
  return (
    messagesDiv.scrollHeight - messagesDiv.clientHeight <=
    messagesDiv.scrollTop + 5
  );
}

function connectSocket(token, ip) {
  socket = new WebSocket(`ws://${ip}/ws?token=${token}`);
  socket.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "conversations") {
      for (let conversation of data.conversations) {
        new Conversation(conversation);
      }
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
          conversation.messages.add(message.id);
          const bottom = isAtBottom();
          if ((conversation.div.hidden || !bottom) && conversation.read) {
            conversation.read = false;
            conversation.btn.innerText = "* - " + conversation.btn.innerText;
          }
          conversation.div.appendChild(messageElement);
          if (bottom) {
            conversation.scroll();
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

let newChatButton = document.getElementById("newChatButton");
let newChatInput = document.getElementById("newChatInput");

document.getElementById("newChatButton").addEventListener("click", () => {
  if (newChatInput.hidden) {
    newChatButton.classList.add("active");
    newChatInput.hidden = false;
  } else {
    newChatButton.classList.remove("active");
    newChatInput.hidden = true;
  }
});

newChatInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    const name = newChatInput.value.trim();
    if (!name) return;
    if (!conversations.has(name)) new Conversation(name);
    newChatInput.value = "";
    newChatButton.classList.remove("active");
    newChatInput.hidden = true;
  }
});

messagesDiv.addEventListener("scroll", () => {
  if (currentChat && isAtBottom()) {
    currentChat.markAsRead();
  }
});

const token = window.sessionStorage.getItem("token");
if (token !== null) {
  connectSocket(token, "localhost:3000");
} else {
  window.location.pathname = "/";
}
