import express, { Express, Request, Response, NextFunction, response } from 'express';
import bcrypt from 'bcryptjs';
import session, { SessionOptions, SessionData } from 'express-session';
import path, { dirname } from 'path';
import db from './db';
import { Server } from 'socket.io';
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
app.use(express.json());

// Register `handlebars` as view engine
app.engine('.hbs', engine({
  extname: '.hbs',
  defaultLayout: false,
  partialsDir: path.join(__dirname, 'views/partials'), 
}));
app.set('view engine', 'hbs');
console.log('Partials directory:', path.join(__dirname, 'views/partials'));

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
      classes: any[]
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
    return res.render('pages/login.hbs');
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
  const name = req.body.name
  const email = req.body.email

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
      console.log(`Registered user with the following credientials:\n
        name: ${req.body.name}, email: ${req.body.email}`)
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
  classes: any[]
};

app.get('/chat', auth, (req, res) => {
  if(req.session.user.student_id && req.session.user.classes.length > 0){
    res.redirect(`/chat/${req.session.user.classes[0].class_id}`);
  }
  else{
    res.redirect('/add');
  }
});

app.get('/chat/:id', auth, (req, res) => {
  if(req.session.user.student_id && req.session.user.classes){
    var classes = req.session.user.classes;
    // console.log(classes);
    if (classes.length == 0){
      return res.redirect('/add');
    }
    else{
      var class_id = req.params.id;
      var class_code = classes.find( c => c.class_id == class_id).class_code;
      var q = "SELECT * FROM messages m JOIN student s ON m.student_id = s.student_id WHERE m.class_id = $1;";
      db.manyOrNone(q, [class_id]).then( messages => {
        res.render('pages/chat.hbs', {
          messages: messages,
          classes: classes,
          className: class_code
        });
      });
    }
  }
  else{
    res.redirect("/login");
  }
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
        const query_str = "SELECT * FROM student_to_class stc JOIN class c ON stc.class_id = c.class_id WHERE stc.student_id = $1;";
        db.manyOrNone(query_str, [data.student_id])
          .then((classes) => {
            const user: User = {
              student_id: data.student_id,
              name: data.name,
              email: data.email,
              classes: classes
            };            
            req.session.user = user;
            req.session.save();
    
            res.redirect('/chat');
          })
          .catch((error) => {
            return error;
          });
      } else {
        console.log('Incorrect email or password');
        res.redirect(401, '/login');
      }
    })
    .catch((err: Error) => {
      console.log(err);
      res.redirect(401, '/login');
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

app.get('/add', (req, res) => {
  res.render('pages/add_class.hbs');
});

app.post('/add', (req, res)=> {

  const class_code = req.body.class;
  const section = req.body.section
  const semester = req.body.semester
  const student_id = req.session.user.student_id;

  db.tx(async t => {
    const classFound = await t.oneOrNone(
      `SELECT class_id FROM class WHERE class_code = $1 AND section = $2 AND semester = $3`, 
      [class_code, section, semester]
    );
    console.log('Class Found', classFound);
    if (!classFound) {
      throw new Error("Class not found");
    }
    const class_id = classFound.class_id;
    const is_added = await t.oneOrNone(
      `SELECT 1 from student_to_class WHERE student_id = $1 AND class_id = $2`,
      [student_id, class_id]
    );
    console.log('Already Added Check:', is_added); // Log this

    if (is_added) {
      throw new Error('You are already have this course added');
    }

    await t.none(
      'INSERT INTO student_to_class (student_id, class_id) VALUES ($1, $2);',
      [student_id, class_id]
    );  
    console.log('Insert successful');

    t.manyOrNone(
      'SELECT * FROM student_to_class stc JOIN class c ON stc.class_id = c.class_id WHERE stc.student_id = $1;',
      [student_id]
    ).then(classes =>{
      req.session.user.classes = classes;
      console.log(classes);
    })
  })
  .then(result => {
    res.render('pages/add_class.hbs', { message: `Successfully added course ${class_code}`}); // Success message
  })
  .catch(err => {
    res.render('pages/add_class.hbs', { message: err.message, error: true }); // Error message
  });
});

io.on('connection', (socket) => {
    // Join a room
    console.log(`user connected`);
    socket.on('joinRoom', async ({ username, room }) => {
      
        socket.join(room);
        (socket as any).username = username;
        (socket as any).room = room;
        console.log(`User ${username} joined room ${room}`);
        // Fetch previous messages from the database
        try {
          const msg_data = await db.manyOrNone(
            `SELECT s.name, m.message_body, m.created_at FROM messages AS m
             JOIN student AS s ON s.student_id = m.student_id 
             WHERE class_id = $1 
             ORDER BY created_at ASC`, [room]);
          // Emit previous messages to the user who just joined
          socket.emit('previousMessages', msg_data);
        } catch (error) {
            console.error('Error fetching previous messages:', error);
        }
        // Emit to the room that a user has joined
        socket.to(room).emit('userJoined', { user: username, msg: `${username} has joined the room` });
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

module.exports = { app, server }