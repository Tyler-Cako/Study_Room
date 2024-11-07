import express from 'express';
import bcrypt from 'bcryptjs';
import db from './db';
import path from 'path';
import {Server} from 'socket.io';
import {io as clientIo} from 'socket.io-client';
import { formatMessage } from './public/js/formatDate';
import { getActiveUser, exitRoom, newUser, getIndividualRoomUsers } from './public/js/userHelper';

const app = express();
const server = require('http').createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'dist')));
app.set('views', path.join(__dirname, 'views'));
app.use(express.json());

// testing database
db.connect()
  .then(obj => {
    console.log('Database connection successful'); // you can view this message in the docker compose logs
    obj.done(); // success, release the connection;
  })
  .catch(error => {
    console.log('ERROR:', error.message || error);
  });

// TEST API ROUTES

app.get('/', (req, res) => {
    res.redirect('/login');
});
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});
app.get('/chat', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'chat.html'));
});

app.post('/test', function (req, res) {
    const query =
      'insert into student (name, email, password) values ($1, $2, $3)  returning * ;';
    db.any(query, [
      req.body.name,
      req.body.email,
      req.body.password,
    ])
      // if query execution succeeds
      // send success message
      .then(function (data) {
        res.status(201).json({
          status: 'success',
          data: data,
          message: 'data added successfully',
        });
      })
      // if query execution fails
      // send error message
      .catch(function (err) {
        return console.log(err);
      });
  });

app.get('/get_students', (req, res) => {
    var query = 'SELECT * FROM student;';
    db.any(query)
      .then(function (data) {
        res.status(201).json({
            status: 'success',
            data: data,
            message: 'data retrieved successfully',
        });
      })
      .catch(function (error) {
        return console.log(error);
      });
});

app.listen(PORT, () => {
    console.log(`App listening on port: ${PORT}`);
});

// need a render engine - raw html is not going to cut it
// app.get('/login', (req, res) => {
//     res.send('views/login');
// });


// websocket code from tutorial, converted to TS
io.on('connection', socket => {
    console.log('a user connected');
    io.on('joinRoom', ({ username, room }) => {
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