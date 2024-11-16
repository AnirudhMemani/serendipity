import http from 'http';
import { Server, Socket } from 'socket.io';
import { UserManager } from './managers/UserManger.js';

const server = http.createServer(http);
const port = parseInt(process.env.PORT || '3000');
const allowedHosts = process.env.ALLOWED_HOSTS || '';

const io = new Server(server, {
    cors: {
        origin: allowedHosts.split(','),
    },
});

const userManager = new UserManager();

io.on('connection', (socket: Socket) => {
    console.log('a user connected');
    userManager.addUser('randomName', socket);
    socket.on('disconnect', () => {
        console.log('user disconnected');
        userManager.removeUser(socket.id);
    });
});

server.listen(port, () => {
    console.log(`${new Date().toLocaleTimeString()} Listening on port ${port}`);
});
