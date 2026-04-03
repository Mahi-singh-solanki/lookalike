import express from 'express';
import { createServer } from 'http';
import { appendFile, writeFile } from 'fs/promises';
import path from 'path';
import { Server } from 'socket.io';

const PORT = Number(process.env.PORT ?? 3000);
const LOG_FILE = path.join(__dirname, 'region-movement.log');
const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 600;
const REGION_COUNT = 5;
const REGION_LETTERS = ['A', 'B', 'C', 'D', 'E'];

type RegionLetter = (typeof REGION_LETTERS)[number];

interface CursorState {
  x: number;
  y: number;
}

interface UserState {
  socketId: string;
  username: string;
  x: number;
  y: number;
  region: RegionLetter;
  color: string;
}

interface MovePayload {
  x: number;
  y: number;
}

const app = express();
const server = createServer(app);
const io = new Server(server);
const usersBySocketId = new Map<string, UserState>();

app.use(express.static(path.join(__dirname, 'public')));

async function ensureLogFile(): Promise<void> {
  try {
    await appendFile(LOG_FILE, '');
  } catch {
    await writeFile(LOG_FILE, '', 'utf8');
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function regionFromX(x: number): RegionLetter {
  const safeX = clamp(x, 0, CANVAS_WIDTH - 1);
  const regionWidth = CANVAS_WIDTH / REGION_COUNT;
  const regionIndex = Math.min(Math.floor(safeX / regionWidth), REGION_COUNT - 1);
  return REGION_LETTERS[regionIndex];
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

async function writeRegionLog(username: string, fromRegion: RegionLetter, toRegion: RegionLetter): Promise<void> {
  const line = `${username} at ${formatTime(new Date())} went to region ${toRegion.toLowerCase()} from region ${fromRegion.toLowerCase()}`;
  await appendFile(LOG_FILE, `${line}\n`, 'utf8');
  console.log(line);
}

function pickColorFromName(username: string): string {
  const colors = ['#d9480f', '#2f9e44', '#1971c2', '#5f3dc4', '#c2255c', '#0b7285'];
  const hash = username
    .trim()
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

io.on('connection', (socket) => {
  socket.on('join', (rawUsername: string) => {
    const username = String(rawUsername ?? '').trim().slice(0, 24);
    if (!username) {
      socket.emit('join_error', 'Username is required.');
      return;
    }

    const initialRegion = regionFromX(CANVAS_WIDTH / 2);
    const user: UserState = {
      socketId: socket.id,
      username,
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      region: initialRegion,
      color: pickColorFromName(username),
    };

    usersBySocketId.set(socket.id, user);

    socket.emit('joined', {
      you: user,
      users: Array.from(usersBySocketId.values()),
      canvas: {
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
      },
    });

    socket.broadcast.emit('user_joined', user);
  });

  socket.on('cursor_move', async (payload: MovePayload) => {
    const user = usersBySocketId.get(socket.id);
    if (!user) {
      return;
    }

    const x = clamp(Number(payload.x ?? 0), 0, CANVAS_WIDTH);
    const y = clamp(Number(payload.y ?? 0), 0, CANVAS_HEIGHT);
    const nextRegion = regionFromX(x);
    const previousRegion = user.region;

    user.x = x;
    user.y = y;
    user.region = nextRegion;

    io.emit('cursor_moved', {
      socketId: user.socketId,
      username: user.username,
      x,
      y,
      region: nextRegion,
      color: user.color,
    });

    if (nextRegion !== previousRegion) {
      writeRegionLog(user.username, previousRegion, nextRegion).catch((error) => {
        console.error('Failed to write movement log:', error);
      });
    }
  });

  socket.on('disconnect', () => {
    const user = usersBySocketId.get(socket.id);
    if (!user) {
      return;
    }

    usersBySocketId.delete(socket.id);
    socket.broadcast.emit('user_left', { socketId: socket.id });
  });
});

async function start(): Promise<void> {
  await ensureLogFile();
  server.listen(PORT, () => {
    console.log(`Cursor tracker server running at http://localhost:${PORT}`);
    console.log(`Logs will be written to ${LOG_FILE}`);
  });
}

start().catch((error) => {
  console.error('Server failed to start:', error);
  process.exit(1);
});
