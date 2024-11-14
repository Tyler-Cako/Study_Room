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
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json());
app.use(express.json());

// Register `handlebars` as our view engine using its bound `engine()` function.
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');

// set Session
const sessionOptions: SessionOptions = {
  secret: process.env.SESSION_SECRET as string,
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
    res.render('pages/chat.hbs');
});

app.get('/', function (req, res) {
  res.redirect('pages/login.hbs')
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

app.get('/chat', (req, res) => {
  var q = "SELECT * FROM student_to_class stc JOIN class c ON stc.class_id = c.class_id WHERE stc.student_id = $1;";
  db.manyOrNone(q, [req.session.id]).then( classes => {   // TODO: replace session.id with student_id
    console.log(classes);
    if (classes.length == 0){
      return res.redirect('add_class');
    }
    else{
      var firstClassID = classes[0].class_id;
      q = "SELECT * FROM messages m JOIN student s ON m.student_id = s.student_id WHERE m.class_id = $1;";
      db.manyOrNone(q, [firstClassID]).then( messages => {
        console.log(messages);
        res.render('pages/chat.hbs', {
          messages: messages,
          classes: classes
        });
      });
    }
  });
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



// app.use(auth);

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