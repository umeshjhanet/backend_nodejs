const express = require('express');
var cors = require('cors')
const mysql = require('mysql2');

 
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors())

const db = mysql.createConnection({
  host: 'mysqldb-nodejs-db-nodejs.a.aivencloud.com',
  port:'15292',
  user: 'avnadmin',
  password: 'AVNS_7_-TDwKOAalQNuMTrXl',
  database: 'defaultdb',
});
const mysql22 = mysql.createConnection({
  host: '192.168.3.124',
  port: '3306',
  user: 'root',
  password: 'Root$#123',
  database: 'ezeefile_updc',
})
const updcPrayagraj = mysql.createConnection({
  host: 'localhost',
  port:'3306',
  user:'root',
  password:'cbsl@123',
  database:'updc_misdb',
})

var corsOptions = {
  origin: 'https://cen-dboard.vercel.app',
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
app.options('/users', cors(corsOptions), (req, res) => {
  res.sendStatus(200);
});

app.get('/users', cors(corsOptions), (req, res) => {
    db.query('SELECT * from userinfo;', (err, results) => {
      if (err) throw err;
      res.json(results);
    });
  });
 
  app.get('/summary', cors(corsOptions), (req, res) => {
    db.query("SELECT * from summary_data;", (err,results) => {
      if(err) throw err;
      res.json(results);
    });
  });
  app.get('/graph', cors(corsOptions), (req, res) => {
    db.query("SELECT * from graph_test;", (err,results) => {
      if(err) throw err;
      res.json(results);
    });
  });
  app.get('/scanned_images', cors(corsOptions), (req, res) => {
    db.query("SELECT * FROM scanned_images;", (err,results) => {
      if(err) throw err;
      res.json(results);
    });
  });
  app.get('/location_report', cors(corsOptions), (req, res) => {
    db.query("SELECT * FROM location_report;", (err,results) => {
      if(err) throw err;
      res.json(results);
    });
  });


  app.get('/locations', cors(corsOptions), (req, res) => {
    updcPrayagraj.query("SELECT LocationID, LocationName from locationmaster;", (err,results) => {
      if(err) throw err;
      res.json(results);
    });
  });
  app.get('/usermaster', cors(corsOptions), (req, res) => {
    updcPrayagraj.query("SELECT user_id, first_name,last_name,designation FROM tbl_user_master where designation in ('project manager', 'site manager', 'site incharge','project head');", (err,results) => {
      if(err) throw err;
      res.json(results);
    });
  });
  app.get('/designations', cors(corsOptions), (req, res) => {
    updcPrayagraj.query("SELECT * FROM tbl_designation_master;", (err,results) => {
      if(err) throw err;
      res.json(results);
    });
  });
  app.get('/graph5', cors(corsOptions), (req, res) => {
    // const query = "SELECT scandate,SUM(scanfiles) as scannedfiles FROM scanned s WHERE scandate >= DATE_SUB(NOW(), INTERVAL 1 WEEK)AND scandate <= NOW() GROUP BY scandate;"
    const query="SELECT DATE_FORMAT(scandate, '%Y-%m-%d') as scandate, SUM(scanfiles) as scannedfiles FROM scanned s WHERE scandate >= DATE_SUB(NOW(), INTERVAL 1 WEEK) AND scandate <= NOW() GROUP BY DATE_FORMAT(scandate, '%Y-%m-%d');"
    updcPrayagraj.query(query, (err,results) => {
      if(err) throw err;
      res.json(results);
    });
  });

  app.get('/graph6', cors(corsOptions), (req, res) => {
    const query = "SELECT DATE_FORMAT(scandate, '%Y-%m-%d') as scandate, SUM(scanimages) as scannedimages FROM scanned s WHERE scandate >= DATE_SUB(NOW(), INTERVAL 1 WEEK) AND scandate <= NOW() GROUP BY DATE_FORMAT(scandate, '%Y-%m-%d');"
    updcPrayagraj.query(query, (err,results) => {
      if(err) throw err;
      res.json(results);
    });
  });

  app.get('/graph7', cors(corsOptions), (req, res) => {
    const query = "SELECT DATE_FORMAT(s.scandate,'%Y-%m-%d') AS 'scandate',SUM(s.scanimages) AS 'Scanned No Of Images' FROM scanned s WHERE s.scandate BETWEEN CURDATE() - INTERVAL 30 DAY AND CURDATE() GROUP BY DATE_FORMAT(s.scandate,'%Y-%m-%d');"
    updcPrayagraj.query(query, (err,results) => {
      if(err) throw err;
      res.json(results);
    });
  });

  app.get('/site_MPData', cors(corsOptions), (req, res) => {
    updcPrayagraj.query("SELECT * FROM tbl_site_mp;", (err,results) => {
      if(err) throw err;
      res.json(results);
    });
  });
  app.get('/graph1', cors(corsOptions), (req, res) => {
    mysql22.query("SELECT sum(exportpdffiles) as 'Export PDF' , sum(cbslqafiles)-sum(clientqaacceptfiles) as 'Client QA Pending', sum(clientqaacceptfiles) as 'Client QA',  sum(cbslqafiles) as 'CBSL QA', sum(scanfiles) as 'Scanned', sum(inventoryfiles) as 'Received'  from scanned;", (err,results) => {
      if(err) throw err;
      res.json(results);
    });
  });


  app.post('/userinfo', (req, res) => {
  const { name, email, phone, password } = req.body;
  const query = 'INSERT INTO userinfo (username, email, phone, password) VALUES (?, ?, ?, ?)';
  db.query(query, [name, email, phone, password], (err, result) => {
    if (err) {
      console.error("Error inserting user:", err);
      res.status(500).json({ error: 'An error occurred while inserting user' });
    } else {
      res.status(200).json({ message: 'User added successfully', id: result.insertId });
    }
  });
});

app.post('/usermasterinfo', (req, res) => {
  const { Desig_ID, Desig_name } = req.body;
  const query = 'INSERT INTO tbl_designation_master (Desig_ID, Desig_name) VALUES (?, ?)';
  mysql22.query(query, [Desig_ID, Desig_name], (err, result) => {
    if (err) {
      console.error("Error inserting user:", err);
      res.status(500).json({ error: 'An error occurred while inserting user' });
    } else {
      res.status(200).json({ message: 'User added successfully', id: result.insertId });
    }
  });
});
app.post('/site_MP', (req, res) => {
  const {  PH_Id,PO_Id, PM_Id, PCo_Id, SM_Id, Coll_Index_MP, Barc_MP, Barc_TF, Barc_TI, Page_No_MP, Prepare_MP, Prepare_TF, Prepare_TI, Scan_MP, Cover_Page_MP, Cover_Page_TF, Rescan_MP, Image_QC_MP, Doc_MP, Index_MP, CBSL_QA_MP, Ready_Cust_QA_MP, Cust_QA_Done_MP, PDF_Export_MP, Refilling_Files_MP, Refilling_Files_TF, Refilling_Files_TI, Inventory_MP, Location_Id, } = req.body;
  const query = 'INSERT INTO tbl_site_mp (PH_Id,PO_Id, PM_Id, PCo_Id, SM_Id, Coll_Index_MP, Barc_MP, Barc_TF, Barc_TI, Page_No_MP, Prepare_MP, Prepare_TF, Prepare_TI, Scan_MP, Cover_Page_MP, Cover_Page_TF, Rescan_MP, Image_QC_MP, Doc_MP, Index_MP, CBSL_QA_MP, Ready_Cust_QA_MP, Cust_QA_Done_MP, PDF_Export_MP, Refilling_Files_MP, Refilling_Files_TF, Refilling_Files_TI, Inventory_MP, Location_ID) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
  updcPrayagraj.query(query, [PH_Id,PO_Id, PM_Id, PCo_Id, SM_Id, Coll_Index_MP, Barc_MP, Barc_TF, Barc_TI, Page_No_MP, Prepare_MP, Prepare_TF, Prepare_TI, Scan_MP, Cover_Page_MP, Cover_Page_TF, Rescan_MP, Image_QC_MP, Doc_MP, Index_MP, CBSL_QA_MP, Ready_Cust_QA_MP, Cust_QA_Done_MP, PDF_Export_MP, Refilling_Files_MP, Refilling_Files_TF, Refilling_Files_TI, Inventory_MP, Location_Id,], (err, result) => {
    if (err) {
      console.error("Error inserting user:", err);
      res.status(500).json({ error: 'An error occurred while inserting user' });
    } else {
      res.status(200).json({ message: 'ManPower added successfully', id: result.insertId });
    }
  });
});
app.put('/usermasterupdate/:Desig_ID', (req, res) => {
  const {Desig_name, Desig_ID } = req.body;
  const query = 'UPDATE tbl_designation_master SET Desig_name = ? where Desig_ID = ?;';
 mysql22.query(query, [Desig_name, Desig_ID], (err, result) => {
    if (err) {
      console.error("Error inserting user:", err);
      res.status(500).json({ error: 'An error occurred while updating user' });
    } else {
     res.status(200).json({ message: 'User updated successfully', id: req.params.Desig_ID });

    }
  });
});
app.delete('/usermasterdelete/:Desig_ID', (req, res) => {
  const { Desig_ID } = req.params;
  mysql22.query('DELETE FROM tbl_designation_master WHERE Desig_ID = ?', [Desig_ID], (err) => {
    if (err) throw err;
    res.json({ message: 'User deleted successfully' });
  });
});






//SELECT first_name,last_name,designation FROM tbl_user_master where designation in ('project manager', 'site incharge', 'project owner', 'site manager');
