import { Manager, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? "http://localhost:3000";

interface ConnectedClient {
  id: string;
  fullName: string;
  email: string;
  roles: string[];
}

interface ConnectionPayload {
  clientId: string;
  user: ConnectedClient;
}

interface ChatMessage {
  fullName?: string;
  from?: string;
  message?: string;
  text?: string;
}

type Status = "disconnected" | "connecting" | "connected" | "error";

let socket: Socket | null = null;

export const isSocketConnected = (): boolean => {
  return socket?.connected ?? false;
};

export const disconnectFromServer = () => {
  socket?.disconnect();
};

export const connectToServer = (token: string) => {
  const manager = new Manager(`${SOCKET_URL}/socket.io/socket.io.min.js`, {
    extraHeaders: token ? { authorization: token } : {},
  });

  socket?.removeAllListeners();
  socket = manager.socket("/messages");

  addListeners();
};

const addListeners = () => {
  const statusBadge = document.querySelector<HTMLDivElement>("#statusBadge")!;
  const statusText =
    statusBadge.querySelector<HTMLSpanElement>(".status-text")!;
  const connectBtn = document.querySelector<HTMLButtonElement>("#connectBtn")!;
  const tokenInput = document.querySelector<HTMLInputElement>("#tokenInput")!;
  const connectPanel = document.querySelector<HTMLElement>("#connectPanel")!;
  const workspace = document.querySelector<HTMLElement>("#workspace")!;
  const clientList = document.querySelector<HTMLUListElement>("#clientList")!;
  const messagesEl = document.querySelector<HTMLDivElement>("#messages")!;
  const messagesEmpty =
    document.querySelector<HTMLParagraphElement>("#messagesEmpty")!;
  const messageForm = document.querySelector<HTMLFormElement>("#messageForm")!;
  const messageInput =
    document.querySelector<HTMLInputElement>("#messageInput")!;

  if (!socket) return;

  const setStatus = (state: Status, label: string) => {
    statusBadge.dataset.state = state;
    statusText.textContent = label;
  };

  setStatus("connecting", "Connecting…");
  connectBtn.disabled = true;
  tokenInput.disabled = true;

  socket.on("connect", () => {
    setStatus("connected", `Connected · ${socket?.id}`);
    connectBtn.textContent = "Disconnect";
    connectBtn.disabled = false;
    connectBtn.classList.remove("btn--primary");
    connectBtn.classList.add("btn--danger");
    connectPanel.classList.add("is-collapsed");
    workspace.hidden = false;
  });

  socket.on("disconnect", () => {
    setStatus("disconnected", `Disconnected`);
    connectBtn.textContent = "Connect";
    connectBtn.disabled = false;
    connectBtn.classList.remove("btn--danger");
    connectBtn.classList.add("btn--primary");
    tokenInput.disabled = false;
    workspace.hidden = true;
    connectPanel.classList.remove("is-collapsed");
    clientList.innerHTML = "";
  });

  socket.on("connect_error", (err) => {
    setStatus("error", `Error: ${err.message}`);
    connectBtn.textContent = "Connect";
    connectBtn.disabled = false;
    connectBtn.classList.remove("btn--danger");
    connectBtn.classList.add("btn--primary");
    tokenInput.disabled = false;
    workspace.hidden = true;
    connectPanel.classList.remove("is-collapsed");
  });

  socket.on("clients-updated", (incomingClients: ConnectionPayload[]) => {
    renderClients(
      clientList,
      incomingClients.map((c) => c.user),
    );
  });

  messageForm.onsubmit = (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();

    if (!text || !socket?.connected) return;

    socket.emit("message-from-client", {
      message: text,
      from: socket.id,
    });

    messageInput.value = "";
  };

  socket.on("message-from-server", (payload: ChatMessage) => {
    renderMessage(
      messagesEl,
      messagesEmpty,
      payload,
      payload.from === socket?.id,
      payload.fullName!,
    );
  });

  socket.on("message", (payload: ChatMessage) => {
    renderMessage(
      messagesEl,
      messagesEmpty,
      payload,
      payload.from === socket?.id,
      payload.fullName!,
    );
  });
};

function renderClients(
  clientList: HTMLUListElement,
  clients: ConnectedClient[],
) {
  clientList.innerHTML = "";

  if (clients.length === 0) {
    const empty = document.createElement("li");
    empty.className = "client-list-empty";
    empty.textContent = "No clients connected.";
    clientList.appendChild(empty);
    return;
  }

  for (const client of clients) {
    const item = document.createElement("li");
    item.className = "client-item";

    const dot = document.createElement("span");
    dot.className = "client-dot";

    const label = document.createElement("span");
    label.textContent =
      typeof client === "string" ? client : (client.fullName ?? client.id);

    item.append(dot, label);
    clientList.appendChild(item);
  }
}

function renderMessage(
  messagesEl: HTMLDivElement,
  messagesEmpty: HTMLParagraphElement,
  msg: ChatMessage,
  isOwn: boolean,
  fullName: string,
) {
  messagesEmpty.hidden = true;

  const bubble = document.createElement("div");
  bubble.className = isOwn ? "message is-own" : "message";

  const from = document.createElement("span");
  from.className = "message-from";
  from.textContent = isOwn ? "You" : (fullName ?? "Anonymous");

  const text = document.createElement("p");
  text.className = "message-text";
  text.textContent = msg.message ?? msg.text ?? "";

  bubble.append(from, text);
  messagesEl.appendChild(bubble);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}
