import express from 'express';
import bcrypt from 'bcryptjs';
import session from 'express-session';
import path from 'path';
import db from './db';

const app = express();
const PORT = process.env.PORT || 3000;

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'html')
app.use(express.json());

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

// <---- ACTUAL API ROUTES ---->

app.get('/', (req, res) => {
    res.render('views/register');
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
        res.status(201).json({
          data: data,
        });
        // res.redirect('views/chat');
      })
      .catch(function (err) {
        console.log(err);
        // res.redirect('/register');
      });
});

const server = app.listen(PORT, () => {
  console.log(`App listening on port: ${PORT}`);
});

export default server;