const express = require('express');
var cors = require('cors')
const mysql = require('mysql2');
app.use(cors())
 
var corsOptions = {
  origin: 'https://backend-nodejs-nine.vercel.app',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}
 
const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'nodejs_rest_api',
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

app.listen(PORT, () => {
  console.log(`Server is running on https://backend-nodejs-nine.vercel.app:${PORT}`);
});

app.get('/users', cors(corsOptions), (req, res) => {
    db.query('SELECT * FROM users', (err, results) => {
      if (err) throw err;
      res.json(results);
    });
  });

  