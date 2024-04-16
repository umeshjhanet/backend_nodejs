const express = require('express');
var cors = require('cors')
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const xlsx = require('xlsx');


const hostname = "192.168.3.48";
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(cors());

function formatDate(date) {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

const db = mysql.createConnection({
  host: 'mysqldb-nodejs-db-nodejs.a.aivencloud.com',
  port: '15292',
  user: 'avnadmin',
  password: 'AVNS_7_-TDwKOAalQNuMTrXl',
  database: 'defaultdb',
});
const mysql22 = mysql.createConnection({
  host: "192.168.3.124",
  port: "3306",
  user: "root",
  password: "Root$#123",
  database: "ezeefile_updc",
});
const misdb = mysql.createConnection({
  host: "localhost",
  port: "3306",
  user: "root",
  password: "root",
  database: "updc_misdb",
});

var corsOptions = {
  origin: "192.168.3.48",
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
}

db.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
    return;
  }
  console.log("Connected to MySQL database");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
app.options("/users", cors(corsOptions), (req, res) => {
  res.sendStatus(200);
});


const transporter = nodemailer.createTransport({
  port: 465,               // true for 465, false for other ports
  host: "smtp.gmail.com",
  auth: {
    user: 'rachnacbsl@gmail.com',
    pass: 'fmpc uvyu drwb swvi',
  },
  secure: true,
  tls: {
    rejectUnauthorized: false
  }
});
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });


app.post("/uploadExcel", upload.single("file"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }


  // Load the uploaded Excel file
  const workbook = xlsx.readFile(req.file.path);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet);


  // Manually added fields
  const manuallyAddedFields = [
    req.body.PH_Id,
    req.body.PO_Id,
    req.body.PM_Id,
    req.body.PCo_Id,
    req.body.SM_Id,
    req.body.Location_ID
  ];


  // Concatenate manually added fields with the data array
  const dataWithManualFields = data.map(row => [...manuallyAddedFields, ...Object.values(row)]);


  // Prepare the SQL query
  const query =
    "INSERT INTO tbl_site_mp (PH_Id, PO_Id, PM_Id, PCo_Id, SM_Id,Location_ID, Coll_Index_MP, Barc_MP, Barc_TF, Barc_TI, Page_No_MP, Prepare_MP, Prepare_TF, Prepare_TI, Scan_MP, Cover_Page_MP, Cover_Page_TF, Rescan_MP, Image_QC_MP, Doc_MP, Index_MP, CBSL_QA_MP, Ready_Cust_QA_MP, Cust_QA_Done_MP, PDF_Export_MP, Refilling_Files_MP, Refilling_Files_TF, Refilling_Files_TI, Inventory_MP) VALUES ?";


  // Execute the query with the data
  misdb.query(query, [dataWithManualFields], (err, result) => {
    if (err) {
      console.error("Error inserting data:", err);
      res.status(500).json({ error: "An error occurred while inserting data" });
    } else {
      res.status(200).json({
        message: "Data added successfully",
        count: result.affectedRows,
      });
    }
  });
});



app.post('/upload', upload.single('file'), (req, res) => {
  console.log('File upload request received');
  if (!req.file) {
    console.log('No file uploaded');
    return res.status(400).send('No file uploaded');
  }
  console.log('File saved:', req.file.filename);
  res.send('File uploaded successfully');
});


app.get('/users', cors(corsOptions), (req, res) => {
  misdb.query('SELECT * from tbl_user_master;', (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

app.get('/summaryLocation', cors(corsOptions), (req, res) => {
  const locationName = req.query.locationname; // Retrieve location name from query parameter

  if (!locationName) {
    return res.status(400).json({ error: "Location name is required" }); // Return error if location name is not provided
  }
  mysql22.query(
    "SELECT locationname, Count(distinct locationid) as TotalLocation, sum(`inventoryfiles`) as 'CollectionFiles', sum(`inventoryimages`) as 'CollectionImages', sum(`scanfiles`) as 'ScannedFiles', sum(`scanimages`) as 'ScannedImages', sum(`qcfiles`) as 'QCFiles', sum(`qcimages`) as 'QCImages', sum(`flaggingfiles`) as 'FlaggingFiles', sum(`flaggingimages`) as 'FlaggingImages', sum(`indexfiles`) as 'IndexingFiles', sum(`indeximages`) as 'IndexingImages', sum(`cbslqafiles`) as 'CBSL_QAFiles', sum(`cbslqaimages`) as 'CBSL_QAImages', sum(`exportpdffiles`) as 'Export_PdfFiles', sum(`exportpdfimages`) as 'Export_PdfImages', sum(`clientqaacceptfiles`) as 'Client_QA_AcceptedFiles', sum(`clientqaacceptimages`) as 'Client_QA_AcceptedImages', sum(`clientqarejectfiles`) as 'Client_QA_RejectedFiles', sum(`clientqarejectimages`) as 'Client_QA_RejectedImages', sum(`digisignfiles`) as 'Digi_SignFiles', sum(`digisignimages`) as 'Digi_SignImages' FROM scanned s WHERE locationname = ? GROUP BY locationname;",
    [locationName], // Pass locationName as parameter
    (err, results) => {
      if (err) throw err;
      res.json(results);
    }
  );
});




app.get("/summary", cors(corsOptions), (req, res) => {
  const { startDate, endDate } = req.query;
  let query = "SELECT Count(distinct locationid) as TotalLocation, sum(`inventoryfiles`) as 'CollectionFiles', sum(`inventoryimages`) as 'CollectionImages', sum(`scanfiles`) as 'ScannedFiles', sum(`scanimages`) as 'ScannedImages', sum(`qcfiles`) as 'QCFiles', sum(`qcimages`) as 'QCImages', sum(`flaggingfiles`) as 'FlaggingFiles', sum(`flaggingimages`) as 'FlaggingImages', sum(`indexfiles`) as 'IndexingFiles', sum(`indeximages`) as 'IndexingImages', sum(`cbslqafiles`) as 'CBSL_QAFiles', sum(`cbslqaimages`) as 'CBSL_QAImages', sum(`exportpdffiles`) as 'Export_PdfFiles', sum(`exportpdfimages`) as 'Export_PdfImages', sum(`clientqaacceptfiles`) as 'Client_QA_AcceptedFiles', sum(`clientqaacceptimages`) as 'Client_QA_AcceptedImages', sum(`clientqarejectfiles`) as 'Client_QA_RejectedFiles', sum(`clientqarejectimages`) as 'Client_QA_RejectedImages', sum(`digisignfiles`) as 'Digi_SignFiles', sum(`digisignimages`) as 'Digi_SignImages' FROM scanned s";
  const queryParams = [];
  if (startDate && endDate) {
    query += ` WHERE (s.inventorydate BETWEEN ? AND ?)
                OR (s.scandate BETWEEN ? AND ?)
                OR (s.qcdate BETWEEN ? AND ?)
                OR (s.flaggingdate BETWEEN ? AND ?)
                OR (s.indexdate BETWEEN ? AND ?)
                OR (s.cbslqadate BETWEEN ? AND ?)
                OR (s.exportdate BETWEEN ? AND ?)
                OR (s.clientqaacceptdate BETWEEN ? AND ?)
                OR (s.digisigndate BETWEEN ? AND ?)`;
    for (let i = 0; i < 18; i++) {
      queryParams.push(startDate, endDate);
    }
  }


  mysql22.query(query, queryParams, (err, results) => {
    if (err) {
      console.error("Error fetching summary data:", err);
      res.status(500).json({ error: "Error fetching summary data" });
      return;
    }
    res.json(results);
  });
});
app.get("/summarycsv", cors(corsOptions), (req, res, next) => {
  let locationNames = req.query.locationName;
  let startDate = req.query.startDate;
  let endDate = req.query.endDate;



  const queryParams = [];



  if (!locationNames || (Array.isArray(locationNames) && locationNames.length === 0)) {
    locationNames = null;
  } else {
    if (!Array.isArray(locationNames)) {
      locationNames = [locationNames];
    }
  }



  let whereClause = "";



  if (locationNames) {
    whereClause = `WHERE s.locationname IN ('${locationNames.join("','")}')`;
  }



  let dateClause = "";



  if (startDate && endDate) {
    dateClause = whereClause ? `AND` : `WHERE`;
    dateClause += ` (s.inventorydate BETWEEN '${startDate}' AND '${endDate}'
                OR s.scandate BETWEEN '${startDate}' AND '${endDate}'
                OR s.qcdate BETWEEN '${startDate}' AND '${endDate}'
                OR s.flaggingdate BETWEEN '${startDate}' AND '${endDate}'
                OR s.indexdate BETWEEN '${startDate}' AND '${endDate}'
                OR s.cbslqadate BETWEEN '${startDate}' AND '${endDate}'
                OR s.exportdate BETWEEN '${startDate}' AND '${endDate}'
                OR s.clientqaacceptdate BETWEEN '${startDate}' AND '${endDate}'
                OR s.digisigndate BETWEEN '${startDate}' AND '${endDate}')`;
  }



  const getCsv = `
  SELECT Count(distinct locationid) as TotalLocation,
      case when sum(inventoryfiles) is null then '0' else sum(inventoryfiles) end as 'CollectionFiles',
      case when sum(inventoryimages) is null then '0' else sum(inventoryimages) end as 'CollectionImages',
      case when sum(scanfiles) is null then '0' else sum(scanfiles) end as 'ScannedFiles',
      case when sum(scanimages) is null then '0' else sum(scanimages) end as 'ScannedImages',
      case when sum(qcfiles) is null then '0' else sum(qcfiles) end as 'QCFiles',
      case when sum(qcimages) is null then '0' else sum(qcimages) end as 'QCImages',
      case when sum(flaggingfiles) is null then '0' else sum(flaggingfiles) end as 'FlaggingFiles',
      case when sum(flaggingimages) is null then '0' else sum(flaggingimages) end as 'FlaggingImages',
      case when sum(indexfiles) is null then '0' else sum(indexfiles) end as 'IndexingFiles',
      case when sum(indeximages) is null then '0' else sum(indeximages) end as 'IndexingImages',
      case when sum(cbslqafiles) is null then '0' else sum(cbslqafiles) end as 'CBSL_QAFiles',
      case when sum(cbslqaimages) is null then '0' else sum(cbslqaimages) end as 'CBSL_QAImages',
      case when sum(exportpdffiles) is null then '0' else sum(exportpdffiles) end as 'Export_PdfFiles',
      case when sum(exportpdfimages) is null then '0' else sum(exportpdfimages) end as 'Export_PdfImages',
      case when sum(clientqaacceptfiles) is null then '0' else sum(clientqaacceptfiles) end as 'Client_QA_AcceptedFiles',
      case when sum(clientqaacceptimages) is null then '0' else sum(clientqaacceptimages) end as 'Client_QA_AcceptedImages',
      case when sum(clientqarejectfiles) is null then '0' else sum(clientqarejectfiles) end as 'Client_QA_RejectedFiles',
      case when sum(clientqarejectimages) is null then '0' else sum(clientqarejectimages) end as 'Client_QA_RejectedImages',
      case when sum(digisignfiles) is null then '0' else sum(digisignfiles) end as 'Digi_SignFiles',
      case when sum(digisignimages) is null then '0' else sum(digisignimages) end as 'Digi_SignImages'
  FROM scanned s
  ${whereClause}
  ${dateClause}
  ;`;



  mysql22.query(getCsv, (error, result, field) => {
    if (error) {
      console.error("Error occurred when exporting CSV:", error);
      res.status(500).json({ error: "An error occurred while exporting the CSV file" });
      return;
    }



    const data = result && result.length > 0 ? result : null;



    if (!data) {
      res.status(404).json({ error: "No data found for the provided parameters" });
      return;
    }



    // Set response headers
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment;filename=export.csv");



    // Write CSV headers
    res.write('Sr. No.,Location,Collection of Records, ,Scanning ADF, ,ImageQC, ,Document Classification, ,Indexing, ,CBSLQA, ,Export PDF, ,Client QA, ,CSV Generation, ,Inventory Out\n');
    res.write(" ,  ,Files, Images,Files,Images,Files,Images,Files,Images,Files, Images,Files,Images,Files,Images,Files,Images,Files,Images,Files,Images\n");



    // Write CSV data
    data.forEach((row, index) => {
      res.write(
        (index + 1) + "," +
        row.TotalLocation + "," +
        row.CollectionFiles + "," +
        row.CollectionImages + "," +
        row.ScannedFiles + "," +
        row.ScannedImages + "," +
        row.QCFiles + "," +
        row.QCImages + "," +
        row.FlaggingFiles + "," +
        row.FlaggingImages + "," +
        row.IndexingFiles + "," +
        row.IndexingImages + "," +
        row.CBSL_QAFiles + "," +
        row.CBSL_QAImages + "," +
        row.Export_PdfFiles + "," +
        row.Export_PdfImages + "," +
        row.Client_QA_AcceptedFiles + "," +
        row.Client_QA_AcceptedImages + "," +
        row.Client_QA_RejectedFiles + "," +
        row.Client_QA_RejectedImages + "," +
        row.Digi_SignFiles + "," +
        row.Digi_SignImages + "\n"
      );
    });



    // End response
    res.end();
  });
});



app.get('/reportTable', cors(corsOptions), (req, res) => {
  const { startDate, endDate } = req.query;


  let query = `SELECT locationid, locationname as 'LocationName',
                sum(inventoryfiles) as 'CollectionFiles', sum(inventoryimages) as 'CollectionImages',
                sum(scanfiles) as 'ScannedFiles', sum(scanimages) as 'ScannedImages',
                sum(qcfiles) as 'QCFiles', sum(qcimages) as 'QCImages',
                sum(flaggingfiles) as 'FlaggingFiles', sum(flaggingimages) as 'FlaggingImages',
                sum(indexfiles) as 'IndexingFiles', sum(indeximages) as 'IndexingImages',
                sum(cbslqafiles) as 'CBSL_QAFiles', sum(cbslqaimages) as 'CBSL_QAImages',
                sum(exportpdffiles) as 'Export_PdfFiles', sum(exportpdfimages) as 'Export_PdfImages',
                sum(clientqaacceptfiles) as 'Client_QA_AcceptedFiles', sum(clientqaacceptimages) as 'Client_QA_AcceptedImages',
                sum(clientqarejectfiles) as 'Client_QA_RejectedFiles', sum(clientqarejectimages) as 'Client_QA_RejectedImages',
                sum(digisignfiles) as 'Digi_SignFiles', sum(digisignimages) as 'Digi_SignImages'
                FROM scanned`;


  const queryParams = [];


  if (startDate && endDate) {
    query += ` WHERE (inventorydate BETWEEN ? AND ?)
                OR (scandate BETWEEN ? AND ?)
                OR (qcdate BETWEEN ? AND ?)
                OR (flaggingdate BETWEEN ? AND ?)
                OR (indexdate BETWEEN ? AND ?)
                OR (cbslqadate BETWEEN ? AND ?)
                OR (exportdate BETWEEN ? AND ?)
                OR (clientqaacceptdate BETWEEN ? AND ?)
                OR (digisigndate BETWEEN ? AND ?)`;
    
    // Push start and end dates for each date-related column to the queryParams array
    for (let i = 0; i < 18; i++) {
      queryParams.push(startDate, endDate);
    }
  }


  query += ' GROUP BY LocationName';


  mysql22.query(query, queryParams, (err, results) => {
    if (err) {
      console.error('Error fetching report table:', err);
      res.status(500).json({ error: 'Error fetching report table' });
      return;
    }
    res.json(results);
  });
});
app.get("/reporttablecsv", cors(corsOptions), (req, res, next) => {
  let locationNames = req.query.locationName;
  let startDate=req.query.startDate;
  let endDate=req.query.endDate;
  if (!locationNames || (Array.isArray(locationNames) && locationNames.length === 0)) {
    locationNames = null;
  } else {
    if (!Array.isArray(locationNames)) {
      locationNames = [locationNames];
    }
  }
  let whereClause = "";
  if (locationNames) {
    whereClause = `WHERE s.locationname IN ('${locationNames.join("','")}')`;
  }
  let dateClause = "";



  if (startDate && endDate) {
    dateClause = whereClause ? `AND` : `WHERE`;
    dateClause += ` (s.inventorydate BETWEEN '${startDate}' AND '${endDate}'
                OR s.scandate BETWEEN '${startDate}' AND '${endDate}'
                OR s.qcdate BETWEEN '${startDate}' AND '${endDate}'
                OR s.flaggingdate BETWEEN '${startDate}' AND '${endDate}'
                OR s.indexdate BETWEEN '${startDate}' AND '${endDate}'
                OR s.cbslqadate BETWEEN '${startDate}' AND '${endDate}'
                OR s.exportdate BETWEEN '${startDate}' AND '${endDate}'
                OR s.clientqaacceptdate BETWEEN '${startDate}' AND '${endDate}'
                OR s.digisigndate BETWEEN '${startDate}' AND '${endDate}')`;
  }
  
  const getCsv = `SELECT locationid, locationname as 'LocationName',
  case when sum(inventoryfiles) is null then '0' else sum(inventoryfiles) end as 'CollectionFiles',
  case when sum(inventoryimages) is null then '0' else sum(inventoryimages) end as 'CollectionImages',
  case when sum(scanfiles) is null then '0' else sum(scanfiles) end as 'ScannedFiles',
  case when sum(scanimages) is null then '0' else sum(scanimages) end as 'ScannedImages',
  case when sum(qcfiles) is null then '0' else sum(qcfiles) end as 'QCFiles',
  case when sum(qcimages) is null then '0' else sum(qcimages) end as 'QCImages',
  case when sum(flaggingfiles) is null then '0' else sum(flaggingfiles) end as 'FlaggingFiles',
  case when sum(flaggingimages) is null then '0' else sum(flaggingimages) end as 'FlaggingImages',
  case when sum(indexfiles) is null then '0' else sum(indexfiles) end as 'IndexingFiles',
  case when sum(indeximages) is null then '0' else sum(indeximages) end as 'IndexingImages',
  case when sum(cbslqafiles) is null then '0' else sum(cbslqafiles) end as 'CBSL_QAFiles',
  case when sum(cbslqaimages) is null then '0' else sum(cbslqaimages) end as 'CBSL_QAImages',
  case when sum(exportpdffiles) is null then '0' else sum(exportpdffiles) end as 'Export_PdfFiles',
  case when sum(exportpdfimages) is null then '0' else sum(exportpdfimages) end as 'Export_PdfImages',
  case when sum(clientqaacceptfiles) is null then '0' else sum(clientqaacceptfiles) end as 'Client_QA_AcceptedFiles',
  case when sum(clientqaacceptimages) is null then '0' else sum(clientqaacceptimages) end as 'Client_QA_AcceptedImages',
  case when sum(clientqarejectfiles) is null then '0' else sum(clientqarejectfiles) end as 'Client_QA_RejectedFiles',
  case when sum(clientqarejectimages) is null then '0' else sum(clientqarejectimages) end as 'Client_QA_RejectedImages',
  case when sum(digisignfiles) is null then '0' else sum(digisignfiles) end as 'Digi_SignFiles',
  case when sum(digisignimages) is null then '0' else sum(digisignimages) end as 'Digi_SignImages' 
  FROM scanned s 
  ${whereClause}
  ${dateClause}
  GROUP BY  locationname;`;


  mysql22.query(getCsv, (error, result, field) => {
    if (error) {
      console.error("Error occured when export csv:", err);
      res
        .status(500)
        .json({ error: "An error occurred while exporting csv file" });
      return;
    }
    


    const data = result && result.length > 0 ? result : null;



    if (!data) {
      res.status(404).json({ error: "No data found for the provided parameters" });
      return;
    }


    // const data = result;
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment;filename=export.csv");
    


    res.write('Sr. No.,Location,Collection of Records, ,Scanning ADF, ,ImageQC, ,Document Classification, ,Indexing, ,CBSLQA, ,Export PDF, ,Client QA, ,CSV Generation, ,Inventory Out\n');
    res.write(
      " ,  ,Files, Images,Files,Images,Files,Images,Files,Images,Files, Images,Files,Images,Files,Images,Files,Images,Files,Images,Files,Images\n"
    );
    if (data == null) {
      res.end();
      return;
    }
    data.forEach((row,index) => {
      res.write(
        (index+1) +"," +
        row.LocationName +
          "," +
          row.CollectionFiles +
          "," +
          row.CollectionImages +
          "," +
          row.ScannedFiles +
          "," +
          row.ScannedImages +
          "," +
          row.QCFiles +
          "," +
          row.QCImages +
          "," +
          row.FlaggingFiles +
          "," +
          row.FlaggingImages +
          "," +
          row.IndexingFiles +
          "," +
          row.IndexingImages +
          "," +
          row.CBSL_QAFiles +
          "," +
          row.CBSL_QAImages +
          "," +
          row.Export_PdfFiles +
          "," +
          row.Export_PdfImages +
          "," +
          row.Client_QA_AcceptedFiles +
          "," +
          row.Client_QA_AcceptedImages +
          row.Client_QA_RejectedFiles +
          "," +
          row.Client_QA_RejectedImages +
          "," +
          row.Digi_SignFiles +
          "," +
          row.Digi_SignImages +
          "\n"
      );
    });
    res.end();
  });
});



app.get('/graph', cors(corsOptions), (req, res) => {
  db.query("SELECT * from graph_test;", (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});
app.get('/scanned_images', cors(corsOptions), (req, res) => {
  db.query("SELECT * FROM scanned_images;", (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

app.get('/locations', cors(corsOptions), (req, res) => {
  mysql22.query("SELECT LocationID, LocationName from locationmaster;", (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});



app.get('/usermaster', cors(corsOptions), (req, res) => {
  mysql22.query("SELECT user_id, first_name,last_name,designation FROM tbl_user_master where designation in ('project manager', 'site manager', 'site incharge','project head');", (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});
app.get("/designations", cors(corsOptions), (req, res) => {
  mysql22.query(
    "SELECT * FROM tbl_designation_master;",
    (err, results) => {
      if (err) throw err;
      res.json(results);
    }
  );
});
app.get('/graph5', cors(corsOptions), (req, res) => {
  const { locationNames } = req.query;
  let query = "SELECT DATE_FORMAT(scandate, '%Y-%m-%d') as scandate, SUM(scanfiles) as scannedfiles FROM scanned s WHERE scandate >= DATE_SUB(NOW(), INTERVAL 1 WEEK) AND scandate <= NOW()";

  if (locationNames && locationNames.length > 0) {
    query += " AND locationname IN (?)";
  }

  query += " GROUP BY DATE_FORMAT(scandate, '%Y-%m-%d');";

  mysql22.query(query, [locationNames], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.json(results);
  });
});

app.get('/graph6', cors(corsOptions), (req, res) => {
  const { locationNames } = req.query;
  let query = "SELECT DATE_FORMAT(scandate, '%Y-%m-%d') as scandate, SUM(scanimages) as scannedimages FROM scanned s WHERE scandate >= DATE_SUB(NOW(), INTERVAL 1 WEEK) AND scandate <= NOW()";

  if (locationNames && locationNames.length > 0) {
    query += " AND locationname IN (?)";
  }

  query += " GROUP BY DATE_FORMAT(scandate, '%Y-%m-%d');";

  mysql22.query(query, [locationNames], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.json(results);
  });
});
app.get('/graphmonth', cors(corsOptions), (req, res) => {
  const { locationNames } = req.query;
  let query = "SELECT DATE_FORMAT(scandate,'%Y-%m-%d') AS 'scandate',SUM(scanimages) AS 'Scanned No Of Images' FROM scanned s WHERE scandate BETWEEN CURDATE() - INTERVAL 30 DAY AND CURDATE() ";

  if (locationNames && locationNames.length > 0) {
    query += " AND locationname IN (?)";
  }

  query += " GROUP BY DATE_FORMAT(scandate, '%Y-%m-%d');";

  mysql22.query(query, [locationNames], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.json(results);
  });
});




app.get('/reportLocationWiseTable', cors(corsOptions), (req, res) => {
  const locationName = req.query.locationname;
  const { startDate, endDate } = req.query; // Retrieve query parameters

  if (!locationName) {
    return res.status(400).json({ error: 'Location name is required' });
  }

  let query = `
    SELECT
        locationid,
        locationname AS 'LocationName',
        SUM(inventoryfiles) AS 'CollectionFiles',
        SUM(inventoryimages) AS 'CollectionImages',
        SUM(scanfiles) AS 'ScannedFiles',
        SUM(scanimages) AS 'ScannedImages',
        SUM(qcfiles) AS 'QCFiles',
        SUM(qcimages) AS 'QCImages',
        SUM(flaggingfiles) AS 'FlaggingFiles',
        SUM(flaggingimages) AS 'FlaggingImages',
        SUM(indexfiles) AS 'IndexingFiles',
        SUM(indeximages) AS 'IndexingImages',
        SUM(cbslqafiles) AS 'CBSL_QAFiles',
        SUM(cbslqaimages) AS 'CBSL_QAImages',
        SUM(exportpdffiles) AS 'Export_PdfFiles',
        SUM(exportpdfimages) AS 'Export_PdfImages',
        SUM(clientqaacceptfiles) AS 'Client_QA_AcceptedFiles',
        SUM(clientqaacceptimages) AS 'Client_QA_AcceptedImages',
        SUM(clientqarejectfiles) AS 'Client_QA_RejectedFiles',
        SUM(clientqarejectimages) AS 'Client_QA_RejectedImages',
        SUM(digisignfiles) AS 'Digi_SignFiles',
        SUM(digisignimages) AS 'Digi_SignImages'
    FROM
        scanned
    WHERE
        locationname = ?`;

  // If startDate and endDate are provided, add date filtering
  if (startDate && endDate) {
    query += " AND (receiveddate BETWEEN ? AND ? OR inventorydate BETWEEN ? AND ? OR scandate BETWEEN ? AND ? OR qcdate BETWEEN ? AND ? OR flaggingdate BETWEEN ? AND ? OR indexdate BETWEEN ? AND ? OR cbslqadate BETWEEN ? AND ? OR exportdate BETWEEN ? AND ? OR clientqaacceptdate BETWEEN ? AND ? OR clientqarejectdate BETWEEN ? AND ? OR digisigndate BETWEEN ? AND ? OR invOutDate BETWEEN ? AND ? OR reScanDate BETWEEN ? AND ? )";
  }

  query += " GROUP BY LocationName;";

  mysql22.query(query, [locationName, startDate, endDate], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.json(results);
  });
});
app.get('/graph1LocationWise', cors(corsOptions), (req, res) => {
  const locationNames = req.query.locationname; // Retrieve location names from query parameter

  let query = `
    SELECT 
    locationid,
    locationname AS 'LocationName',
    sum(exportpdffiles) as 'Export PDF' , 
    sum(cbslqafiles)-sum(clientqaacceptfiles) as 'Client QA Pending', 
    sum(clientqaacceptfiles) as 'Client QA',  
    sum(cbslqafiles) as 'CBSL QA', 
    sum(scanfiles) as 'Scanned', 
    sum(inventoryfiles) as 'Received'  
    FROM scanned
  `;

  if (locationNames && locationNames.length > 0) {
    query += ` WHERE locationname IN (?)`;
  }

  mysql22.query(query, [locationNames], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ error: 'Internal Server Error' }); // Send error response
    }
    res.json(results); // Send JSON response with query results
  });
});

app.get('/graph2', cors(corsOptions), (req, res) => {
  const locationNames = req.query.locationname; // Retrieve location name from query parameter

  let query = `
  SELECT 
  sum(exportpdfimages) as 'Export PDF' , 
  sum(cbslqaimages)-sum(clientqaacceptimages) as 'Client QA Pending', 
  sum(clientqaacceptimages) as 'Client QA',  sum(cbslqaimages) as 'CBSL QA', 
  sum(scanimages) as 'Scanned', 
  sum(inventoryimages) as 'Received'  
  from scanned
  `;

  if (locationNames && locationNames.length > 0) {
    query += ` WHERE locationname IN (?)`;
  }

  mysql22.query(query, [locationNames], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ error: 'Internal Server Error' }); // Send error response
    }
    res.json(results); // Send JSON response with query results
  });
});
app.get('/civil', cors(corsOptions), (req, res) => {
  const locationNames = req.query.locationname; // Retrieve location names from query parameter

  let query = "SELECT sum(scanfiles) as 'Civil Files', sum(scanimages) as 'Civil Images' FROM `scanned` WHERE casetypename NOT LIKE '%Criminal%'";

  if (locationNames && locationNames.length > 0) {
    query += " AND locationname IN (?)";
  }

  mysql22.query(query, [locationNames], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ error: 'Internal Server Error' }); // Send error response
    }
    res.json(results); // Send JSON response with query results
  });
});
app.get('/criminal', cors(corsOptions), (req, res) => {
  const locationNames = req.query.locationname; // Retrieve location names from query parameter

  let query = "SELECT  sum(scanfiles) as 'Criminal Files' , sum(scanimages) as 'Criminal Images' FROM `scanned` WHERE  casetypename Like '%Criminal%'";

  if (locationNames && locationNames.length > 0) {
    // If locationNames is an array, use parameterized query
    query += " AND locationname IN (?)";
  }

  mysql22.query(query, [locationNames], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ error: 'Internal Server Error' }); // Send error response
    }
    res.json(results); // Send JSON response with query results
  });
});

app.get('/graph7', cors(corsOptions), (req, res) => {
  const locationNames = req.query.locationname; // Retrieve location names from query parameter

  let query = "SELECT sum(exportpdffiles) as 'Export PDF', " +
    "sum(cbslqafiles) - sum(clientqaacceptfiles) as 'Client QA Pending', " +
    "sum(clientqaacceptfiles) as 'Client QA', " +
    "sum(cbslqafiles) as 'CBSL QA', " +
    "sum(scanfiles) as 'Scanned', " +
    "sum(inventoryfiles) as 'Received' " +
    "FROM scanned " +
    "WHERE (DATE(inventorydate) = CURDATE() - 1 " +
    "OR DATE(scandate) = CURDATE() - 1 " +
    "OR DATE(cbslqadate) = CURDATE() - 1 " +
    "OR DATE(clientqaacceptdate) = CURDATE() - 1 " +
    "OR DATE(exportdate) = CURDATE() - 1)";

  if (locationNames && locationNames.length > 0) {
    query += ` AND locationname IN (?)`;
  }

  mysql22.query(query, [locationNames], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ error: 'Internal Server Error' }); // Send error response
    }
    res.json(results); // Send JSON response with query results
  });
});

app.get('/graph8', cors(corsOptions), (req, res) => {
  const locationNames = req.query.locationname; // Retrieve location names from query parameter

  let query = "SELECT sum(exportpdfimages) as 'Export PDF', " +
    "sum(cbslqaimages) - sum(clientqaacceptimages) as 'Client QA Pending', " +
    "sum(clientqaacceptimages) as 'Client QA', " +
    "sum(cbslqaimages) as 'CBSL QA', " +
    "sum(scanimages) as 'Scanned', " +
    "sum(inventoryimages) as 'Received' " +
    "FROM scanned " +
    "WHERE (DATE(inventorydate) = CURDATE() - 1 " +
    "OR DATE(scandate) = CURDATE() - 1 " +
    "OR DATE(cbslqadate) = CURDATE() - 1 " +
    "OR DATE(clientqaacceptdate) = CURDATE() - 1 " +
    "OR DATE(exportdate) = CURDATE() - 1)";

  if (locationNames && locationNames.length > 0) {
    query += ` AND locationname IN (?)`;
  }

  mysql22.query(query, [locationNames], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ error: 'Internal Server Error' }); // Send error response
    }
    res.json(results); // Send JSON response with query results
  });
});

app.get('/graph8', cors(corsOptions), (req, res) => {
  const locationNames = req.query.locationname; // Retrieve location name from query parameter

  let query = "SELECT sum(exportpdfimages) as 'Export PDF' , sum(cbslqaimages)-sum(clientqaacceptimages) as 'Client QA Pending', sum(clientqaacceptimages) as 'Client QA',  sum(cbslqaimages) as 'CBSL QA', sum(scanimages) as 'Scanned', sum(inventoryimages) as 'Received'  from scanned where (DATE(`inventorydate`) = CURDATE()-1 or DATE(`scandate`) = CURDATE()-1 or DATE(`cbslqadate`) = CURDATE()-1 or DATE(`clientqaacceptdate`) = CURDATE()-1 or DATE(`exportdate`) = CURDATE()-1);";

  if (locationNames && locationNames.length > 0) {
    query += `  AND locationname IN (?)`;
  }

  mysql22.query(query, [locationNames], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ error: 'Internal Server Error' }); // Send error response
    }
    res.json(results); // Send JSON response with query results
  });
});
app.get('/graph9', cors(corsOptions), (req, res) => {
  const locationNames = req.query.locationname; // Retrieve location names from query parameter

  let query = "SELECT locationname AS 'Location Name', sum(scanimages) AS 'Images' FROM scanned WHERE scandate = CURDATE() - INTERVAL 1 DAY";

  if (locationNames && locationNames.length > 0) {
    query += ` AND locationname IN (?)`;
  }

  query += " GROUP BY locationname";

  mysql22.query(query, [locationNames], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ error: 'Internal Server Error' }); // Send error response
    }
    res.json(results); // Send JSON response with query results
  });
});

app.get('/graph10', cors(corsOptions), (req, res) => {
  const locationNames = req.query.locationname; // Retrieve location names from query parameter

  let query = "SELECT locationname AS 'Location Name', sum(scanimages) AS 'Images' FROM scanned";

  if (locationNames && locationNames.length > 0) {
    query += ` WHERE locationname IN (?)`;
  }

  query += " GROUP BY locationname";

  mysql22.query(query, [locationNames], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ error: 'Internal Server Error' }); // Send error response
    }
    res.json(results); // Send JSON response with query results
  });
});

app.get('/api/data', (req, res) => {
  let query1Results, query2Results;

  // Execute first query
  connection.query('SELECT * FROM table1', (error1, results1, fields1) => {
    if (error1) {
      console.error('Error executing first query: ', error1);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    query1Results = results1;

    // Execute second query
    connection.query('SELECT * FROM table2', (error2, results2, fields2) => {
      if (error2) {
        console.error('Error executing second query: ', error2);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }
      query2Results = results2;

      // Combine results
      const combinedResults = { query1Results, query2Results };
      res.json(combinedResults);
    });
  });
});

app.get('/api/tabularData', (req, res) => {
  const locationId = req.query.locationid; // Assuming locationid is passed as a query parameter

  let query = `
      SELECT 
      tt.LocationName as 'LocationName',
      tt.ScannedNoOfFilesTotal as 'Total_Files',
      tt.ScannedNoOfImagesTotal as 'Total_Images',
      td.ScannedNoOfFilesToday as 'Today_Files',
      td.ScannedNoOfImagesToday as 'Today_Images',
      tdyes.ScannedNoOfFilesYes as 'Yes_Files',
      tdyes.ScannedNoOfImagesYes as 'Yes_Images',
      tdprev.ScannedNoOfFilesPrev as 'Prev_Files',
      tdprev.ScannedNoOfImagesPrev as 'Prev_Images'
      FROM 
        (SELECT 
          s.locationname AS 'LocationName',
          SUM(s.scanfiles) AS 'ScannedNoOfFilesTotal',
          SUM(s.scanimages) AS 'ScannedNoOfImagesTotal' 
        FROM 
          scanned s 
        ${locationId
      ? `WHERE CONVERT(s.locationid, SIGNED) IN (${locationId})`
      : ""
    }
        GROUP BY 
          s.locationname) tt 
        LEFT JOIN 
          (SELECT 
            s.locationname AS 'LocationName',
            SUM(s.scanfiles) AS 'ScannedNoOfFilesYes',
            SUM(s.scanimages) AS 'ScannedNoOfImagesYes' 
          FROM 
            scanned s 
          WHERE 
            s.scandate = CURDATE() - INTERVAL 1 DAY 
            ${locationId
      ? `AND CONVERT(s.locationid, SIGNED) IN (${locationId})`
      : ""
    }
          GROUP BY 
            s.locationname) tdyes 
        ON 
          tdyes.LocationName = tt.LocationName 
        LEFT JOIN 
          (SELECT 
            s.locationname AS 'LocationName',
            SUM(s.scanfiles) AS 'ScannedNoOfFilesPrev',
            SUM(s.scanimages) AS 'ScannedNoOfImagesPrev' 
          FROM 
            scanned s 
          WHERE 
            s.scandate = CURDATE() - INTERVAL 2 DAY 
            ${locationId
      ? `AND CONVERT(s.locationid, SIGNED) IN (${locationId})`
      : ""
    }
          GROUP BY 
            s.locationname) tdprev 
        ON 
          tdprev.LocationName = tt.LocationName 
        LEFT JOIN 
          (SELECT 
            s.locationname AS 'LocationName',
            SUM(s.scanfiles) AS 'ScannedNoOfFilesToday',
            SUM(s.scanimages) AS 'ScannedNoOfImagesToday' 
          FROM 
            scanned s 
          WHERE 
            s.scandate = CURDATE() 
            ${locationId
      ? `AND CONVERT(s.locationid, SIGNED) IN (${locationId})`
      : ""
    }
          GROUP BY 
            s.locationname) td 
        ON 
          td.LocationName = tt.LocationName 
      ORDER BY 
        tt.LocationName
    `;

  // Execute the query
  mysql22.query(query, (err, results) => {
    if (err) {
      throw err;
    }
    res.json(results);
  });
});

app.get('/graph2', cors(corsOptions), (req, res) => {
  mysql22.query("SELECT sum(exportpdfimages) as 'Export PDF' , sum(cbslqaimages)-sum(clientqaacceptimages) as 'Client QA Pending', sum(clientqaacceptimages) as 'Client QA',  sum(cbslqaimages) as 'CBSL QA', sum(scanimages) as 'Scanned', sum(inventoryimages) as 'Received'  from scanned;", (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

app.get('/graph9', cors(corsOptions), (req, res) => {
  mysql22.query("SELECT locationname 'Location Name',sum(`scanimages`) as 'Images' FROM scanned where scandate= CURDATE()- INTERVAL 1 DAY group by locationname;", (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

app.get('/graph10', cors(corsOptions), (req, res) => {
  mysql22.query("SELECT locationname 'Location Name',sum(`scanimages`) as 'Images' FROM scanned group by locationname;", (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

app.use("/searchlocation", (req, res, next) => {
  let data =
    "SELECT locationid,locationname as 'LocationName',sum(`inventoryfiles`) as 'CollectionFiles',sum(`inventoryimages`) as 'CollectionImages',sum(`scanfiles`) as 'ScannedFiles',sum(`scanimages`) as 'ScannedImages',sum(`qcfiles`) as 'QCFiles',sum(`qcimages`) as 'QCImages',sum(`flaggingfiles`)  as 'FlaggingFiles',sum(`flaggingimages`)  as 'FlaggingImages',sum(`indexfiles`) as 'IndexingFiles',sum(`indeximages`) as 'IndexingImages',sum(`cbslqafiles`)  as 'CBSL_QAFiles',sum(`cbslqaimages`) as 'CBSL_QAImages',sum(`exportpdffiles`)  as 'Export_PdfFiles', sum(`exportpdfimages`)  as 'Export_PdfImages',sum(`clientqaacceptfiles`)  as 'Client_QA_AcceptedFiles', sum(`clientqaacceptimages`)  as 'Client QA AcceptedImages',sum(`clientqarejectfiles`)  as 'Client_QA_RejectedFiles',sum(`clientqarejectimages`)  as 'Client_QA_RejectedImages',sum(`digisignfiles`)  as 'Digi_SignFiles',sum(`digisignimages`)  as 'Digi_SignImages' FROM scanned  group by locationname;";
  misdb.query(data, (error, results, fields) => {
    if (error) {
      res.status(500).send(error.message);
      return;
    }
    const filters = req.query;
    const filteredUsers = results.filter((user) => {
      let isValid = true;
      for (key in filters) {
        console.log(key, user[key], filters[key]);
        isValid = isValid && user[key] == filters[key];
      }
      return isValid;
    });

    res.send(filteredUsers);
  });
});

function formatDate(date) {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

app.get("/csv", cors(corsOptions), (req, res, next) => {
  // Extract location names from the request query parameters
  let locationNames = req.query.locationName;


  // If locationNames is not provided or is an empty array, set it to null
  if (!locationNames || (Array.isArray(locationNames) && locationNames.length === 0)) {
    locationNames = null;
  } else if (!Array.isArray(locationNames)) {
    // If locationNames is not an array, convert it to an array
    locationNames = [locationNames];
  }


  // Modify the SQL query to include a WHERE clause if specific locations are provided
  let whereClause = "";
  if (locationNames) {
    const locationConditions = locationNames.map(name => `tt.LocationName = '${name}'`).join(' OR ');
    whereClause = `WHERE ${locationConditions}`;
  }


  const getCsv = `
    SELECT tt.LocationName as 'LocationName',
    case when tt.ScannedNoOfFilesTotal is null then '0' else tt.ScannedNoOfFilesTotal end as 'Total_Files',
    case when tt.ScannedNoOfImagesTotal is null then '0' else tt.ScannedNoOfImagesTotal end as 'Total_Images',
    case when td.ScannedNoOfFilesToday is null then '0' else td.ScannedNoOfFilesToday end as 'Today_Files',
    case when td.ScannedNoOfImagesToday is null then '0' else td.ScannedNoOfImagesToday end as 'Today_Images',
    case when tdyes.ScannedNoOfFilesYes is null then '0' else tdyes.ScannedNoOfFilesYes end as 'Yes_Files',
    case when tdyes.ScannedNoOfImagesYes is null then '0' else tdyes.ScannedNoOfImagesYes end as 'Yes_Images',
    case when tdprev.ScannedNoOfFilesPrev is null then '0' else tdprev.ScannedNoOfFilesPrev end as 'Prev_Files',
    case when tdprev.ScannedNoOfImagesPrev is null then '0' else tdprev.ScannedNoOfImagesPrev end as 'Prev_Images'
    FROM (SELECT s.locationname 'LocationName',
    SUM(s.scanfiles) as 'ScannedNoOfFilesTotal',
    SUM(s.scanimages) as 'ScannedNoOfImagesTotal'
    FROM scanned s
    GROUP BY s.locationname) tt
    LEFT JOIN (SELECT s.locationname 'LocationName',
    SUM(s.scanfiles) as 'ScannedNoOfFilesYes',
    SUM(s.scanimages) as 'ScannedNoOfImagesYes'
    FROM scanned s 
    WHERE s.scandate = CURDATE() - INTERVAL 1 DAY
    GROUP BY s.locationname) tdyes
    ON tdyes.LocationName = tt.LocationName 
    LEFT JOIN (SELECT s.locationname 'LocationName',
    SUM(s.scanfiles) as 'ScannedNoOfFilesPrev',
    SUM(s.scanimages) as 'ScannedNoOfImagesPrev'
    FROM scanned s 
    WHERE s.scandate = CURDATE() - INTERVAL 2 DAY 
    GROUP BY s.locationname) tdprev 
    ON tdprev.LocationName = tt.LocationName 
    LEFT JOIN (SELECT s.locationname 'LocationName',
    SUM(s.scanfiles) as 'ScannedNoOfFilesToday',
    SUM(s.scanimages) as 'ScannedNoOfImagesToday'
    FROM scanned s 
    WHERE s.scandate = CURDATE()
    GROUP BY s.locationname) td 
    ON td.LocationName = tt.LocationName 
    ${whereClause}
    ORDER BY tt.LocationName;`;


  mysql22.query(getCsv, (error, result, field) => {
    if (error) {
      console.error("Error occurred when exporting csv:", error);
      res.status(500).json({ error: "An error occurred while exporting the CSV file" });
      return;
    }
    const formattedPreviousDate = formatDate(new Date(Date.now() - 86400000)); // Previous date
    const formattedYesterdayDate = formatDate(new Date(Date.now() - 2 * 86400000)); // Yesterday date
    const formattedCurrentDate = formatDate(new Date()); // Current date
    const data = result;
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment;filename=export.csv");
    res.write(`Sr No.,Location Name,Scanned (${formattedYesterdayDate}),Scanned (${formattedYesterdayDate}),Scanned (${formattedPreviousDate}),Scanned (${formattedPreviousDate}),Scanned (${formattedCurrentDate}),Scanned (${formattedCurrentDate}),Cumulative till date,Cumulative till date,Remarks\n`);
    res.write(`,  ,Files,Images,Files,Images,Files,Images,Files,Images\n`);
    if (data == null) {
      res.end();
      return;
    }
    data.forEach((row, index) => {
      res.write(
        (index + 1) + "," +
        row.LocationName +
        "," +
        row.Prev_Files +
        "," +
        row.Prev_Images +
        "," +
        row.Yes_Files +
        "," +
        row.Yes_Images +
        "," +
        row.Today_Files +
        "," +
        row.Today_Images +
        "," +
        row.Total_Files +
        "," +
        row.Total_Images +
        "\n"
      );
    });

    res.end();
  });
});

app.get('/tabularData', cors(corsOptions), (req, res) => {
  mysql22.query(`
    SELECT tt.LocationName as 'LocationName',
           tt.ScannedNoOfFilesTotal as 'Total_Files',
           tt.ScannedNoOfImagesTotal as 'Total_Images',
           td.ScannedNoOfFilesToday as 'Today_Files',
           td.ScannedNoOfImagesToday as 'Today_Images',
           tdyes.ScannedNoOfFilesYes as 'Yes_Files',
           tdyes.ScannedNoOfImagesYes as 'Yes_Images',
           tdprev.ScannedNoOfFilesPrev as 'Prev_Files',
           tdprev.ScannedNoOfImagesPrev as 'Prev_Images'
    FROM (SELECT s.locationname 'LocationName',
                 SUM(s.scanfiles) as 'ScannedNoOfFilesTotal',
                 SUM(s.scanimages) as 'ScannedNoOfImagesTotal'
          FROM scanned s
          GROUP BY s.locationname) tt
    LEFT JOIN (SELECT s.locationname 'LocationName',
                      SUM(s.scanfiles) as 'ScannedNoOfFilesYes',
                      SUM(s.scanimages) as 'ScannedNoOfImagesYes'
               FROM scanned s
               WHERE s.scandate = CURDATE() - INTERVAL 1 DAY
               GROUP BY s.locationname) tdyes
           ON tdyes.LocationName = tt.LocationName
    LEFT JOIN (SELECT s.locationname 'LocationName',
                      SUM(s.scanfiles) as 'ScannedNoOfFilesPrev',
                      SUM(s.scanimages) as 'ScannedNoOfImagesPrev'
               FROM scanned s
               WHERE s.scandate = CURDATE() - INTERVAL 2 DAY
               GROUP BY s.locationname) tdprev
           ON tdprev.LocationName = tt.LocationName
    LEFT JOIN (SELECT s.locationname 'LocationName',
                      SUM(s.scanfiles) as 'ScannedNoOfFilesToday',
                      SUM(s.scanimages) as 'ScannedNoOfImagesToday'
               FROM scanned s
               WHERE s.scandate = CURDATE()
               GROUP BY s.locationname) td
           ON td.LocationName = tt.LocationName
    ORDER BY tt.LocationName;
  ;`, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});
app.get('/api/uploadlog', (req, res) => {
  let whereClause = ''; // Assuming you will pass the where clause as a query parameter

  let query = `
    SELECT 
      l.locationname,
      MAX(CAST(t.filedate AS DATE)) AS filedate,
      MAX(CAST(t.upload_date AS DATE)) AS uploaddate,
      MAX(t.appVersion) AS appVersion
    FROM 
      tbl_upload_log t 
      INNER JOIN 
      locationmaster l 
      ON 
      l.locationcode = CAST(t.location_code AS INT)
      ${whereClause}
    GROUP BY 
      l.locationname
    ORDER BY 
      MAX(t.upload_date) DESC;
  `;

  // Execute the query
  mysql22.query(query, (err, results) => {
    if (err) {
      throw err;
    }
    res.json(results);
  });
});



app.get('/group_master', cors(corsOptions), (req, res) => {
  misdb.query("select group_id,group_name from tbl_group_master order by group_name asc;", (err, results) => {
    if (err) {
      throw err;
    }
    res.json(results);
  })
})

app.get("/privilege", cors(corsOptions), (req, res) => {
  misdb.query("select role_id,user_role from tbl_user_roles order by user_role asc;", (err, results) => {
    if (err) {
      throw err;
    }
    res.json(results);
  })
})

app.get("/storage", cors(corsOptions), (req, res) => {
  misdb.query("select * from tbl_storage_level", (err, results) => {
    if (err) {
      throw err;
    }
    res.json(results);
  })
})

app.get("/reporting", cors(corsOptions), (req, res) => {
  misdb.query("select * from tbl_user_master where user_id  and active_inactive_users='1' order by first_name,last_name asc;", (err, results) => {
    if (err) {
      throw err;
    }
    res.json(results)
  })
})
app.get('/user_master', cors(corsOptions), (req, res) => {
  misdb.query("SELECT u.*, r.user_role FROM tbl_user_master u " +
    "LEFT JOIN tbl_bridge_role_to_um br ON u.user_id = br.user_ids " +
    "LEFT JOIN tbl_user_roles r ON br.role_id = r.role_id " +
    "ORDER BY u.first_name, u.last_name ASC;",
    (err, results) => {
      if (err) {
        console.error("Error fetching user data:", err);
        return res.status(500).json({ error: "An error occurred while fetching user data" });
      }
      res.json(results);
    });
});

// app.post('/upload', upload.single('excelFile'), (req, res) => {
//   const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
//   const sheetName = workbook.SheetNames[0];
//   const sheet = workbook.Sheets[sheetName];
//   const data = xlsx.utils.sheet_to_json(sheet);

//   const sql = 'INSERT INTO your_table_name (column1, column2, column3) VALUES ?';
//   const values = data.map(row => [row.column1, row.column2, row.column3]);

//   misdb.query(sql, [values], (err, result) => {
//     if (err) {
//       console.error('Error inserting data into database:', err);
//       res.status(500).send('Internal Server Error');
//     } else {
//       console.log('Data inserted successfully');
//       res.status(200).send('File uploaded and data saved to database');
//     }
//   });
// });

app.post("/site_MP", (req, res) => {
  const {
    PH_Id,
    PO_Id,
    PM_Id,
    PCo_Id,
    SM_Id,
     Location_ID,
    Coll_Index_MP,
    Barc_MP,
    Barc_TF,
    Barc_TI,
    Page_No_MP,
    Prepare_MP,
    Prepare_TF,
    Prepare_TI,
    Scan_MP,
    Cover_Page_MP,
    Cover_Page_TF,
    Rescan_MP,
    Image_QC_MP,
    Doc_MP,
    Index_MP,
    CBSL_QA_MP,
    Ready_Cust_QA_MP,
    Cust_QA_Done_MP,
    PDF_Export_MP,
    Refilling_Files_MP,
    Refilling_Files_TF,
    Refilling_Files_TI,
    Inventory_MP,
   
  } = req.body;
  const query =
    "INSERT INTO tbl_site_mp (PH_Id,PO_Id, PM_Id, PCo_Id, SM_Id,Location_ID, Coll_Index_MP, Barc_MP, Barc_TF, Barc_TI, Page_No_MP, Prepare_MP, Prepare_TF, Prepare_TI, Scan_MP, Cover_Page_MP, Cover_Page_TF, Rescan_MP, Image_QC_MP, Doc_MP, Index_MP, CBSL_QA_MP, Ready_Cust_QA_MP, Cust_QA_Done_MP, PDF_Export_MP, Refilling_Files_MP, Refilling_Files_TF, Refilling_Files_TI, Inventory_MP) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
  misdb.query(
    query,
    [
      PH_Id,
      PO_Id,
      PM_Id,
      PCo_Id,
      SM_Id,
      Location_ID,
      Coll_Index_MP,
      Barc_MP,
      Barc_TF,
      Barc_TI,
      Page_No_MP,
      Prepare_MP,
      Prepare_TF,
      Prepare_TI,
      Scan_MP,
      Cover_Page_MP,
      Cover_Page_TF,
      Rescan_MP,
      Image_QC_MP,
      Doc_MP,
      Index_MP,
      CBSL_QA_MP,
      Ready_Cust_QA_MP,
      Cust_QA_Done_MP,
      PDF_Export_MP,
      Refilling_Files_MP,
      Refilling_Files_TF,
      Refilling_Files_TI,
      Inventory_MP,
     
    ],
    (err, result) => {
      if (err) {
        console.error("Error inserting user:", err);
        res
          .status(500)
          .json({ error: "An error occurred while inserting user" });
      } else {
        res
          .status(200)
          .json({
            message: "ManPower added successfully",
            id: result.insertId,
          });
      }
    }
  );
});


app.post("/createuser", (req, res) => {
  const data = req.body;
  bcrypt.genSalt(10, (err, salt) => {
    if (err) {
      console.error("Error generating salt:", err);
      return res.status(500).json({ error: "An error occurred while encrypting password" });
    }
    // Hash the password using the generated salt
    bcrypt.hash(data.password, salt, (err, hashedPassword) => {
      if (err) {
        console.error("Error hashing password:", err);
        return res.status(500).json({ error: "An error occurred while encrypting password" });
      }
      // Replace the plain text password with the hashed password
      data.password = hashedPassword;
      const selectQuery = "SELECT * FROM tbl_user_master WHERE user_email_id=?";
      misdb.query(selectQuery, [data.user_email_id], (err, rows) => {
        if (err) {
          console.error("Error checking user existence:", err);
          return res.status(500).json({ error: "An error occurred while checking user existence" });
        }
        // If user already exists, return error
        if (rows.length > 0) {
          return res.status(500).json({ error: "User already exists" });
        }
        const currentDateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const query1 = "INSERT INTO tbl_user_master (user_email_id,first_name,middle_name,last_name,password,designation,phone_no,profile_picture,superior_name,superior_email,user_created_date,emp_id,last_pass_change,login_disabled_date,fpi_template, fpi_template_two,fpi_template_three,fpi_template_four,lang,locations,user_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        misdb.query(query1, [data.user_email_id, data.first_name, data.middle_name, data.last_name, data.password, data.designation, data.phone_no, data.profile_picture, data.superior_name, data.superior_email, currentDateTime, data.emp_id, data.last_pass_change, data.login_disabled_date, data.fpi_template, data.fpi_template_two, data.fpi_template_three, data.fpi_template_four, data.lang, data.locations, data.user_type], (err, results) => {
          if (err) {
            console.error("Error inserting user:", err);
            return res.status(500).json({ error: "An error occurred while inserting user" });
          }
          const user_id = results.insertId;
          const query2 = "INSERT INTO tbl_storagelevel_to_permission (user_id, sl_id) VALUES (?, ?)";
          misdb.query(query2, [user_id, data.sl_id], (err, results) => {
            if (err) {
              console.error("Error linking user with permission:", err);
              return res.status(500).json({ error: "An error occurred while linking user with permission" });
            }
            const query3 = "INSERT INTO tbl_ezeefile_logs (user_id, user_name, action_name, start_date, system_ip, remarks) VALUES (?, ?, ?, ?, ?, ?)";
            misdb.query(query3, [user_id, data.user_name, data.action_name, data.start_date, data.system_ip, data.remarks], (err, results) => {
              if (err) {
                console.error("Error inserting user log:", err);
                return res.status(500).json({ error: "An error occurred while inserting user log" });
              }
              // First, perform a SELECT query to check if a row with the provided role_id exists
              const selectQueryRole = "SELECT * FROM tbl_bridge_role_to_um WHERE role_id = ?";
              misdb.query(selectQueryRole, [data.role_id], (err, rowsRole) => {
                if (err) {
                  console.error("Error checking role existence:", err);
                  return res.status(500).json({ error: "An error occurred while checking role existence" });
                }
                if (rowsRole.length > 0) {
                  // If a row with the role_id exists, update the user_ids
                  const updateQueryRole = "UPDATE tbl_bridge_role_to_um SET user_ids = CONCAT(user_ids, ', ', ?) WHERE role_id = ?";
                  misdb.query(updateQueryRole, [user_id, data.role_id], (err, resultsRole) => {
                    if (err) {
                      console.error("Error updating user role:", err);
                      return res.status(500).json({ error: "An error occurred while updating user role" });
                    }
                  });
                } else {
                  // If a row with the role_id does not exist, insert a new row
                  const insertQueryRole = "INSERT INTO tbl_bridge_role_to_um (role_id, user_ids) VALUES (?, ?)";
                  misdb.query(insertQueryRole, [data.role_id, user_id], (err, resultsRole) => {
                    if (err) {
                      console.error("Error inserting user role:", err);
                      return res.status(500).json({ error: "An error occurred while inserting user role" });
                    }
                  });
                }
                // First, perform a SELECT query to check if the row exists
                const selectQueryGroup = "SELECT * FROM tbl_bridge_grp_to_um WHERE group_id = ?";
                misdb.query(selectQueryGroup, [data.group_id], (err, rowsGroup) => {
                  if (err) {
                    console.error("Error checking group existence:", err);
                    return res.status(500).json({ error: "An error occurred while checking group existence" });
                  }
                  if (rowsGroup.length > 0) {
                    const updateQueryGroup = "UPDATE tbl_bridge_grp_to_um SET user_ids = CONCAT(user_ids, ', ', ?), roleids = CONCAT(roleids, ', ', ?) WHERE group_id = ?";
                    misdb.query(updateQueryGroup, [user_id, data.role_id, data.group_id], (err, resultsGroup) => {
                      if (err) {
                        console.error("Error updating user group:", err);
                        return res.status(500).json({ error: "An error occurred while updating user group" });
                      }
                    });
                  } else {
                    const insertQueryGroup = "INSERT INTO tbl_bridge_grp_to_um (group_id, user_ids, roleids) VALUES (?, ?, ?)";
                    misdb.query(insertQueryGroup, [data.group_id, user_id, data.role_id], (err, resultsGroup) => {
                      if (err) {
                        console.error("Error inserting user group:", err);
                        return res.status(500).json({ error: "An error occurred while inserting user group" });
                      }
                    });
                  }
                  const mailData = {
                    from: 'rachnacbsl@gmail.com',
                    to: data.user_email_id,
                    subject: 'Welcome to Our Platform!',
                    text: `Dear ${data.first_name},\n\nWelcome to our platform! Your account has been successfully created.\nUsername: ${data.user_email_id}\nPassword: ${data.password}\n`,
                    html: `<p>Dear ${data.first_name},</p><p>Welcome to our platform! Your account has been successfully created.</p><p>Username: ${data.user_email_id}</p><p>Password: ${data.password}</p>`
                  };
                  transporter.sendMail(mailData, (error, info) => {
                    if (error) {
                      console.error('Error sending welcome email:', error);
                    } else {
                      console.log('Welcome email sent:', info.response);
                    }
                    
                    res.status(200).json({ message: "User added successfully", id: user_id });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});


app.post("/login", (req, res) => {
  const { user_email_id, password } = req.body;
  const selectQuery = "SELECT * FROM tbl_user_master WHERE user_email_id=?";
  
  misdb.query(selectQuery, [user_email_id], (err, rows) => {
    if (err) {
      console.error("Error checking user existence:", err);
      return res.status(500).json({ error: "An error occurred while checking user existence" });
    }
    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const userData = rows[0];
    const hashedPassword = userData.password;
    bcrypt.compare(password, hashedPassword, (err, result) => {
      if (err) {
        console.error("Error comparing passwords:", err);
        return res.status(500).json({ error: "An error occurred while comparing passwords" });
      }
      if (result) {
        const updateQuery = "UPDATE tbl_user_master SET last_active_login = NOW() WHERE user_email_id = ?";
        misdb.query(updateQuery, [user_email_id], (err) => {
          if (err) {
            console.error("Error updating last_active_login:", err);
            return res.status(500).json({ error: "An error occurred while updating last_active_login" });
          }
          const selectRolesQuery = `
          SELECT u.*, r.user_role 
          FROM tbl_user_master u
          LEFT JOIN tbl_bridge_role_to_um br ON FIND_IN_SET(u.user_id, REPLACE(br.user_ids, ' ','')) > 0
          LEFT JOIN tbl_user_roles r ON br.role_id = r.role_id
          WHERE u.user_email_id = ?
        `;
          misdb.query(selectRolesQuery, [user_email_id], (err,roleRows) => {
            if (err) {
              console.error("Error fetching user role:", err);
              return res.status(500).json({ error: "An error occurred while fetching user role" });
            }
            if (roleRows.length === 0) {
              return res.status(404).json({ error: "User role not found" });
            }
            const user_roles = roleRows.map(row => row.user_role);
            const { user_id, first_name, last_active_login } = userData;
            return res.status(200).json({ message: "Login successful", user_id, first_name, last_active_login, user_roles });
          });
        });
      } else {
        return res.status(401).json({ error: "Invalid password" });
      }
    });
  });
});

app.post('/userinfo', (req, res) => {
  const { name, email, phone, password } = req.body;
  const query =
    "INSERT INTO userinfo (username, email, phone, password) VALUES (?, ?, ?, ?)";
  db.query(query, [name, email, phone, password], (err, result) => {
    if (err) {
      console.error("Error inserting user:", err);
      res.status(500).json({ error: "An error occurred while inserting user" });
    } else {
      res
        .status(200)
        .json({ message: "User added successfully", id: result.insertId });
    }
  });
});

app.post("/createuser", (req, res) => {
  const data = req.body;
  // console.log("data",req.body);

  const selectQuery = "SELECT * FROM tbl_user_master WHERE user_email_id=?";
  misdb.query(selectQuery, [data.user_email_id], (err, rows) => {
    if (err) {
      console.error("Error checking user existence:", err);
      return res.status(500).json({ error: "An error occurred while checking user existence" });
    }

    // If user already exists, return error
    if (rows.length > 0) {
      return res.status(500).json({ error: "User already exists" });
    }

    const query1 = "INSERT INTO tbl_user_master (user_email_id,first_name,middle_name,last_name,password,designation,phone_no,profile_picture,superior_name,superior_email,user_created_date,emp_id,last_pass_change,login_disabled_date,fpi_template, fpi_template_two,fpi_template_three,fpi_template_four,lang,locations,user_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    misdb.query(query1, [data.user_email_id, data.first_name, data.middle_name, data.last_name, data.password, data.designation, data.phone_no, data.profile_picture, data.superior_name, data.superior_email, data.user_created_date, data.emp_id, data.last_pass_change, data.login_disabled_date, data.fpi_template, data.fpi_template_two, data.fpi_template_three, data.fpi_template_four, data.lang, data.locations, data.user_type], (err, results) => {
      if (err) {
        console.error("Error inserting user:", err);
        res.status(500).json({ error: "An error occurred while inserting user" });
      } else {
        res
          .status(200)
          .json({ message: "User added successfully", id: result.insertId });
      }
    });
  });
  app.post("/groupmasterinfo", (req, res) => {
    const { group_id, group_name } = req.body;
    const query = 'INSERT INTO tbl_group_master (group_id, group_name) VALUES (?, ?)';
    misdb.query(query, [group_id, group_name], (err, result) => {
      if (err) {
        console.error("Error inserting user:", err);
        res.status(500).json({ error: "An error occurred while inserting user" });
      } else {
        res
          .status(200)
          .json({ message: "Group added successfully", id: result.insertId });
      }
    });
  });
  app.post('/usermasterinfo', (req, res) => {
    const { Desig_ID, Desig_name } = req.body;
    const query =
      "INSERT INTO tbl_designation_master (Desig_ID, Desig_name) VALUES (?, ?)";
    misdb.query(query, [Desig_ID, Desig_name], (err, result) => {
      if (err) {
        console.error("Error inserting user:", err);
        res.status(500).json({ error: 'An error occurred while inserting user' });
      } else {
        res.status(200).json({ message: 'User added successfully', id: result.insertId });
      }
    });
  });
  // app.post('/site_MP', (req, res) => {
  //   const { PH_Id, PO_Id, PM_Id, PCo_Id, SM_Id, Coll_Index_MP, Barc_MP, Barc_TF, Barc_TI, Page_No_MP, Prepare_MP, Prepare_TF, Prepare_TI, Scan_MP, Cover_Page_MP, Cover_Page_TF, Rescan_MP, Image_QC_MP, Doc_MP, Index_MP, CBSL_QA_MP, Ready_Cust_QA_MP, Cust_QA_Done_MP, PDF_Export_MP, Refilling_Files_MP, Refilling_Files_TF, Refilling_Files_TI, Inventory_MP, Location_Id, } = req.body;
  //   const query = 'INSERT INTO tbl_site_mp (PH_Id,PO_Id, PM_Id, PCo_Id, SM_Id, Coll_Index_MP, Barc_MP, Barc_TF, Barc_TI, Page_No_MP, Prepare_MP, Prepare_TF, Prepare_TI, Scan_MP, Cover_Page_MP, Cover_Page_TF, Rescan_MP, Image_QC_MP, Doc_MP, Index_MP, CBSL_QA_MP, Ready_Cust_QA_MP, Cust_QA_Done_MP, PDF_Export_MP, Refilling_Files_MP, Refilling_Files_TF, Refilling_Files_TI, Inventory_MP, Location_ID) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
  //   misdb.query(query, [PH_Id, PO_Id, PM_Id, PCo_Id, SM_Id, Coll_Index_MP, Barc_MP, Barc_TF, Barc_TI, Page_No_MP, Prepare_MP, Prepare_TF, Prepare_TI, Scan_MP, Cover_Page_MP, Cover_Page_TF, Rescan_MP, Image_QC_MP, Doc_MP, Index_MP, CBSL_QA_MP, Ready_Cust_QA_MP, Cust_QA_Done_MP, PDF_Export_MP, Refilling_Files_MP, Refilling_Files_TF, Refilling_Files_TI, Inventory_MP, Location_Id,], (err, result) => {
  //     if (err) {
  //       console.error("Error inserting user:", err);
  //       res.status(500).json({ error: 'An error occurred while inserting user' });
  //     } else {
  //       res.status(200).json({ message: 'ManPower added successfully', id: result.insertId });
  //     }
  //   });
  // });

  
  
  

  app.put('/usermasterupdate/:Desig_ID', (req, res) => {
    const { Desig_name, Desig_ID } = req.body;
    const query =
      "UPDATE tbl_designation_master SET Desig_name = ? where Desig_ID = ?;";
    misdb.query(query, [Desig_name, Desig_ID], (err, result) => {
      if (err) {
        console.error("Error inserting user:", err);
        res.status(500).json({ error: "An error occurred while updating user" });
      } else {
        res.status(200).json({ message: 'User updated successfully', id: req.params.Desig_ID });

      }
    });
  });

  app.put("/createuserupdate/:user_id", (req, res) => {
    const data = req.body;
    console.log(req.body)
    const { user_id } = req.params;
    const query1 = `
    UPDATE tbl_user_master 
    SET 
      user_email_id = ?, 
      first_name = ?, 
      middle_name = ?, 
      last_name = ?, 
      password = ?, 
      designation = ?, 
      phone_no = ?, 
      profile_picture = ?, 
      superior_name = ?, 
      superior_email = ?, 
      user_created_date = ?, 
      emp_id = ?, 
      last_pass_change = ?, 
      login_disabled_date = ?, 
      fpi_template = ?, 
      fpi_template_two = ?, 
      fpi_template_three = ?, 
      fpi_template_four = ?, 
      lang = ?, 
      locations = ?, 
      user_type = ?
    WHERE user_id = ?
  `;

    const params1 = [
      data.user_email_id,
      data.first_name,
      data.middle_name,
      data.last_name,
      data.password,
      data.designation,
      data.phone_no,
      data.profile_picture,
      data.superior_name,
      data.superior_email,
      data.user_created_date,
      data.emp_id,
      data.last_pass_change,
      data.login_disabled_date,
      data.fpi_template,
      data.fpi_template_two,
      data.fpi_template_three,
      data.fpi_template_four,
      data.lang,
      data.locations,
      data.user_type,
      user_id
    ];

    misdb.query(query1, params1, (err, results) => {
      if (err) {
        console.error("Error updating user:", err);
        return res.status(500).json({ error: "An error occurred while updating user" });
      }

      const query2 = `
      UPDATE tbl_bridge_role_to_um 
      SET
        user_ids=?
      WHERE
        role_id=?
    `;
      const params2 = [
        data.role_id,
        user_id,
        data.user_ids,

      ];
      misdb.query(query2, params2, (err, results) => {
        if (err) {
          console.error("Error updating user role:", err);
          return res.status(500).json({ error: "An error occurred while updating user role" });
        }
        const query3 = `
        UPDATE tbl_bridge_grp_to_um 
        SET
          user_ids=?
        WHERE
          group_id=?
      `;
        const params3 = [
          data.group_id,
          user_id,
          data.user_ids,

        ];
        misdb.query(query3, params3, (err, results) => {
          if (err) {
            console.error("Error updating user group:", err);
            return res.status(500).json({ error: "An error occurred while updating user group" });
          }
          res.status(200).json({ message: "User updated successfully", id: user_id });
        });
      });
    });
  });

  app.delete("/createuserdelete/:user_id", (req, res) => {
    const { user_id } = req.params;
    misdb.query(
      "DELETE FROM tbl_user_master WHERE user_id = ?",
      [user_id],
      (err) => {
        if (err) throw err;
        res.json({ message: "User deleted successfully" });
      }
    );
  });

  app.delete("/usermasterdelete/:Desig_ID", (req, res) => {
    const { Desig_ID } = req.params;
    misdb.query(
      "DELETE FROM tbl_designation_master WHERE Desig_ID = ?",
      [Desig_ID],
      (err) => {
        if (err) throw err;
        res.json({ message: "User deleted successfully" });
      }
    );
  });
});
