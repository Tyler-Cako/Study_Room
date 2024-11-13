declare module "express-session" {
  interface SessionData {
    user?: { 
      student_id: string,
      email: string;
      name: string
    };
  }
}
import express from 'express';
import bcrypt from 'bcryptjs';
import session from 'express-session';
import path, { dirname } from 'path';
import db from './db';
import { Server } from 'socket.io';
import { engine } from 'express-handlebars'; 
import bodyParser from 'body-parser';

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


app.engine('hbs', engine({
  extname: 'hbs',
  layoutsDir: path.join(__dirname, 'views', 'layouts'),
  partialsDir: path.join(__dirname, 'views', 'partials'),
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

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

// HANDLEBARS ROUTES // 
app.get('/add-class-page', (req, res) => {
  res.render('add_class', { title: 'Add Class', user: req.session.user, layout: false });
  
});

// <---- ACTUAL API ROUTES ---->
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, './views/register.html'));
});

app.get('/chat', (req, res) => {
    res.sendFile(path.join(__dirname, './views/chat.html'));
});
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, './views/register.html'));
});

// Register
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
      console.log("Successfully registered user:", data);
      res.redirect('/login');  // Redirect to the login page
    })
      .catch(function (err) {
        console.log(err);
        //res.redirect('/register');
      });
});
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, './views/login.html'));
});

const user = {
  student_id: undefined,
  name: undefined,
  email: undefined,
};

app.post('/login', (req, res) => {
  var email = req.query.email;
  var current_student = `select * from student where email = '${email}' LIMIT 1;`;
  db.one(current_student)
    .then(async data => {
      // check if password from request matches with password in DB
      const match = await bcrypt.compare(req.body.password, data.password);
      if (match) {
        user.student_id = data.student_id;
        user.name = data.name;
        user.email = data.email;
        req.session.user = user;
        req.session.save();
        res.sendFile(path.join(__dirname, './views/chat.html'));
      }
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Server error');
    });
});

// Authentication middleware.
const auth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
};
app.use(auth);

app.post('/add', (req, res)=> {
  const course_id = req.body.class;
  const student_id = req.session.user.student_id;

  db.tx(async t => {
    const {is_added} = await t.one(
      `SELECT
        * from student_to_class 
      WHERE 
      course_id = $1 AND
      student_id = $2`,
      [course_id, student_id]
    );

    if (is_added) {
      throw new Error("You are already in this chat.");
    }

    // There are either no prerequisites, or all have been taken.
    await t.none(
      'INSERT INTO student_to_class (course_id, student_id) VALUES ($1, $2);',
      [course_id, student_id]
    );
    return `Successfully added to the chat for course ${course_id}`;
  })
  .then(message => {
    res.render('add_class', { message, error: false }); // Success message
  })
  .catch(err => {
    res.render('add_class', { message: err.message, error: true }); // Error message
  });
});

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