const { Server } = require('socket.io');
let io;
const initSocket = (server) => {
  io = new Server(server, { cors: { origin: process.env.FRONTEND_URL||'http://localhost:3000', credentials: true }});
  io.on('connection', (socket) => {
    socket.on('join_dashboard', () => socket.join('dashboard'));
  });
};
const getIO = () => io;
module.exports = { initSocket, getIO };
