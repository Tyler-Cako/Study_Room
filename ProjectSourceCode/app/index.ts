import express, { Express, Request, Response, NextFunction, response } from 'express';
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
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json());
app.use(express.json());

// Register `handlebars` as our view engine using its bound `engine()` function.
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');

// set Session
const sessionOptions: SessionOptions = {
  secret: "secret_token", //process.env.SESSION_SECRET as string,
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
  if (req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
};

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
app.get('/', auth, function (req, res) {
    res.redirect('/chat');
});

app.get('/register', (req, res) => {
  res.render('pages/register.hbs');
});

app.post('/register', async (req: Request, res: Response): Promise<void> => {
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
      console.log(`Registered user with the following credientials:\n
        name: ${req.body.name}, email: ${req.body.email}`)
      res.status(201);
      res.redirect('/login');
    })
    .catch((err: Error) => {
      console.log(err);
      res.redirect('/register');
    });
});

// Login
interface User {
  student_id: number,
  name: string,
  email: string,
};

app.get('/chat', auth, function (req, res) {
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

  db.one(query, values)
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
        console.log('Password does not match email');
        res.redirect('/login');
      }
    })
    .catch((err: Error) => {
      console.log(err);
      res.redirect('/login');
    });
});

app.get('/user-data', auth, (req: Request, res: Response) => {
  if (req.session.user) {
    res.json(req.session.user);
  } else {
    res.status(401).json({ error: 'User not logged in' });
  }
});

app.get('/user-classes', auth, (req: Request, res: Response) => {
  const student_id = req.session.user.student_id; // Retrieve student_id from session
  const query_str = "SELECT class_id FROM student_to_class WHERE student_id = $1";
  const values = [student_id];

  db.manyOrNone(query_str, values)
    .then((data) => {
      res.json(data);
    })
    .catch((error) => {
      console.error('Error fetching user classes:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    });
});

// app.use(auth);

io.on('connection', (socket) => {
    // Join a room
    socket.on('joinRoom', async ({ username, room }) => {
        socket.join(room);
        (socket as any).username = username;
        (socket as any).room = room;
        console.log(`User ${username} joined room ${room}`);
        // Fetch previous messages from the database
        try {
            const messages = await db.manyOrNone('SELECT * FROM messages WHERE class_id = $1 ORDER BY created_at ASC', [room]);
            // Emit previous messages to the user who just joined
            console.log(messages)
            socket.emit('previousMessages', messages);
        } catch (error) {
            console.error('Error fetching previous messages:', error);
        }
        // Emit to the room that a user has joined
        socket.to(room).emit('userJoined', { id: socket.id, msg: `${username} has joined the room` });
    });
    socket.on('leaveRoom', ({ room }) => {
        socket.leave(room);
        console.log(`User ${socket.id} left room ${room}`);
    });
    // Listen for chat messages
    socket.on('chatMessage', async ({ room, msg, student_id, display_name }) => {
      const time = new Date();

      // Add to the database
      try {
          await db.none('INSERT INTO messages(student_id, class_id, message_body, created_at) VALUES($1, $2, $3, $4)', 
                        [student_id, room, msg, time]);
      } catch (error) {
          console.error('Error adding message to the database:', error);
      }
  
      // Emit the message to the room
      io.to(room).emit('chatMessage', {
        display_name: display_name,
        msg: msg,
        time: time
    });
    });
    socket.on('disconnect', (username) => {
        const { room } = (socket as any);
        if (room) {
            console.log(`User ${username} disconnected from room ${room}`);
            socket.to(room).emit('userDisconnect', { id: socket.id, username: username });
        }
    });
  });

server.listen(PORT, () => {
    console.log(`App listening on port: ${PORT}`);
});