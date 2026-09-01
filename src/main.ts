import './style.css'
import {
  connectToServer,
  disconnectFromServer,
  isSocketConnected,
} from './socket-client'

const app = document.querySelector<HTMLDivElement>('#app')!

app.innerHTML = `
  <div class="workbench">
    <header class="wb-header">
      <span class="wb-eyebrow">SOCKET · TEST CLIENT</span>
      <h1 class="wb-title">Socket Console</h1>
    </header>

    <section class="panel panel--connect" id="connectPanel">
      <label class="field">
        <span class="field-label">TOKEN</span>
        <input id="tokenInput" class="field-input" type="text" placeholder="Paste your token here" autocomplete="off" />
      </label>
      <button id="connectBtn" class="btn btn--primary" type="button">Connect</button>
      <div class="status" id="statusBadge" data-state="disconnected">
        <span class="status-dot"></span>
        <span class="status-text">Disconnected</span>
      </div>
    </section>

    <section class="workspace" id="workspace" hidden>
      <aside class="panel panel--clients">
        <span class="panel-label">CONNECTED CLIENTS</span>
        <ul class="client-list" id="clientList"></ul>
      </aside>

      <section class="panel panel--chat">
        <div class="messages" id="messages">
          <p class="messages-empty" id="messagesEmpty">No messages yet.</p>
        </div>
        <form id="messageForm" class="message-form">
          <input id="messageInput" class="field-input" type="text" placeholder="Write a message…" autocomplete="off" />
          <button class="btn btn--primary btn--send" type="submit">Send</button>
        </form>
      </section>
    </section>
  </div>
`

const tokenInput = document.querySelector<HTMLInputElement>('#tokenInput')!
const connectBtn = document.querySelector<HTMLButtonElement>('#connectBtn')!

connectBtn.addEventListener('click', () => {
  if (isSocketConnected()) {
    disconnectFromServer()
    return
  }

  const token = tokenInput.value.trim()
  if (token.length <= 0) {
    alert('Please enter a valid JWT token')
    tokenInput.focus()
    return
  }

  connectToServer(token)
})