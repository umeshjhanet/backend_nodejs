const express = require('express');
var cors = require('cors')
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const xlsx = require('xlsx');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const unzipper = require('unzipper');
const fs = require('fs');
const fsPromises = fs.promises;
const { promisify } = require('util');
const moment = require('moment-timezone');
const readStream = require('fs').createReadStream;
const saltRounds = 10;
const csv = require('csv-parser');

const hostname = "192.168.3.48";
const app = express();
const PORT = process.env.PORT || 3001;


app.use(express.json());
const corsOptions = {
    origin: '*', // You can restrict this to specific origins if needed
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

function formatDate(date) {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

const pool = mysql.createPool({
  host: '192.168.3.48',
  user: 'umesh',
  password: 'admin@123',
  database: 'ezeefile_updc',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});


// const pool = mysql.createPool({
//   host: 'localhost',
//   user: 'root',
//   password: 'root',
//   database: 'updc_live',
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
//   port:'3306'
// });

const promisePool = pool.promise();


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
app.options("/users",  (req, res) => {
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
  mysql22.query(query, [dataWithManualFields], (err, result) => {
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



app.get('/server_status', async (req, res) => {
  try {
    // Subquery to select the latest date for each location
    const subquery = `
      SELECT locationcode, MAX(backuptime) AS max_date
      FROM tbl_server_status
      GROUP BY locationcode
    `;

    // Query to join with subquery to get the latest status for each location
    const query = `
      SELECT ss.*
      FROM tbl_server_status ss
      JOIN (${subquery}) latest
      ON ss.locationcode = latest.locationcode AND ss.backuptime = latest.max_date
      ORDER BY ss.backuptime DESC
    `;

    const [rows, fields] = await promisePool.query(query);

    if (rows.length === 0) {
      res.status(404).json({ error: "No server status data found" });
    } else {
      // Log the rows for debugging purposes
      console.log('Fetched rows:', rows);

      // Filter out rows with missing or invalid data
      const validRows = rows.filter(row => {
        return row.location && row.backuppath && !isNaN(Date.parse(row.backuptime));
      });

      // Handle case where all rows are invalid
      if (validRows.length === 0) {
        res.status(404).json({ error: "No valid server status data found" });
      } else {
        res.json(validRows); // Send valid rows containing the latest status for each location
      }
    }
  } catch (error) {
    console.error('Database query failed:', error);
    res.status(500).send('Internal Server Error');
  }
});




app.get('/users', (req, res) => {
  mysql22.query('SELECT * from tbl_user_master;', (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

app.get('/summaryLocation', async (req, res) => {
  const locationName = req.query.locationname; // Retrieve location name from query parameter

  if (!locationName) {
    return res.status(400).json({ error: "Location name is required" }); // Return error if location name is not provided
  }

  try {
    const [rows, fields] = await promisePool.query(
      "SELECT locationname, Count(distinct locationid) as TotalLocation, sum(`inventoryfiles`) as 'CollectionFiles', sum(`inventoryimages`) as 'CollectionImages', sum(`scanfiles`) as 'ScannedFiles', sum(`scanimages`) as 'ScannedImages', sum(`qcfiles`) as 'QCFiles', sum(`qcimages`) as 'QCImages', sum(`flaggingfiles`) as 'FlaggingFiles', sum(`flaggingimages`) as 'FlaggingImages', sum(`indexfiles`) as 'IndexingFiles', sum(`indeximages`) as 'IndexingImages', sum(`cbslqafiles`) as 'CBSL_QAFiles', sum(`cbslqaimages`) as 'CBSL_QAImages', sum(`exportpdffiles`) as 'Export_PdfFiles', sum(`exportpdfimages`) as 'Export_PdfImages', sum(`clientqaacceptfiles`) as 'Client_QA_AcceptedFiles', sum(`clientqaacceptimages`) as 'Client_QA_AcceptedImages', sum(`clientqarejectfiles`) as 'Client_QA_RejectedFiles', sum(`clientqarejectimages`) as 'Client_QA_RejectedImages', sum(`digisignfiles`) as 'Digi_SignFiles', sum(`digisignimages`) as 'Digi_SignImages' FROM scanned s WHERE locationname = ? GROUP BY locationid,locationname;",
      [locationName] // Pass locationName as parameter
    );

    res.json(rows);
  } catch (error) {
    console.error("Error fetching summary location data:", error);
    res.status(500).json({ error: "Error fetching summary location data" });
  }
});

app.get("/summary", async (req, res) => {
  let locationName = req.query.locationName;
  let startDate = req.query.startDate;
  let endDate = req.query.endDate;
  let fileType=req.query.fileType


  if (!locationName || (Array.isArray(locationName) && locationName.length === 0)) {
    locationName = null;
  } else {
    if (!Array.isArray(locationName)) {
      locationName = [locationName];
    }
  }


  let whereClause = "";


  if (locationName) {
    whereClause = `WHERE locationname IN ('${locationName.join("','")}')`;
  }

  if (fileType) {
    if (whereClause) {
      whereClause += ` AND filetype = '${fileType}'`;
    } else {
      whereClause = `WHERE filetype = '${fileType}'`;
    }
  }



  let dateFilter = "";
  if (startDate && endDate) {
    dateFilter = `AND inventorydate BETWEEN '${startDate}' AND '${endDate}'`;
  }


  const query = `
    SELECT Count(distinct locationid) as TotalLocation, 
    SUM(CASE WHEN 1=1 ${dateFilter} THEN inventoryfiles ELSE 0 END) AS 'CollectionFiles',
    SUM(CASE WHEN 1=1 ${dateFilter} THEN inventoryimages ELSE 0 END) AS 'CollectionImages',
    SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "scandate")} THEN scanfiles ELSE 0 END) AS 'ScannedFiles',
    SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "scandate")} THEN scanimages ELSE 0 END) AS 'ScannedImages',
    SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "qcdate")} THEN qcfiles ELSE 0 END) AS 'QCFiles',
    SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "qcdate")} THEN qcimages ELSE 0 END) AS 'QCImages',
    SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "flaggingdate")} THEN flaggingfiles ELSE 0 END) AS 'FlaggingFiles',
    SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "flaggingdate")} THEN flaggingimages ELSE 0 END) AS 'FlaggingImages',
    SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "indexdate")} THEN indexfiles ELSE 0 END) AS 'IndexingFiles',
    SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "indexdate")} THEN indeximages ELSE 0 END) AS 'IndexingImages',
    SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "cbslqadate")} THEN cbslqafiles ELSE 0 END) AS 'CBSL_QAFiles',
    SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "cbslqadate")} THEN cbslqaimages ELSE 0 END) AS 'CBSL_QAImages',
    SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "exportdate")} THEN exportpdffiles ELSE 0 END) AS 'Export_PdfFiles',
    SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "exportdate")} THEN exportpdfimages ELSE 0 END) AS 'Export_PdfImages',
    SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "clientqaacceptdate")} THEN clientqaacceptfiles ELSE 0 END) AS 'Client_QA_AcceptedFiles',
    SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "clientqaacceptdate")} THEN clientqaacceptimages ELSE 0 END) AS 'Client_QA_AcceptedImages',
    SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "clientqarejectdate")} THEN clientqarejectfiles ELSE 0 END) AS 'Client_QA_RejectedFiles',
    SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "clientqarejectdate")} THEN clientqarejectimages ELSE 0 END) AS 'Client_QA_RejectedImages',
    SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "digisigndate")} THEN digisignfiles ELSE 0 END) AS 'Digi_SignFiles',
    SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "digisigndate")} THEN digisignimages ELSE 0 END) AS 'Digi_SignImages'
    FROM scanned
    ${whereClause}
  ;`;


  try {
    const [results] = await promisePool.query(query);
    res.json(results);
  } catch (err) {
    console.error("Error fetching summary data:", err);
    res.status(500).json({ error: "Error fetching summary data" });
  }
});
 
app.get("/reportTable", async (req, res) => {
  let locationName = req.query.locationName;
  let startDate = req.query.startDate;
  let endDate = req.query.endDate;
  let fileType=req.query.fileType


  if (!locationName || (Array.isArray(locationName) && locationName.length === 0)) {
    locationName = null;
  } else {
    if (!Array.isArray(locationName)) {
      locationName = [locationName];
    }
  }


  let whereClause = "";


  if (locationName) {
    whereClause = `WHERE locationname IN ('${locationName.join("','")}')`;
  }

  if (fileType) {
    if (whereClause) {
      whereClause += ` AND filetype = '${fileType}'`;
    } else {
      whereClause = `WHERE filetype = '${fileType}'`;
    }
  }

  let dateFilter = "";
  if (startDate && endDate) {
    dateFilter = `AND inventorydate BETWEEN '${startDate}' AND '${endDate}'`;
  }


  const query = `
    SELECT locationid, locationname as 'LocationName', 
      SUM(CASE WHEN 1=1 ${dateFilter} THEN inventoryfiles ELSE 0 END) AS 'CollectionFiles',
      SUM(CASE WHEN 1=1 ${dateFilter} THEN inventoryimages ELSE 0 END) AS 'CollectionImages',
      SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "scandate")} THEN scanfiles ELSE 0 END) AS 'ScannedFiles',
      SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "scandate")} THEN scanimages ELSE 0 END) AS 'ScannedImages',
      SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "qcdate")} THEN qcfiles ELSE 0 END) AS 'QCFiles',
      SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "qcdate")} THEN qcimages ELSE 0 END) AS 'QCImages',
      SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "flaggingdate")} THEN flaggingfiles ELSE 0 END) AS 'FlaggingFiles',
      SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "flaggingdate")} THEN flaggingimages ELSE 0 END) AS 'FlaggingImages',
      SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "indexdate")} THEN indexfiles ELSE 0 END) AS 'IndexingFiles',
      SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "indexdate")} THEN indeximages ELSE 0 END) AS 'IndexingImages',
      SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "cbslqadate")} THEN cbslqafiles ELSE 0 END) AS 'CBSL_QAFiles',
      SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "cbslqadate")} THEN cbslqaimages ELSE 0 END) AS 'CBSL_QAImages',
      SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "exportdate")} THEN exportpdffiles ELSE 0 END) AS 'Export_PdfFiles',
      SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "exportdate")} THEN exportpdfimages ELSE 0 END) AS 'Export_PdfImages',
      SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "clientqaacceptdate")} THEN clientqaacceptfiles ELSE 0 END) AS 'Client_QA_AcceptedFiles',
      SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "clientqaacceptdate")} THEN clientqaacceptimages ELSE 0 END) AS 'Client_QA_AcceptedImages',
      SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "clientqarejectdate")} THEN clientqarejectfiles ELSE 0 END) AS 'Client_QA_RejectedFiles',
      SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "clientqarejectdate")} THEN clientqarejectimages ELSE 0 END) AS 'Client_QA_RejectedImages',
      SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "digisigndate")} THEN digisignfiles ELSE 0 END) AS 'Digi_SignFiles',
      SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "digisigndate")} THEN digisignimages ELSE 0 END) AS 'Digi_SignImages'
    FROM scanned
    ${whereClause}
    GROUP BY locationname, locationid
  ;`;


  try {
    const [results] = await promisePool.query(query);
    res.json(results);
  } catch (err) {
    console.error("Error fetching summary data:", err);
    res.status(500).json({ error: "Error fetching summary data" });
  }
});

app.get("/summarycsv", async (req, res, next) => {
  let locationNames = req.query.locationName;
  let startDate = req.query.startDate;
  let endDate = req.query.endDate;
  let fileType=req.query.fileType;


  if (!locationNames || (Array.isArray(locationNames) && locationNames.length === 0)) {
    locationNames = null;
  } else {
    if (!Array.isArray(locationNames)) {
      locationNames = [locationNames];
    }
  }


  let whereClause = "";
  if (locationNames) {
    whereClause = `WHERE locationname IN ('${locationNames.join("','")}')`;
  }
 
  if (fileType) {
    if (whereClause) {
      whereClause += ` AND filetype = '${fileType}'`;
    } else {
      whereClause = `WHERE filetype = '${fileType}'`;
    }
  }


  let dateFilter = "";
  if (startDate && endDate) {
    dateFilter = `AND inventorydate BETWEEN '${startDate}' AND '${endDate}'`;
  }


  const getCsv = `
  SELECT 
    COALESCE(Count(distinct locationid), 0) as TotalLocation, 
    COALESCE(SUM(CASE WHEN 1=1 ${dateFilter} THEN inventoryfiles ELSE 0 END), 0) AS 'CollectionFiles',
    COALESCE(SUM(CASE WHEN 1=1 ${dateFilter} THEN inventoryimages ELSE 0 END), 0) AS 'CollectionImages',
    COALESCE(SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "scandate")} THEN scanfiles ELSE 0 END), 0) AS 'ScannedFiles',
    COALESCE(SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "scandate")} THEN scanimages ELSE 0 END), 0) AS 'ScannedImages',
    COALESCE(SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "qcdate")} THEN qcfiles ELSE 0 END), 0) AS 'QCFiles',
    COALESCE(SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "qcdate")} THEN qcimages ELSE 0 END), 0) AS 'QCImages',
    COALESCE(SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "flaggingdate")} THEN flaggingfiles ELSE 0 END), 0) AS 'FlaggingFiles',
    COALESCE(SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "flaggingdate")} THEN flaggingimages ELSE 0 END), 0) AS 'FlaggingImages',
    COALESCE(SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "indexdate")} THEN indexfiles ELSE 0 END), 0) AS 'IndexingFiles',
    COALESCE(SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "indexdate")} THEN indeximages ELSE 0 END), 0) AS 'IndexingImages',
    COALESCE(SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "cbslqadate")} THEN cbslqafiles ELSE 0 END), 0) AS 'CBSL_QAFiles',
    COALESCE(SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "cbslqadate")} THEN cbslqaimages ELSE 0 END), 0) AS 'CBSL_QAImages',
    COALESCE(SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "exportdate")} THEN exportpdffiles ELSE 0 END), 0) AS 'Export_PdfFiles',
    COALESCE(SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "exportdate")} THEN exportpdfimages ELSE 0 END), 0) AS 'Export_PdfImages',
    COALESCE(SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "clientqaacceptdate")} THEN clientqaacceptfiles ELSE 0 END), 0) AS 'Client_QA_AcceptedFiles',
    COALESCE(SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "clientqaacceptdate")} THEN clientqaacceptimages ELSE 0 END), 0) AS 'Client_QA_AcceptedImages',
    COALESCE(SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "clientqarejectdate")} THEN clientqarejectfiles ELSE 0 END), 0) AS 'Client_QA_RejectedFiles',
    COALESCE(SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "clientqarejectdate")} THEN clientqarejectimages ELSE 0 END), 0) AS 'Client_QA_RejectedImages',
    COALESCE(SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "digisigndate")} THEN digisignfiles ELSE 0 END), 0) AS 'Digi_SignFiles',
    COALESCE(SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "digisigndate")} THEN digisignimages ELSE 0 END), 0) AS 'Digi_SignImages'
  FROM scanned
  ${whereClause}
;`;

  try {
    const [result] = await promisePool.query(getCsv);
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
  } catch (error) {
    console.error("Error occurred when exporting CSV:", error);
    res.status(500).json({ error: "An error occurred while exporting the CSV file" });
  }
});

app.get("/reporttablecsv",async(req, res, next) => {
  let locationNames = req.query.locationName;
  let startDate = req.query.startDate;
  let endDate = req.query.endDate;
  let fileType=req.query.fileType;

  if (!locationNames || (Array.isArray(locationNames) && locationNames.length === 0)) {
    locationNames = null;
  } else {
    if (!Array.isArray(locationNames)) {
      locationNames = [locationNames];
    }
  }
  let whereClause = "";
  if (locationNames) {
    whereClause = `WHERE locationname IN ('${locationNames.join("','")}')`;
  }

  if (fileType) {
    if (whereClause) {
      whereClause += ` AND filetype = '${fileType}'`;
    } else {
      whereClause = `WHERE filetype = '${fileType}'`;
    }
  }


  let dateFilter = "";
      if (startDate && endDate) {
        dateFilter = `AND inventorydate BETWEEN '${startDate}' AND '${endDate}'`;
      }
    
      const getCsv = `
      SELECT 
        locationid, 
        locationname as 'LocationName', 
        COALESCE(SUM(CASE WHEN 1=1 ${dateFilter} THEN inventoryfiles ELSE 0 END), 0) AS 'CollectionFiles',
        COALESCE(SUM(CASE WHEN 1=1 ${dateFilter} THEN inventoryimages ELSE 0 END), 0) AS 'CollectionImages',
        COALESCE(SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "scandate")} THEN scanfiles ELSE 0 END), 0) AS 'ScannedFiles',
        COALESCE(SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "scandate")} THEN scanimages ELSE 0 END), 0) AS 'ScannedImages',
        COALESCE(SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "qcdate")} THEN qcfiles ELSE 0 END), 0) AS 'QCFiles',
        COALESCE(SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "qcdate")} THEN qcimages ELSE 0 END), 0) AS 'QCImages',
        COALESCE(SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "flaggingdate")} THEN flaggingfiles ELSE 0 END), 0) AS 'FlaggingFiles',
        COALESCE(SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "flaggingdate")} THEN flaggingimages ELSE 0 END), 0) AS 'FlaggingImages',
        COALESCE(SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "indexdate")} THEN indexfiles ELSE 0 END), 0) AS 'IndexingFiles',
        COALESCE(SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "indexdate")} THEN indeximages ELSE 0 END), 0) AS 'IndexingImages',
        COALESCE(SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "cbslqadate")} THEN cbslqafiles ELSE 0 END), 0) AS 'CBSL_QAFiles',
        COALESCE(SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "cbslqadate")} THEN cbslqaimages ELSE 0 END), 0) AS 'CBSL_QAImages',
        COALESCE(SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "exportdate")} THEN exportpdffiles ELSE 0 END), 0) AS 'Export_PdfFiles',
        COALESCE(SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "exportdate")} THEN exportpdfimages ELSE 0 END), 0) AS 'Export_PdfImages',
        COALESCE(SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "clientqaacceptdate")} THEN clientqaacceptfiles ELSE 0 END), 0) AS 'Client_QA_AcceptedFiles',
        COALESCE(SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "clientqaacceptdate")} THEN clientqaacceptimages ELSE 0 END), 0) AS 'Client_QA_AcceptedImages',
        COALESCE(SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "clientqarejectdate")} THEN clientqarejectfiles ELSE 0 END), 0) AS 'Client_QA_RejectedFiles',
        COALESCE(SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "clientqarejectdate")} THEN clientqarejectimages ELSE 0 END), 0) AS 'Client_QA_RejectedImages',
        COALESCE(SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "digisigndate")} THEN digisignfiles ELSE 0 END), 0) AS 'Digi_SignFiles',
        COALESCE(SUM(CASE WHEN 1=1 ${dateFilter.replace(/inventorydate/g, "digisigndate")} THEN digisignimages ELSE 0 END), 0) AS 'Digi_SignImages'
      FROM scanned
      ${whereClause}
      GROUP BY locationname, locationid
    ;`;


      try {
        const [result, fields] = await promisePool.query(getCsv);
        
        if (result.length === 0) {
          res.status(404).json({ error: "No data found for the provided parameters" });
          return;
        }
    
    const data = result;
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
    data.forEach((row, index) => {
      res.write(
        (index + 1) + "," +
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
  } catch (error) {
    console.error("Error occurred when exporting CSV:", error);
    res.status(500).json({ error: "An error occurred while exporting the CSV file" });
  }
});


app.get('/locations', async (req, res) => {
try {
    const [rows, fields] = await promisePool.query(`SELECT LocationID, LocationName from locationmaster;`);
    res.json(rows);
  } catch (error) {
    console.error('Database query failed:', error);
    res.status(500).send('Internal Server Error');
  }
});

  app.get('/usermaster', async (req, res) => {
try {
    const [rows, fields] = await promisePool.query(`SELECT user_id, first_name,last_name,designation FROM tbl_user_master where designation in ('project manager', 'site manager', 'site incharge','project head');`);
    res.json(rows);
  } catch (error) {
    console.error('Database query failed:', error);
    res.status(500).send('Internal Server Error');
  }
});
  
 app.get("/designations", async (req, res) => {
try {
    const [rows, fields] = await promisePool.query(`SELECT * FROM tbl_designation_master;`);
    res.json(rows);
  } catch (error) {
    console.error('Database query failed:', error);
    res.status(500).send('Internal Server Error');
  }
});


app.get('/graph5', async (req, res) => {
  const { locationNames } = req.query;
  let query = "SELECT DATE_FORMAT(scandate, '%Y-%m-%d') as scandate, SUM(scanfiles) as scannedfiles FROM scanned s WHERE scandate >= DATE_SUB(NOW(), INTERVAL 1 WEEK) AND scandate <= NOW()";

  if (locationNames && locationNames.length > 0) {
    query += " AND locationname IN (?)";
  }

  query += " GROUP BY DATE_FORMAT(scandate, '%Y-%m-%d');";

  try {
    const [results] = await promisePool.query(query, [locationNames]);
    res.json(results);
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/graph6', async (req, res) => {
  const { locationNames } = req.query;
  let query = "SELECT DATE_FORMAT(scandate, '%Y-%m-%d') as scandate, SUM(scanimages) as scannedimages FROM scanned s WHERE scandate >= DATE_SUB(NOW(), INTERVAL 1 WEEK) AND scandate <= NOW()";

  if (locationNames && locationNames.length > 0) {
    query += " AND locationname IN (?)";
  }

  query += " GROUP BY DATE_FORMAT(scandate, '%Y-%m-%d');";

  try {
    const [results] = await promisePool.query(query, [locationNames]);
    res.json(results);
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/graphmonth', async (req, res) => {
  const { locationNames } = req.query;
  let query = "SELECT DATE_FORMAT(scandate,'%Y-%m-%d') AS 'scandate',SUM(scanimages) AS 'Scanned No Of Images' FROM scanned s WHERE scandate BETWEEN CURDATE() - INTERVAL 30 DAY AND CURDATE() ";

  if (locationNames && locationNames.length > 0) {
    query += " AND locationname IN (?)";
  }

  query += " GROUP BY DATE_FORMAT(scandate, '%Y-%m-%d')  ORDER BY scandate ASC;";

  try {
    const [results] = await promisePool.query(query, [locationNames]);
    res.json(results);
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/reportLocationWiseTable', async (req, res) => {
  const locationName = req.query.locationname;
  const { startDate, endDate } = req.query;

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

  if (startDate && endDate) {
    query += " AND (receiveddate BETWEEN ? AND ? OR inventorydate BETWEEN ? AND ? OR scandate BETWEEN ? AND ? OR qcdate BETWEEN ? AND ? OR flaggingdate BETWEEN ? AND ? OR indexdate BETWEEN ? AND ? OR cbslqadate BETWEEN ? AND ? OR exportdate BETWEEN ? AND ? OR clientqaacceptdate BETWEEN ? AND ? OR clientqarejectdate BETWEEN ? AND ? OR digisigndate BETWEEN ? AND ? OR invOutDate BETWEEN ? AND ? OR reScanDate BETWEEN ? AND ? )";
  }

  query += " GROUP BY LocationName;";

  try {
    const [results] = await promisePool.query(query, [locationName, startDate, endDate]);
    res.json(results);
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/graph1LocationWise', async (req, res) => {
  const locationNames = req.query.locationname; // Retrieve location names from query parameter

  let query = `
    SELECT 
	sum(inventoryfiles) as 'Received',
 	sum(scanfiles) as 'Scanned',
	sum(cbslqafiles) as 'CBSL QA',
	sum(clientqaacceptfiles) as 'Client QA',
	sum(cbslqafiles)-sum(clientqaacceptfiles) as 'Client QA Pending',
    	sum(exportpdffiles) as 'Export PDF' 
    FROM scanned
  `;

  if (locationNames && locationNames.length > 0) {
    query += ` WHERE locationname IN (?)`;
  }

 try {
    const [results] = await promisePool.query(query, [locationNames]);
    res.json(results);
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/graph2', async (req, res) => {
  const locationNames = req.query.locationname; // Retrieve location name from query parameter

  let query = `
  SELECT 
	sum(inventoryimages) as 'Received',
 	sum(scanimages) as 'Scanned',
        sum(cbslqaimages) as 'CBSL QA', 
	sum(clientqaacceptimages) as 'Client QA', 
 	sum(cbslqaimages)-sum(clientqaacceptimages) as 'Client QA Pending', 
  	sum(exportpdfimages) as 'Export PDF'  
  from scanned
  `;

  if (locationNames && locationNames.length > 0) {
    query += ` WHERE locationname IN (?)`;
  }

  try {
    const [results] = await promisePool.query(query, [locationNames]);
    res.json(results);
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/civil', async(req, res) => {
  const locationNames = req.query.locationname; // Retrieve location names from query parameter

  let query = "SELECT sum(scanfiles) as 'Civil Files', sum(scanimages) as 'Civil Images' FROM `scanned` WHERE casetypename NOT LIKE '%Criminal%'";

  if (locationNames && locationNames.length > 0) {
    query += " AND locationname IN (?)";
  }

  try {
    const [results] = await promisePool.query(query, [locationNames]);
    res.json(results);
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/criminal', async (req, res) => {
  const locationNames = req.query.locationname; // Retrieve location names from query parameter

  let query = "SELECT  sum(scanfiles) as 'Criminal Files' , sum(scanimages) as 'Criminal Images' FROM `scanned` WHERE  casetypename Like '%Criminal%'";

  if (locationNames && locationNames.length > 0) {
    // If locationNames is an array, use parameterized query
    query += " AND locationname IN (?)";
  }

  try {
    const [results] = await promisePool.query(query, [locationNames]);
    res.json(results);
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/graph7', async(req, res) => {
  const locationNames = req.query.locationname; // Retrieve location names from query parameter

  let query = "SELECT " +
    "SUM(inventoryfiles) AS `Received`, " +
    "SUM(scanfiles) AS `Scanned`, " +
    "SUM(cbslqafiles) AS `CBSL QA`, " +
    "SUM(clientqaacceptfiles) AS `Client QA`, " +
    "SUM(cbslqafiles) - SUM(clientqaacceptfiles) AS `Client QA Pending`, " +
    "SUM(exportpdffiles) AS `Export PDF` " +
    "FROM scanned " +
    "WHERE DATE(inventorydate) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) " +
    "OR DATE(scandate) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) " +
    "OR DATE(cbslqadate) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) " +
    "OR DATE(clientqaacceptdate) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) " +
    "OR DATE(exportdate) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)";

  if (locationNames && locationNames.length > 0) {
    query += ` AND locationname IN (?)`;
  }

  try {
    const [results] = await promisePool.query(query, [locationNames]);
    res.json(results);
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/graph8', async (req, res) => {
  const locationNames = req.query.locationname; // Retrieve location names from query parameter

   let query = "SELECT " +
    "SUM(inventoryimages) AS `Received`, " +
    "SUM(scanimages) AS `Scanned`, " +
    "SUM(cbslqaimages) AS `CBSL QA`, " +
    "SUM(clientqaacceptimages) AS `Client QA`, " +
    "SUM(cbslqaimages) - SUM(clientqaacceptimages) AS `Client QA Pending`, " +
    "SUM(exportpdfimages) AS `Export PDF` " +
    "FROM scanned " +
    "WHERE DATE(inventorydate) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) " +
    "OR DATE(scandate) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) " +
    "OR DATE(cbslqadate) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) " +
    "OR DATE(clientqaacceptdate) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) " +
    "OR DATE(exportdate) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)";

  if (locationNames && locationNames.length > 0) {
    query += ` AND locationname IN (?)`;
  }

 try {
    const [results] = await promisePool.query(query, [locationNames]);
    res.json(results);
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/graph9', async (req, res) => {
  const locationNames = req.query.locationname; // Retrieve location names from query parameter

  let query = "SELECT locationname AS 'Location Name', sum(scanimages) AS 'Images' FROM scanned WHERE scandate = CURDATE() - INTERVAL 1 DAY";

  if (locationNames && locationNames.length > 0) {
    query += ` AND locationname IN (?)`;
  }

  query += " GROUP BY locationid,locationname";

  try {
    const [results] = await promisePool.query(query, [locationNames]);
    res.json(results);
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/graph10', async (req, res) => {
  const locationNames = req.query.locationname; // Retrieve location names from query parameter

  let query = "SELECT locationname AS 'Location Name', sum(scanimages) AS 'Images' FROM scanned";

  if (locationNames && locationNames.length > 0) {
    query += ` WHERE locationname IN (?)`;
  }

  query += " GROUP BY locationid,locationname";

  try {
    const [results] = await promisePool.query(query, [locationNames]);
    res.json(results);
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.get('/graph2', (req, res) => {
  mysql22.query("SELECT sum(exportpdfimages) as 'Export PDF' , sum(cbslqaimages)-sum(clientqaacceptimages) as 'Client QA Pending', sum(clientqaacceptimages) as 'Client QA',  sum(cbslqaimages) as 'CBSL QA', sum(scanimages) as 'Scanned', sum(inventoryimages) as 'Received'  from scanned;", (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

app.get('/graph9', (req, res) => {
  mysql22.query("SELECT locationname 'Location Name',sum(`scanimages`) as 'Images' FROM scanned where scandate= CURDATE()- INTERVAL 1 DAY group by locationname;", (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

app.get('/graph10', (req, res) => {
  mysql22.query("SELECT locationname 'Location Name',sum(`scanimages`) as 'Images' FROM scanned group by locationname;", (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

app.use("/searchlocation", (req, res, next) => {
  let data =
    "SELECT locationid,locationname as 'LocationName',sum(`inventoryfiles`) as 'CollectionFiles',sum(`inventoryimages`) as 'CollectionImages',sum(`scanfiles`) as 'ScannedFiles',sum(`scanimages`) as 'ScannedImages',sum(`qcfiles`) as 'QCFiles',sum(`qcimages`) as 'QCImages',sum(`flaggingfiles`)  as 'FlaggingFiles',sum(`flaggingimages`)  as 'FlaggingImages',sum(`indexfiles`) as 'IndexingFiles',sum(`indeximages`) as 'IndexingImages',sum(`cbslqafiles`)  as 'CBSL_QAFiles',sum(`cbslqaimages`) as 'CBSL_QAImages',sum(`exportpdffiles`)  as 'Export_PdfFiles', sum(`exportpdfimages`)  as 'Export_PdfImages',sum(`clientqaacceptfiles`)  as 'Client_QA_AcceptedFiles', sum(`clientqaacceptimages`)  as 'Client QA AcceptedImages',sum(`clientqarejectfiles`)  as 'Client_QA_RejectedFiles',sum(`clientqarejectimages`)  as 'Client_QA_RejectedImages',sum(`digisignfiles`)  as 'Digi_SignFiles',sum(`digisignimages`)  as 'Digi_SignImages' FROM scanned  group by locationname;";
  mysql22.query(data, (error, results, fields) => {
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

app.get("/csv", async (req, res, next) => {
  try {
    let locationNames = req.query.locationName;

    if (!locationNames || (Array.isArray(locationNames) && locationNames.length === 0)) {
      locationNames = null;
    } else if (!Array.isArray(locationNames)) {
      locationNames = [locationNames];
    }

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

    const [result] = await promisePool.query(getCsv);

    if (!result || result.length === 0) {
      res.status(404).json({ error: "No data found for the provided parameters" });
      return;
    }

    const formattedPreviousDate = formatDate(new Date(Date.now() - 86400000)); // Previous date
    const formattedYesterdayDate = formatDate(new Date(Date.now() - 2 * 86400000)); // Yesterday date
    const formattedCurrentDate = formatDate(new Date()); // Current date

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment;filename=AllLocationScanReport.csv");
    res.write(`Sr No.,Location Name,Scanned (${formattedYesterdayDate}),Scanned (${formattedYesterdayDate}),Scanned (${formattedPreviousDate}),Scanned (${formattedPreviousDate}),Scanned (${formattedCurrentDate}),Scanned (${formattedCurrentDate}),Cumulative till date,Cumulative till date,Remarks\n`);
    res.write(`,  ,Files,Images,Files,Images,Files,Images,Files,Images\n`);

    result.forEach((row, index) => {
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
  } catch (error) {
    console.error("Error occurred when exporting csv:", error);
    res.status(500).json({ error: "An error occurred while exporting the CSV file" });
  }
});


// Custom tabular data
app.get('/customTabularData', async (req, res) => {
  try {
    const locationName = req.query.locationname;

    let query = `
      SELECT tt.LocationName AS 'LocationName',
             tt.ScannedNoOfFilesTotal AS 'Total_Files',
             tt.ScannedNoOfImagesTotal AS 'Total_Images',
             td.ScannedNoOfFilesToday AS 'Today_Files',
             td.ScannedNoOfImagesToday AS 'Today_Images',
             tdyes.ScannedNoOfFilesYes AS 'Yes_Files',
             tdyes.ScannedNoOfImagesYes AS 'Yes_Images',
             tdprev.ScannedNoOfFilesPrev AS 'Prev_Files',
             tdprev.ScannedNoOfImagesPrev AS 'Prev_Images'
      FROM (SELECT s.locationname AS 'LocationName',
                   SUM(s.scanfiles) AS 'ScannedNoOfFilesTotal',
                   SUM(s.scanimages) AS 'ScannedNoOfImagesTotal'
            FROM scanned s`;

    if (locationName) {
      query += ` WHERE s.locationname = '${locationName}'`;
    }

    query += ` GROUP BY s.locationname) tt
      LEFT JOIN (SELECT s.locationname AS 'LocationName',
                        SUM(s.scanfiles) AS 'ScannedNoOfFilesYes',
                        SUM(s.scanimages) AS 'ScannedNoOfImagesYes'
                 FROM scanned s
                 WHERE s.scandate = CURDATE() - INTERVAL 1 DAY`;

    if (locationName) {
      query += ` AND s.locationname = '${locationName}'`;
    }

    query += ` GROUP BY s.locationname) tdyes
             ON tdyes.LocationName = tt.LocationName
      LEFT JOIN (SELECT s.locationname AS 'LocationName',
                        SUM(s.scanfiles) AS 'ScannedNoOfFilesPrev',
                        SUM(s.scanimages) AS 'ScannedNoOfImagesPrev'
                 FROM scanned s
                 WHERE s.scandate = CURDATE() - INTERVAL 2 DAY`;

    if (locationName) {
      query += ` AND s.locationname = '${locationName}'`;
    }

    query += ` GROUP BY s.locationname) tdprev
             ON tdprev.LocationName = tt.LocationName
      LEFT JOIN (SELECT s.locationname AS 'LocationName',
                        SUM(s.scanfiles) AS 'ScannedNoOfFilesToday',
                        SUM(s.scanimages) AS 'ScannedNoOfImagesToday'
                 FROM scanned s
                 WHERE s.scandate = CURDATE()`;

    if (locationName) {
      query += ` AND s.locationname = '${locationName}'`;
    }

    query += ` GROUP BY s.locationname) td
             ON td.LocationName = tt.LocationName
      ORDER BY tt.LocationName;
    ;`;

    const [results] = await promisePool.query(query);
    res.json(results);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Tabular data
app.get('/tabularData', async (req, res) => {
  try {
    const query = `
      SELECT tt.LocationName AS 'LocationName',
             tt.ScannedNoOfFilesTotal AS 'Total_Files',
             tt.ScannedNoOfImagesTotal AS 'Total_Images',
             td.ScannedNoOfFilesToday AS 'Today_Files',
             td.ScannedNoOfImagesToday AS 'Today_Images',
             tdyes.ScannedNoOfFilesYes AS 'Yes_Files',
             tdyes.ScannedNoOfImagesYes AS 'Yes_Images',
             tdprev.ScannedNoOfFilesPrev AS 'Prev_Files',
             tdprev.ScannedNoOfImagesPrev AS 'Prev_Images'
      FROM (SELECT s.locationname AS 'LocationName',
                   SUM(s.scanfiles) AS 'ScannedNoOfFilesTotal',
                   SUM(s.scanimages) AS 'ScannedNoOfImagesTotal'
            FROM scanned s
            GROUP BY s.locationname) tt
      LEFT JOIN (SELECT s.locationname AS 'LocationName',
                        SUM(s.scanfiles) AS 'ScannedNoOfFilesYes',
                        SUM(s.scanimages) AS 'ScannedNoOfImagesYes'
                 FROM scanned s
                 WHERE s.scandate = CURDATE() - INTERVAL 1 DAY
                 GROUP BY s.locationname) tdyes
             ON tdyes.LocationName = tt.LocationName
      LEFT JOIN (SELECT s.locationname AS 'LocationName',
                        SUM(s.scanfiles) AS 'ScannedNoOfFilesPrev',
                        SUM(s.scanimages) AS 'ScannedNoOfImagesPrev'
                 FROM scanned s
                 WHERE s.scandate = CURDATE() - INTERVAL 2 DAY
                 GROUP BY s.locationname) tdprev
             ON tdprev.LocationName = tt.LocationName
      LEFT JOIN (SELECT s.locationname AS 'LocationName',
                        SUM(s.scanfiles) AS 'ScannedNoOfFilesToday',
                        SUM(s.scanimages) AS 'ScannedNoOfImagesToday'
                 FROM scanned s
                 WHERE s.scandate = CURDATE()
                 GROUP BY s.locationname) td
             ON td.LocationName = tt.LocationName
      ORDER BY tt.LocationName;
    ;`;

    const [results] = await promisePool.query(query);
    res.json(results);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get('/api/uploadlog', async (req, res) => {
  try {
    const whereClause = req.query.whereClause || '';

    if (whereClause && !/^[a-zA-Z0-9_ ='"<> AND]+$/.test(whereClause)) {
      return res.status(400).send('Invalid where clause');
    }

    let query = `
      SELECT 
        l.locationname,
        MAX(CAST(t.filedate AS DATETIME)) AS filedate,
        MAX(CAST(t.upload_date AS DATETIME)) AS uploaddate,
        MAX(t.appVersion) AS appVersion
      FROM 
        tbl_upload_log t 
      INNER JOIN 
        locationmaster l 
      ON 
        l.locationcode = CAST(t.location_code AS UNSIGNED)
    `;

    if (whereClause) {
      query += ` WHERE ${whereClause}`;
    }

    query += `
      GROUP BY 
        l.locationname
      ORDER BY 
        MAX(t.upload_date) ASC;
    `;

    const [results] = await promisePool.query(query);

    // Convert dates to local time zone before sending the response
    const timeZone = 'Asia/Kolkata'; // Set to your desired time zone
    const formattedResults = results.map(result => ({
      locationname: result.locationname,
      filedate: result.filedate ? moment(result.filedate).tz(timeZone).format('YYYY-MM-DD') : null,
      uploaddate: result.uploaddate ? moment(result.uploaddate).tz(timeZone).format('YYYY-MM-DD HH:mm:ss') : null,
      appVersion: result.appVersion
    }));

    res.json(formattedResults);
  } catch (error) {
    console.error('Query error:', error.sqlMessage || error);
    res.status(500).send(`An error occurred while querying the database: ${error.sqlMessage || error}`);
  }
});

// Group master
app.get('/group_master', async (req, res) => {
  try {
    const query = "SELECT group_id, group_name FROM tbl_group_master ORDER BY group_name ASC;";
    const [results] = await promisePool.query(query);
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// Privilege
app.get("/privilege", async (req, res) => {
  try {
    const query = "SELECT role_id, user_role FROM tbl_user_roles ORDER BY user_role ASC;";
    const [results] = await promisePool.query(query);
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// Storage
app.get("/storage", async (req, res) => {
  try {
    const query = "SELECT * FROM tbl_storage_level";
    const [results] = await promisePool.query(query);
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// Reporting
app.get("/reporting", async (req, res) => {
  try {
    const query = "SELECT * FROM tbl_user_master WHERE user_id AND active_inactive_users='1' ORDER BY first_name, last_name ASC;";
    const [results] = await promisePool.query(query);
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/user_master', async (req, res) => {
  try {
    const [rows, fields] = await promisePool.query(`SELECT 
    u.*, 
    GROUP_CONCAT(r.user_role) AS user_roles
FROM 
    tbl_user_master u
LEFT JOIN 
    tbl_bridge_role_to_um br ON FIND_IN_SET(u.user_id, br.user_ids)
LEFT JOIN 
    tbl_user_roles r ON br.role_id = r.role_id
GROUP BY 
    u.user_id
ORDER BY 
    u.first_name, u.last_name ASC;

`);
    res.json(rows);
  } catch (error) {
    console.error('Database query failed:', error);
    res.status(500).send('Internal Server Error');
  }
});


app.get('/user_role', async(req, res) => {
try {
    const [rows, fields] = await promisePool.query(`select role_id,user_role from tbl_user_roles order by user_role asc;`);
    res.json(rows);
  } catch (error) {
    console.error('Database query failed:', error);
    res.status(500).send('Internal Server Error');
  }
});
 
app.get("/user/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    // Query to fetch user information
    const selectUserQuery = `
      SELECT 
        u.*, 
        l.LocationName AS location_name 
      FROM 
        tbl_user_master AS u 
      LEFT JOIN 
        locationmaster AS l ON u.locations = l.LocationID 
      WHERE 
        u.user_id = ?`;

    // Execute query to fetch user information
    const [userRows] = await promisePool.query(selectUserQuery, [userId]);

    // Check if user not found
    if (userRows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userRows[0];

    // Query to fetch roles and their IDs
    const selectRoleQuery = `
      SELECT 
        r.role_id, 
        r.user_role 
      FROM 
        tbl_bridge_role_to_um AS brtu 
      JOIN 
        tbl_user_roles AS r ON brtu.role_id = r.role_id 
      WHERE 
        brtu.user_ids LIKE ?`;

    // Execute query to fetch roles
    const [roleRows] = await promisePool.query(selectRoleQuery, [`%${userId}%`]);
    const roles = roleRows.map(row => ({ id: row.role_id, name: row.user_role }));

    // Query to fetch groups and their IDs
    const selectGroupQuery = `
      SELECT 
        g.group_id, 
        g.group_name 
      FROM 
        tbl_bridge_grp_to_um AS btgu 
      JOIN 
        tbl_group_master AS g ON btgu.group_id = g.group_id 
      WHERE 
        btgu.user_ids LIKE ?`;

    // Execute query to fetch groups
    const [groupRows] = await promisePool.query(selectGroupQuery, [`%${userId}%`]);
    const groups = groupRows.map(row => ({ id: row.group_id, name: row.group_name }));

    // Query to fetch storage levels and their IDs
    const selectStorageLevelQuery = `
      SELECT 
        s.sl_id, 
        s.sl_name 
      FROM 
        tbl_storagelevel_to_permission AS btsu 
      JOIN 
        tbl_storage_level AS s ON btsu.sl_id = s.sl_id 
      WHERE 
        btsu.user_id LIKE ?`;

    // Execute query to fetch storage levels
    const [storageLevelRows] = await promisePool.query(selectStorageLevelQuery, [`%${userId}%`]);
    const storageLevels = storageLevelRows.map(row => ({ id: row.sl_id, name: row.sl_name }));

    // Construct response object
    const responseData = {
      ...user,
      roles,
      groups,
      storageLevels
    };

    // Send response
    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error retrieving user information:", error);
    res.status(500).json({ error: "An error occurred while retrieving user information" });
  }
});


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
  mysql22.query(
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

function hashPasswordSHA1(password) {
  return crypto.createHash('sha1').update(password).digest('hex');
}

app.post("/createuser", async (req, res) => {
  try {
    const data = req.body;

    // // Generate salt for password hashing
    // const salt = await bcrypt.genSalt(10);

    // // Hash the password
    // const hashedPassword = await bcrypt.hash(data.password, salt);

    const hashedPassword = hashPasswordSHA1(data.password);
  data.password = hashedPassword;

    // Check if user with the same email already exists
    const [existingUserRows] = await promisePool.query("SELECT * FROM tbl_user_master WHERE user_email_id=?", [data.user_email_id]);
    if (existingUserRows.length > 0) {
      return res.status(500).json({ error: "User already exists" });
    }

    // Prepare data for insertion
    const currentDateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const locations = data.locations ? data.locations.join(', ') : '';

    // Insert user into tbl_user_master
    const insertUserQuery = "INSERT INTO tbl_user_master (user_email_id,first_name,middle_name,last_name,password,designation,phone_no,profile_picture,superior_name,superior_email,user_created_date,emp_id,last_pass_change,login_disabled_date,fpi_template, fpi_template_two,fpi_template_three,fpi_template_four,lang,locations,user_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    const [userInsertResult] = await promisePool.query(insertUserQuery, [data.user_email_id, data.first_name, data.middle_name, data.last_name, hashedPassword, data.designation, data.phone_no, data.profile_picture, data.superior_name, data.superior_email, currentDateTime, data.emp_id, data.last_pass_change, data.login_disabled_date, data.fpi_template, data.fpi_template_two, data.fpi_template_three, data.fpi_template_four, data.lang, locations, data.user_type]);

    const userId = userInsertResult.insertId;

    // Link user with storage permission
    const insertPermissionQuery = "INSERT INTO tbl_storagelevel_to_permission (user_id, sl_id) VALUES (?, ?)";
    await promisePool.query(insertPermissionQuery, [userId, data.sl_id]);

    // Insert user log into tbl_ezeefile_logs
    const insertLogQuery = "INSERT INTO tbl_ezeefile_logs (user_id, user_name, action_name, start_date, system_ip, remarks) VALUES (?, ?, ?, ?, ?, ?)";
    await promisePool.query(insertLogQuery, [userId, data.user_name, data.action_name, data.start_date, data.system_ip, data.remarks]);

    // Check if role exists
    const [roleRows] = await promisePool.query("SELECT * FROM tbl_bridge_role_to_um WHERE role_id = ?", [data.role_id]);
    const roleExists = roleRows.length > 0;

    // Update or insert user role
    if (roleExists) {
      await promisePool.query("UPDATE tbl_bridge_role_to_um SET user_ids = CONCAT(user_ids, ', ', ?) WHERE role_id = ?", [userId, data.role_id]);
    } else {
      await promisePool.query("INSERT INTO tbl_bridge_role_to_um (role_id, user_ids) VALUES (?, ?)", [data.role_id, userId]);
    }

    // Check if group exists
    const [groupRows] = await promisePool.query("SELECT * FROM tbl_bridge_grp_to_um WHERE group_id = ?", [data.group_id]);
    const groupExists = groupRows.length > 0;

    // Update or insert user group
    if (groupExists) {
      await promisePool.query("UPDATE tbl_bridge_grp_to_um SET user_ids = CONCAT(user_ids, ', ', ?), roleids = CONCAT(roleids, ', ', ?) WHERE group_id = ?", [userId, data.role_id, data.group_id]);
    } else {
      await promisePool.query("INSERT INTO tbl_bridge_grp_to_um (group_id, user_ids, roleids) VALUES (?, ?, ?)", [data.group_id, userId, data.role_id]);
    }

    // Send welcome email
    const mailData = {
      from: 'ezeefileadmin@cbslgroup.in',
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

      res.status(200).json({ message: "User added successfully", id: userId });
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "An error occurred while creating user" });
  }
});

app.post("/login", async (req, res) => {
  const { user_email_id, password } = req.body;

  try {
    // Query to select user
    const selectQuery = "SELECT * FROM tbl_user_master WHERE user_email_id=?";
    const [rows] = await promisePool.query(selectQuery, [user_email_id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = rows[0];
    const hashedPassword = userData.password;

    // Compare passwords
    const isPasswordMatch = await bcrypt.compare(password, hashedPassword);
    if (!isPasswordMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // Determine if it's first login or password reset
    const firstLogin = !userData.last_active_login;
    const passwordResetThreshold = new Date(); // Example: Define your threshold logic here

    let isChangePasswordRequired = false;

    if (firstLogin || (userData.last_pass_change && userData.last_pass_change < passwordResetThreshold)) {
      // Set flag to show password change popup
      isChangePasswordRequired = true;
    }

    // Update last_active_login
    const updateQuery = "UPDATE tbl_user_master SET last_active_login = NOW() WHERE user_email_id = ?";
    await promisePool.query(updateQuery, [user_email_id]);

    // Fetch user roles
    const selectRolesQuery = `
      SELECT DISTINCT u.*, r.user_role 
      FROM tbl_user_master u
      LEFT JOIN tbl_bridge_role_to_um br ON FIND_IN_SET(u.user_id, REPLACE(br.user_ids, ' ','')) > 0
      LEFT JOIN tbl_user_roles r ON br.role_id = r.role_id
      WHERE u.user_email_id = ?
    `;
    const [roleRows] = await promisePool.query(selectRolesQuery, [user_email_id]);

    if (roleRows.length === 0) {
      return res.status(404).json({ error: "User role not found" });
    }

    // Fetch user locations
    const selectLocationsQuery = `
      SELECT u.*, lm.LocationID, lm.LocationName
      FROM tbl_user_master u
      LEFT JOIN (
          SELECT DISTINCT LocationID, LocationName 
          FROM locationmaster
      ) lm ON u.locations = lm.LocationID AND u.locations <> ''
      WHERE u.user_email_id = ?
    `;
    const [locationRows] = await promisePool.query(selectLocationsQuery, [user_email_id]);

    const user_roles = roleRows.map(row => row.user_role);
    const locations = locationRows.map(row => ({ id: row.LocationID, name: row.LocationName }));

    // Prepare response
    const { user_id, first_name, last_active_login } = userData;
    return res.status(200).json({
      message: "Login successful",
      user_id,
      first_name,
      last_active_login,
      user_roles,
      locations,
      isChangePasswordRequired // Flag to indicate if password change popup should be shown
    });

  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ error: "An error occurred" });
  }
});

// Insert user info
app.post('/userinfo', (req, res) => {
  const { name, email, phone, password } = req.body;
  const query = "INSERT INTO userinfo (username, email, phone, password) VALUES (?, ?, ?, ?)";
  mysql22.query(query, [name, email, phone, password], (err, result) => {
    if (err) {
      console.error("Error inserting user:", err);
      return res.status(500).json({ error: "An error occurred while inserting user" });
    }
    res.status(200).json({ message: "User added successfully", id: result.insertId });
  });
});

// Insert group master info
app.post("/groupmasterinfo", (req, res) => {
  const { group_id, group_name } = req.body;
  const query = 'INSERT INTO tbl_group_master (group_id, group_name) VALUES (?, ?)';
  mysql22.query(query, [group_id, group_name], (err, result) => {
    if (err) {
      console.error("Error inserting group:", err);
      return res.status(500).json({ error: "An error occurred while inserting group" });
    }
    res.status(200).json({ message: "Group added successfully", id: result.insertId });
  });
});

// Insert user master info
app.post('/usermasterinfo', (req, res) => {
  const { Desig_ID, Desig_name } = req.body;
  const query = "INSERT INTO tbl_designation_master (Desig_ID, Desig_name) VALUES (?, ?)";
  mysql22.query(query, [Desig_ID, Desig_name], (err, result) => {
    if (err) {
      console.error("Error inserting designation:", err);
      return res.status(500).json({ error: 'An error occurred while inserting designation' });
    }
    res.status(200).json({ message: 'Designation added successfully', id: result.insertId });
  });
});

  // app.post('/site_MP', (req, res) => {
  //   const { PH_Id, PO_Id, PM_Id, PCo_Id, SM_Id, Coll_Index_MP, Barc_MP, Barc_TF, Barc_TI, Page_No_MP, Prepare_MP, Prepare_TF, Prepare_TI, Scan_MP, Cover_Page_MP, Cover_Page_TF, Rescan_MP, Image_QC_MP, Doc_MP, Index_MP, CBSL_QA_MP, Ready_Cust_QA_MP, Cust_QA_Done_MP, PDF_Export_MP, Refilling_Files_MP, Refilling_Files_TF, Refilling_Files_TI, Inventory_MP, Location_Id, } = req.body;
  //   const query = 'INSERT INTO tbl_site_mp (PH_Id,PO_Id, PM_Id, PCo_Id, SM_Id, Coll_Index_MP, Barc_MP, Barc_TF, Barc_TI, Page_No_MP, Prepare_MP, Prepare_TF, Prepare_TI, Scan_MP, Cover_Page_MP, Cover_Page_TF, Rescan_MP, Image_QC_MP, Doc_MP, Index_MP, CBSL_QA_MP, Ready_Cust_QA_MP, Cust_QA_Done_MP, PDF_Export_MP, Refilling_Files_MP, Refilling_Files_TF, Refilling_Files_TI, Inventory_MP, Location_ID) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
  //   mysql22.query(query, [PH_Id, PO_Id, PM_Id, PCo_Id, SM_Id, Coll_Index_MP, Barc_MP, Barc_TF, Barc_TI, Page_No_MP, Prepare_MP, Prepare_TF, Prepare_TI, Scan_MP, Cover_Page_MP, Cover_Page_TF, Rescan_MP, Image_QC_MP, Doc_MP, Index_MP, CBSL_QA_MP, Ready_Cust_QA_MP, Cust_QA_Done_MP, PDF_Export_MP, Refilling_Files_MP, Refilling_Files_TF, Refilling_Files_TI, Inventory_MP, Location_Id,], (err, result) => {
  //     if (err) {
  //       console.error("Error inserting user:", err);
  //       res.status(500).json({ error: 'An error occurred while inserting user' });
  //     } else {
  //       res.status(200).json({ message: 'ManPower added successfully', id: result.insertId });
  //     }
  //   });
  // });

 // Add group
app.post('/add-group', async (req, res) => {
  try {
    const { group_name } = req.body;
    const query = "INSERT INTO tbl_group_master (group_name) VALUES (?)";
    const [result] = await promisePool.query(query, [group_name]);
    console.log("Group name added successfully. Insert ID:", result.insertId);
    res.status(200).json({ message: "Group name added successfully", id: result.insertId });
  } catch (error) {
    console.error("Error inserting group name:", error);
    res.status(500).json({ error: "An error occurred while inserting group name" });
  }
});

// Add role
app.post('/add-role', async (req, res) => {
  try {
    const { user_role } = req.body;
    const query = "INSERT INTO tbl_user_roles(user_role) VALUES(?)";
    const [result] = await promisePool.query(query, [user_role]);
    res.status(200).json({ message: "Role name added successfully", id: result.insertId });
  } catch (error) {
    console.error("Error inserting role name:", error);
    res.status(500).json({ error: "An error occurred while inserting role name" });
  }
});


const query = promisify(pool.query).bind(pool);

app.post('/uploadSql', upload.single('file'), async (req, res) => {
  console.log('File upload request received');
  try {
    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).send('No file uploaded');
    }

    const zipFilePath = 'uploads/' + req.file.filename;
    const extractDir = 'uploads/' + req.file.filename.split('.').slice(0, -1).join('') + '/';
    fs.mkdirSync(extractDir);

    await new Promise((resolve, reject) => {
      fs.createReadStream(zipFilePath)
        .pipe(unzipper.Extract({ path: extractDir }))
        .on('close', resolve)
        .on('error', reject);
    });

    const files = await fs.promises.readdir(extractDir);

    const sqlFile = files.find(file => file.endsWith('.sql'));
    const csvFile = files.find(file => /^\d{4}-\d{2}-\d{2}_CSVData\.csv$/.test(file));

    if (!sqlFile) {
      return res.status(500).send('No SQL file found in the extracted files');
    }

    const sqlFilePath = extractDir + sqlFile;
    let sqlContent = await fs.promises.readFile(sqlFilePath, 'utf-8');
    sqlContent = sqlContent.replace(/\\N/g, 'NULL');
    const rows = sqlContent.split('\n').filter(row => row.trim() !== '');

    const deleteSql = `DELETE FROM scanned WHERE locationid = ?`;
    const insertSql = `INSERT INTO scanned (
      locationid, locationname, lotno, filetype, casenature, casetypename, casetypecode, 
      receivedfrom, receiveddate, inventorydate, inventoryuser, inventoryfiles, inventoryimages, 
      scandate, scanuser, scanfiles, scanimages, qcdate, qcuser, qcfiles, qcimages, 
      flaggingdate, flagginguser, flaggingfiles, flaggingimages, indexdate, indexuser, indexfiles, indeximages, 
      cbslqadate, cbslqauser, cbslqafiles, cbslqaimages, exportdate, exportpdfuser, exportpdffiles, exportpdfimages, 
      clientqaacceptdate, clientqaacceptuser, clientqaacceptfiles, clientqaacceptimages, clientqarejectdate, clientqarejectuser, clientqarejectfiles, clientqarejectimages, 
      digisigndate, digisignuser, digisignfiles, digisignimages, 
      invOutDate, invOutuser, invOutFiles, invOutImages, reScanDate, reScanUser, reScanFiles, reScanImages
    ) 
    VALUES (
      ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
    )`;

    let successfulInserts = 0;
    let failedInserts = 0;

    const connection = await promisePool.getConnection();
    await connection.beginTransaction();

    try {
      const firstRow = rows[0];
      const firstValues = firstRow.split('\t').map(val => val.trim() === 'NULL' ? null : val.trim());
      const locationId = firstValues[0];

      // Delete existing rows for the locationId before starting the insert operations
      await connection.query(deleteSql, [locationId]);
      console.log(`Deleted existing rows for locationid: ${locationId}`);

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const values = row.split('\t').map(val => val.trim() === 'NULL' ? null : val.trim());

        try {
          console.log(`Processing row ${i + 1}/${rows.length}: ${values}`);

          await connection.query(insertSql, values);

          successfulInserts++;
        } catch (err) {
          console.error(`Error processing row ${i + 1}:`, err);
          failedInserts++;
        }
      }

      await connection.commit();
    } catch (err) {
      await connection.rollback();
      console.error('Transaction failed, changes rolled back:', err);
      return res.status(500).send('Error processing SQL rows');
    } finally {
      connection.release();
    }

    console.log(`Insert process completed: ${successfulInserts} rows successfully inserted, ${failedInserts} rows failed.`);

    const fileDate = req.file.filename.slice(4, 8) + req.file.filename.slice(2, 4) + req.file.filename.slice(0, 2);
    const locationCode = extractLocationCode(extractDir); // You need to implement extractLocationCode
    const currentDateTime = moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
    const appVersion = readAppVersion(extractDir); // You need to implement readAppVersion

    if (csvFile) {
      const csvFilePath = extractDir + csvFile;

      await new Promise((resolve, reject) => {
        fs.createReadStream(csvFilePath)
          .pipe(csv())
          .on('data', async (data) => {
            const values = [
              data.backuppath, data.backupsize, data.backupTime, data.ErrorLogs, data.dbconnection, data.cpuStatus, 
              data.totalRam, data.freeRam, data.ip, locationCode, currentDateTime, data.location, data.nasPath, 
              data.systemLogs, data.innoDBStatus, data.max_con, data.bind_add, data.datadir, data.general_log, 
              data.slowQuery, data.ftpFilePath, data.ftpFileSizeInGB, data.FTPBackupCreateTime, filesystems, 
              sizes, data.used, data.avail, data.use_percentage, data.mounted_on, data.latencyFromNAS
            ];

            if (values.length === 30) {
              const csvInsertSql = `INSERT INTO tbl_server_status (
                backuppath, backupsize, backuptime, errorlogs, dbconnection, cpustatus, totalram, freeram, ip, 
                locationcode, importtime, location, nasPath, systemLogs, innoDBStatus, max_con, bind_add, datadir, 
                general_log, slowQuery, ftpFilePath, ftpFileSizeInGB, FTPBackupCreateTime, filesystems, sizes, used, 
                avail, use_percentage, mounted_on, latencyFromNAS
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

              try {
                await promisePool.query(csvInsertSql, values);
              } catch (insertErr) {
                console.error('Error inserting data into tbl_server_status:', insertErr);
              }
            } else {
              console.error('Mismatch in number of values for tbl_server_status');
            }
          })
          .on('end', resolve)
          .on('error', reject);
      });
    }

    const uploadLogSql = `INSERT INTO tbl_upload_log (
      filename, filedate, total_record, location_code, upload_date, import_date, appVersion, dbBackup
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    await promisePool.query(uploadLogSql, [
      req.file.filename,
      fileDate,
      successfulInserts,
      locationCode,
      currentDateTime,
      currentDateTime,
      appVersion,
      csvFile ? (await fs.promises.readFile(extractDir + csvFile, 'utf-8')).split('\n')[1].split(',')[0] : null
    ]);

    console.log('Data inserted into tbl_upload_log successfully.');

    res.send('SQL file inserted into database, commands executed successfully.');
  } catch (err) {
    console.error('Error in file upload process:', err);
    res.status(500).send('Error in file upload process.');
  }
});


function extractLocationCode(extractDir) {
  const zipFilename = path.basename(extractDir.slice(0, -1)); // Remove trailing slash and get the base filename
  const locationCode = zipFilename.substring(9, 12); // Assuming location code is characters 9 to 11 (0-based index) after the date
  return locationCode;
}

function readAppVersion(extractDir) {
  const versionFilePath = extractDir + 'vrsn.txt';
  if (fs.existsSync(versionFilePath)) {
    const versionContent = fs.readFileSync(versionFilePath, 'utf-8');
    return versionContent.trim(); // Assuming version is the content of vrsn.txt with leading/trailing whitespaces removed
  } else {
    return null; // Return null if vrsn.txt does not exist
  }
}



// Update designation master
app.put('/usermasterupdate/:Desig_ID', async (req, res) => {
  try {
    const { Desig_name, Desig_ID } = req.body;
    const query = "UPDATE tbl_designation_master SET Desig_name = ? WHERE Desig_ID = ?";
    const [result] = await promisePool.query(query, [Desig_name, Desig_ID]);
    res.status(200).json({ message: 'User updated successfully', id: req.params.Desig_ID });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "An error occurred while updating user" });
  }
});


app.put("/updatepassword/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    // Hash the password using bcrypt
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const query = `
      UPDATE tbl_user_master 
      SET password = ?
      WHERE user_id = ?
    `;
    const params = [hashedPassword, user_id];
    await promisePool.query(query, params);

    res.status(200).json({ message: "Password updated successfully", id: user_id });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ error: "An error occurred while updating the password" });
  }
});





// Update user
app.put("/createuserupdate/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;
    const data = req.body;
    const query = `
      UPDATE tbl_user_master 
      SET 
        first_name = ?, 
        middle_name = ?, 
        last_name = ?, 
        password = ?, 
        designation = ?, 
        phone_no = ?,  
        superior_name = ?, 
        superior_email = ?,  
        emp_id = ?,  
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
    const params = [
      data.first_name,
      data.middle_name,
      data.last_name,
      data.password,
      data.designation,
      data.phone_no,
      data.superior_name || '',
      data.superior_email || '',
      data.emp_id,
      data.login_disabled_date,
      data.fpi_template || '',
      data.fpi_template_two || '',
      data.fpi_template_three || '',
      data.fpi_template_four || '',
      data.lang || '',
      data.locations,
      data.user_type,
      user_id
    ];
    await promisePool.query(query, params);

    // Update user role
    const query2 = "UPDATE tbl_bridge_role_to_um SET user_ids=? WHERE role_id=?";
    const params2 = [data.role_id, user_id, data.user_ids];
    await promisePool.query(query2, params2);

    // Update user group
    const query3 = "UPDATE tbl_bridge_grp_to_um SET user_ids=? WHERE group_id=?";
    const params3 = [data.group_id, user_id, data.user_ids];
    await promisePool.query(query3, params3);

    res.status(200).json({ message: "User updated successfully", id: user_id });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "An error occurred while updating user" });
  }
});
  app.put('/updaterole/:id', (req, res) => {
    const role_id = req.params.id;
    const { user_role } = req.body;
    const query = "UPDATE tbl_user_roles SET user_role = ? WHERE role_id = ?";
  
  
    mysql22.query(query, [user_role, role_id], (err, result) => {
      if (err) {
        console.error("Error updating role name:", err);
        res.status(500).json({ error: "An error occurred while updating role name" });
      } else {
        if (result.affectedRows === 0) {
          res.status(404).json({ error: "role not found" });
        } else {
          console.log("role name updated successfully. role ID:", role_id);
          res.status(200).json({ message: "role name updated successfully", id: role_id });
        }
      }
    });
  });
   
 // Update group
app.put('/updategroup/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { group_name } = req.body;
    const query = "UPDATE tbl_group_master SET group_name = ? WHERE group_id = ?";
    const [result] = await promisePool.query(query, [group_name, id]);
    if (result.affectedRows === 0) {
      res.status(404).json({ error: "Group not found" });
    } else {
      console.log("Group name updated successfully. Group ID:", id);
      res.status(200).json({ message: "Group name updated successfully", id });
    }
  } catch (error) {
    console.error("Error updating group name:", error);
    res.status(500).json({ error: "An error occurred while updating group name" });
  }
});

// Delete group
app.delete("/deletegroup/:group_id", async (req, res) => {
  try {
    const { group_id } = req.params;
    await promisePool.query("DELETE FROM tbl_group_master WHERE group_id = ?", [group_id]);
    res.json({ message: "Group deleted successfully" });
  } catch (error) {
    console.error("Error deleting group:", error);
    res.status(500).json({ error: "An error occurred while deleting group" });
  }
});

// Delete role
app.delete("/deleterole/:role_id", async (req, res) => {
  try {
    const { role_id } = req.params;
    await promisePool.query("DELETE FROM tbl_user_roles WHERE role_id = ?", [role_id]);
    res.json({ message: "Role deleted successfully" });
  } catch (error) {
    console.error("Error deleting role:", error);
    res.status(500).json({ error: "An error occurred while deleting role" });
  }
});

// Delete user
app.delete("/createuserdelete/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;
    await promisePool.query("DELETE FROM tbl_user_master WHERE user_id = ?", [user_id]);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "An error occurred while deleting user" });
  }
});

// Delete user master
app.delete("/usermasterdelete/:Desig_ID", async (req, res) => {
  try {
    const { Desig_ID } = req.params;
    await promisePool.query("DELETE FROM tbl_designation_master WHERE Desig_ID = ?", [Desig_ID]);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "An error occurred while deleting user" });
  }
});
