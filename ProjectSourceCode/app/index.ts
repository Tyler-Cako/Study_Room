import express from 'express';
import db from './db';

const app = express();

const PORT = process.env.PORT || 3000;

// testing database
db.connect()
  .then(obj => {
    console.log('Database connection successful'); // you can view this message in the docker compose logs
    obj.done(); // success, release the connection;
  })
  .catch(error => {
    console.log('ERROR:', error.message || error);
  });

app.get('/', (req, res) => {
    res.send("hello world!");
});

app.listen(PORT, () => {
    console.log(`App listening on port: ${PORT}`);
});