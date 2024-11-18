import express, { Express, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import session, { SessionOptions, SessionData } from 'express-session';
import path, { dirname } from 'path';
import db from './db';
import { Server } from 'socket.io';
import handlebars from 'handlebars';
import { engine } from 'express-handlebars';
import bodyParser from 'body-parser'

const PORT = process.env.PORT || 3000;

const app: Express = express();
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
app.set('views', path.join(__dirname, '../views'));
app.use(bodyParser.json());
app.use(express.json());

// Register `handlebars` as our view engine using its bound `engine()` function.
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');

// set Session
const sessionOptions: SessionOptions = {
  secret: 'secret_token',
  resave: false,
  saveUninitialized: true,
}
declare module "express-session" {
  interface SessionData {
    user: {
      student_id: number
      name: string
      email: string
    }
  }
}
app.use(session(sessionOptions));
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// Authentication middleware.
const auth = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.session.user) {
    return res.redirect('pages/login.hbs');
  }
  next();
};

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

// HANDLEBARS ROUTES // 
app.get('/add-class-page', (req, res) => {
  res.render('add_class', { title: 'Add Class', user: req.session.user, layout: false });
  
});

// <---- ACTUAL API ROUTES ---->
app.get('/', auth, function (req, res) {
  res.redirect('/chat');
});

app.get('/register', (req, res) => {
    res.render('pages/register.hbs');
});

app.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { name, email } = req.body;
  if (typeof name !== 'string') {
    res.status(400).json({ message: 'Invalid input'});
    return;
  }
  if (typeof email !== 'string' || !email.includes('@')) {
    res.status(400).json({ message: 'Invalid input'});
    return;
  }

  //hash the password using bcrypt library
  const hash: string = await bcrypt.hash(req.body.password, 10);
  
  const query: string = 
    'insert into student (name, email, password) values ($1, $2, $3)  returning * ;';

  db.any(query, [
    req.body.name as string,
    req.body.email as string,
    hash,
  ])

    .then((data: any) => {
      res.status(201);
      res.redirect('/login');
    })
    .catch((err: Error) => {
      console.log(err);
      res.status(400);
      res.redirect('/register');
    });
});


// Login
interface User {
  student_id: number,
  name: string,
  email: string,
};

app.get('/chat', (req, res) => {
  res.render('pages/chat.hbs');
});

app.get('/login', (req, res) => {
  res.render('pages/login.hbs');
});

app.post('/login', (req: Request, res: Response, next: NextFunction) => {
  // req.session.regenerate(function (err) {
  //   if (err) next(err)
  // })
  const email: string = req.body.email;
  const password: string = req.body.password;
  const query: string = 'select * from student where student.email = $1 LIMIT 1;';
  const values: string[] = [email];

  db.oneOrNone(query, values)
    .then(async (data: { student_id: number; name: string; email: string; password: string }) => {
      // check if password from request matches with password in DB
      const match: boolean = await bcrypt.compare(password, data.password);

      if (match) {
        const user: User = {
          student_id: data.student_id,
          name: data.name,
          email: data.email
        };

        req.session.user = user;
        req.session.save();

        res.redirect('/chat');
      } else {
        console.log('Incorrect email or password');
        res.redirect('/login');
      }
    })
    .catch((err: Error) => {
      console.log(err);
      res.redirect('/login');
    });
});

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

module.exports = { app, server }