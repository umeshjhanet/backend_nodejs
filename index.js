const express = require('express');
var cors = require('cors')
const mysql = require('mysql2');

 
var corsOptions = {
  origin: 'backend-nodejs-nine.vercel.app',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}
 
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors())

const db = mysql.createConnection({
  host: '127.0.0.1',
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
  console.log(`Server is running on http://localhost:${PORT}`);
});

app.get('/users', cors(corsOptions), (req, res) => {
    db.query('SELECT * FROM users', (err, results) => {
      if (err) throw err;
      res.json(results);
    });
  });

  