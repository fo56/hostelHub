import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

let io: Server | null = null;

export const initSocket = (server: HttpServer): Server => {
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

  io = new Server(server, {
    cors: {
      origin: FRONTEND_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`⚡ WebSockets: Client connected (${socket.id})`);

    // Optional: Allow admins to join a specific room for live updates
    socket.on('join_admin_room', () => {
      socket.join('admin_room');
      console.log(`🔑 Socket ${socket.id} joined admin_room`);
    });

    // Required: Allow users (admins and students) to join their hostel's room for targeted updates
    socket.on('join_hostel_room', (hostelId: string) => {
      socket.join(`hostel_${hostelId}`);
      console.log(`🏠 Socket ${socket.id} joined hostel_${hostelId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 WebSockets: Client disconnected (${socket.id})`);
    });
  });

  return io;
};

// Singleton getter to trigger real-time events anywhere in your app
export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io has not been initialized! Call initSocket(server) first.');
  }
  return io;
};