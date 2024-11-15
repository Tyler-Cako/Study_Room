const express = require('express');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const path = require('path');
const dirname = path.dirname;
const db = require('./db');
const { Server } = require('socket.io');
const handlebars = require('handlebars');
const engine = require('express-handlebars');
const { createServer } = require("http");
const { fileURLToPath } = require('url');

require('dotenv').config({ path : __dirname + "/../.env"});

const PORT = process.env.PORT || 3001;

const app = express();

const server = createServer(app, {
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
//app.engine('handlebars', engine());
app.set('view engine', 'hbs');

// set Session
app.use(
  session({
    secret: 'secret_token',
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

app.get('/welcome', (req, res) => {
  res.json({status: 'success', message: 'Welcome!'});
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
    res.render('pages/register.hbs');
});

app.get('/register', (req, res) => {
    res.render('pages/register.hbs');
});

app.post('/register', async (req, res) => {
  //hash the password using bcrypt library
  const { name, email } = req.body;
  if (typeof name !== 'string') {
    res.status(400).json({ message: 'Invalid input'});
    return;
  }
  if (typeof email !== 'string' || !email.includes('@')) {
    res.status(400).json({ message: 'Invalid input'});
    return;
  }
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
    })
    .catch(function (err) {
      console.log(err)
    });
});

// Login
// const user = {
//   student_id: undefined,
//   name: undefined,
//   email: undefined,
// };

app.get('/chat', (req, res) => {
  res.render('pages/chat.hbs');
});

app.get('/login', (req, res) => {
  res.render('pages/login.hbs');
});

app.post('/login', (req, res) => {
  var email = req.body.email;
  var current_student = `select * from student where email = '${email}' LIMIT 1;`;

  db.oneOrNone(current_student)
    .then(async data => {
      // check if password from request matches with password in DB
      const match = await bcrypt.compare(req.body.password, data.password);

      if (match) {

        // req.session.id = data.student_id;
        req.session.save();

        //res.redirect('chat'); //add back once rendering fixed
        res.status(302) //temporary since rendering is broken
      }
      else {
        res.status(401).send('Invalid email or password')
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
        socket.username = username;
        socket.room = room;
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
        const { username, room } = socket;
        if (room) {
            console.log(`User ${username} disconnected from room ${room}`);
            socket.to(room).emit('userDisconnect', { id: socket.id, username: username });
        }
    });
  });

server.listen(PORT, () => {
    console.log(`App listening on port: ${PORT}`);
});
