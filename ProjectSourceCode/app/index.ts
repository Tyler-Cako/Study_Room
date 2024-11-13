import express from 'express';
import bcrypt from 'bcryptjs';
import session from 'express-session';
import path, { dirname } from 'path';
import db from './db';
import { Server } from 'socket.io';
import handlebars from 'handlebars';
import { engine } from 'express-handlebars';

const PORT = process.env.PORT || 3000;

const app = express();
const server = require('http').createServer(app, {
    cors: {
        origin: process.env.NODE_ENV === "production" ? false :
        [`http://localhost:${PORT}`]
    }
});
const io = new Server(server);

// app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));
// app.use('/socket.io', express.static(path.join(__dirname, './node_modules/socket.io')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'dist')));
app.set('views', path.join(__dirname, 'views'));
app.use(express.json());

// Register `handlebars` as our view engine using its bound `engine()` function.
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');

// set Session
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: true,
    resave: true,
  })
  );

// testing database
db.connect()
  .then(obj => {
    console.log('Database connection successful'); // you can view this message in the docker compose logs
    obj.done(); // success, release the connection;
  })
  .catch(error => {
    console.log('ERROR:', error.message || error);
});

// <---- TEST API ROUTES ---->

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

// testing database
db.connect()
  .then(obj => {
    console.log('Database connection successful'); // you can view this message in the docker compose logs
    obj.done(); // success, release the connection;
  })
  .catch(error => {
    console.log('ERROR:', error.message || error);
  });


// <---- ACTUAL API ROUTES ---->
app.get('/', (req, res) => {
    res.render('register.hbs');
});

app.get('/chat', (req, res) => {
    res.sendFile(path.join(__dirname, './views/chat.html'));
});

// Register
app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', async (req, res) => {
  //hash the password using bcrypt library
  const hash = await bcrypt.hash(req.body.password, 10);
  
  const query = 
    'insert into student (name, email, password) values ($1, $2, $3)  returning * ;';

  db.any(query, [
    req.body.name,
    req.body.email,
    hash,
  ])

    .then(function (data) {
      res.status(201).json({});
      res.redirect('login');
    })
    .catch(function (err) {
      console.log(err);
      res.redirect('register');
    });
});

// Login
// const user = {
//   student_id: undefined,
//   name: undefined,
//   email: undefined,
// };

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  var email = req.body.email;
  var current_student = `select * from student where email = '${email}' LIMIT 1;`;

  db.one(current_student)
    .then(async data => {
      // check if password from request matches with password in DB
      const match = await bcrypt.compare(req.body.password, data.password);

      if (match) {

        // req.session.id = data.student_id;
        req.session.save();

        res.redirect('chat');
      }
    })
});

// Authentication middleware.
const auth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
};

app.use(auth);

io.on('connection', (socket) => {
    // Join a room
    socket.on('joinRoom', ({ username, room }) => {
        socket.join(room);
        (socket as any).username = username;
        (socket as any).room = room;
        console.log(`User ${username} joined room ${room}`);

        // Emit to the room that a user has joined
        socket.to(room).emit('userJoined', { id: socket.id, msg: `${username} has joined the room` });
    });
    // Listen for chat messages
    socket.on('chatMessage', ({ room, msg }) => {
        const id_msg = { id: socket.id, msg: msg };
        io.to(room).emit('chatMessage', id_msg);
    });
    socket.on('disconnect', () => {
        const { username, room } = (socket as any);
        if (room) {
            console.log(`User ${username} disconnected from room ${room}`);
            socket.to(room).emit('userDisconnect', { id: socket.id, username: username });
        }
    });
  });

server.listen(PORT, () => {
    console.log(`App listening on port: ${PORT}`);
});