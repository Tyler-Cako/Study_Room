import express from 'express';
import path from 'path';
import {Server} from 'socket.io';
import {io as clientIo} from 'socket.io-client'
import { formatMessage } from './util/formatDate';
import { getActiveUser, exitRoom, newUser, getIndividualRoomUsers } from './util/userHelper';

const app = express();
const server = require('http').createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));
app.set('views', path.join(__dirname, 'views'));
app.get('/', (req, res) => {
    res.redirect('/login');
});
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});
app.get('/chat', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'chat.html'));
});
app.listen(PORT, () => {
    console.log(`App listening on port: ${PORT}`);
});

// need a render engine - raw html is not going to cut it
// app.get('/login', (req, res) => {
//     res.render('views/login');
// });


// websocket code from tutorial, converted to TS
io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room }) => {
        const user = newUser(socket.id, username, room);

        socket.join(user.room);

        // General welcome
        socket.emit('message', formatMessage("WebCage", 'Messages are limited to this room! '));

        // Broadcast everytime users connects
        socket.broadcast
            .to(user.room)
            .emit(
                'message',
                formatMessage("WebCage", `${user.username} has joined the room`)
            );

        // Current active users and room name
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getIndividualRoomUsers(user.room)
        });
    });

    // Listen for client message
    socket.on('chatMessage', msg => {
        const user = getActiveUser(socket.id);
        if (user) {
            io.to(user.room).emit('message', formatMessage(user.username, msg))
        } else {
            console.error('Cannot get messages from null active user!')
        }
    });

    // Runs when client disconnects
    socket.on('disconnect', () => {
        const user = exitRoom(socket.id);

        if (user) {
            io.to(user.room).emit(
                'message',
                formatMessage("WebCage", `${user.username} has left the room`)
            );

            // Current active users and room name
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getIndividualRoomUsers(user.room)
            });
        }
    });
});