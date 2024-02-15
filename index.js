const express = require('express');
var cors = require('cors')
const mysql = require('mysql2');

 
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors())

const db = mysql.createConnection({
  host: '192.168.3.124',
  port:'3306',
  user: 'root',
  password: 'Root$#123',
  database: 'ezeefile_updc',
});

var corsOptions = {
  origin: 'backend-nodejs-nine.vercel.app',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

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
    db.query('SELECT * FROM tbl_user_master;', (err, results) => {
      if (err) throw err;
      res.json(results);
    });
  });

  