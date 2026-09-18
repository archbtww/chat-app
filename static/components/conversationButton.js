const style = `
#conversationButton {
  display: flex;
  padding: 12px;
  border: none;
  width: 100%;
  background: none;
  flex-direction: row;
  gap: 20px;
  height: 70px;
}

#conversationButton.active {
  background: #ebeff2;
}

#avatar {
  border-radius: 50%;
}

#rightDiv {
  min-width: 0;
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: start;
  gap: 6px;
}

#userSpan {
  font-size: 14px;
  font-weight: 500;
}

#lastMessage {
  width: 100%;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-weight: 300;
  text-align: left;
}
`;

const html = `
<style>
${style}
</style>
<button id="conversationButton">
  <img id="avatar" />
  <div id="rightDiv">
    <span id="userSpan"></span>
    <span id="lastMessage"></span>
  </div>
</button>
`;

class ConversationButton {
  constructor(user, avatar, lastMessage = "") {
    this.host = document.createElement("div");
    this.root = this.host.attachShadow({ mode: "open" });

    this.root.innerHTML = html;

    this.userSpan = this.root.getElementById("userSpan");
    this.userSpan.innerText = user;

    this.avatar = this.root.getElementById("avatar");
    this.avatar.src = avatar;

    this.lastMessage = this.root.getElementById("lastMessage");
    this.lastMessage.innerText = lastMessage;
  }
}

export default ConversationButton;
