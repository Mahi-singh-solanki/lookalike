const socket = io();

const joinScreen = document.getElementById('join-screen');
const canvasScreen = document.getElementById('canvas-screen');
const joinForm = document.getElementById('join-form');
const usernameInput = document.getElementById('username');
const youLabel = document.getElementById('you-label');
const statusLabel = document.getElementById('status');
const canvas = document.getElementById('tracker-canvas');
const ctx = canvas.getContext('2d');

const REGION_LETTERS = ['A', 'B', 'C', 'D', 'E'];

let me = null;
let users = new Map();
let isReady = false;

function regionFromX(x) {
  const regionWidth = canvas.width / REGION_LETTERS.length;
  const regionIndex = Math.min(Math.floor(x / regionWidth), REGION_LETTERS.length - 1);
  return REGION_LETTERS[Math.max(regionIndex, 0)];
}

function drawBackgroundRegions() {
  const regionWidth = canvas.width / REGION_LETTERS.length;
  const palette = ['#e0f2fe', '#dcfce7', '#fef3c7', '#fce7f3', '#ede9fe'];

  for (let i = 0; i < REGION_LETTERS.length; i += 1) {
    const x = i * regionWidth;
    ctx.fillStyle = palette[i];
    ctx.fillRect(x, 0, regionWidth, canvas.height);

    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, 0, regionWidth, canvas.height);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 56px Segoe UI';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(REGION_LETTERS[i], x + regionWidth / 2, 54);
  }
}

function drawCursor(user, isSelf) {
  ctx.beginPath();
  ctx.arc(user.x, user.y, 8, 0, Math.PI * 2);
  ctx.fillStyle = user.color;
  ctx.fill();

  ctx.fillStyle = '#111827';
  ctx.font = '12px Segoe UI';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  const label = `${user.username}${isSelf ? ' (you)' : ''} - ${user.region}`;
  ctx.fillText(label, user.x + 12, user.y + 10);
}

function render() {
  if (!isReady) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackgroundRegions();

  users.forEach((user) => {
    drawCursor(user, me && user.socketId === me.socketId);
  });
}

function updateLocalCursor(event) {
  if (!me) return;

  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  const x = Math.max(0, Math.min(canvas.width, (event.clientX - rect.left) * scaleX));
  const y = Math.max(0, Math.min(canvas.height, (event.clientY - rect.top) * scaleY));

  socket.emit('cursor_move', { x, y });
}

joinForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const username = usernameInput.value.trim();
  if (!username) return;
  socket.emit('join', username);
});

canvas.addEventListener('mousemove', updateLocalCursor);

socket.on('join_error', (message) => {
  statusLabel.textContent = message;
});

socket.on('joined', (payload) => {
  me = payload.you;
  users = new Map(payload.users.map((user) => [user.socketId, user]));

  if (payload.canvas?.width && payload.canvas?.height) {
    canvas.width = payload.canvas.width;
    canvas.height = payload.canvas.height;
  }

  joinScreen.classList.add('hidden');
  canvasScreen.classList.remove('hidden');
  youLabel.textContent = `You: ${me.username}`;
  statusLabel.textContent = 'Connected';

  isReady = true;
  render();
});

socket.on('user_joined', (user) => {
  users.set(user.socketId, user);
  render();
});

socket.on('cursor_moved', (userUpdate) => {
  const existing = users.get(userUpdate.socketId) || {};
  const merged = {
    ...existing,
    ...userUpdate,
  };

  if (!merged.region) {
    merged.region = regionFromX(merged.x || 0);
  }

  users.set(userUpdate.socketId, merged);

  if (me && userUpdate.socketId === me.socketId) {
    me = merged;
  }

  render();
});

socket.on('user_left', ({ socketId }) => {
  users.delete(socketId);
  render();
});

socket.on('disconnect', () => {
  statusLabel.textContent = 'Disconnected. Refresh to reconnect.';
});