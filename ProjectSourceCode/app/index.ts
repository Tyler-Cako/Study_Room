import express from 'express';
import handlebars from 'express-handlebars'
import bcrypt from 'bcryptjs';
import session from 'express-session';
import path from 'path';
import bodyParser from 'body-parser'
import db from './db';

const app = express();
const PORT = process.env.PORT || 3000;

// // create `ExpressHandlebars` instance and configure the layouts and partials dir.
// const hbs = handlebars.create({
//   extname: 'hbs',
//   layoutsDir: __dirname + '/views',
// });

// app.engine('hbs', hbs.engine);
app.set('view engine', 'html');
app.engine('html', require('hbs').__express);
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json());
app.use(express.json());

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

// <---- ACTUAL API ROUTES ---->

app.get('/', (req, res) => {
  res.render('chat');
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

app.listen(PORT, () => {
  console.log(`App listening on port: ${PORT}`);
});