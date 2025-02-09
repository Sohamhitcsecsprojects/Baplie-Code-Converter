const express = require("express");
const multer = require("multer");
const xlsx = require("xlsx");
const fs = require("fs").promises;
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 5000;

// Enable CORS for all origins and allow credentials
app.use(cors({ origin: "*", methods: "GET,POST", allowedHeaders: "Content-Type" }));
app.use(express.json());

// Configure multer with better settings
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // Limit file size to 10MB

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      console.error("No file received");
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log("File received:", req.file);

    const { vesselName, senderName, receiverName } = req.body;
    if (!vesselName || !senderName || !receiverName) {
      return res.status(400).json({ error: "Vessel, Sender, and Receiver names are required" });
    }

    const filePath = req.file.path;
    console.log("Processing file:", filePath);

    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    const baplieData = generateBaplie(data, vesselName, senderName, receiverName);
    const outputPath = path.join(__dirname, "output", `baplie_${Date.now()}.txt`);

    await fs.writeFile(outputPath, baplieData);
    await fs.unlink(filePath); // Clean up uploaded file

    res.json({ message: "File processed successfully", baplie: baplieData, downloadUrl: `/download/${path.basename(outputPath)}` });
  } catch (error) {
    console.error("Error processing file:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

function generateBaplie(data, vesselName, senderName, receiverName) {
  const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, "");
  const formattedDate = timestamp.slice(0, 12);
  let baplieContent = [
    `UNB+UNOA:2+${senderName}+${receiverName}+${timestamp}+0'`,
    `UNH+1+BAPLIE:D:95B:UN:SMDG20'`,
    `BGM++0+9'`,
    `DTM+137:${formattedDate}:201'`,
    `TDT+20+VOY12345+++MSC:172:20+++5LBN5:103:ZZZ:${vesselName}'`,
    `LOC+5+INHAL'`,
    `LOC+61+SGSIN'`,
    `RFF+VON:VOY12345'`
  ];

  data.forEach(row => {
    baplieContent.push(
      `LOC+147+${row["Container No"]}::5'`,
      `MEA+VGM++KGM:${row["Weight (kg)"]}'`,
      `LOC+9+${row["Port of Loading"]}:139:6'`,
      `LOC+11+${row["Port of Discharge"]}:139:6'`,
      `RFF+BM:${row["Booking Ref"] || "1"}'`,
      `EQD+CN+${row["Container No"]}+${row["ISO Code"] || "45G1"}+++5'`
    );

    if (row["Hazardous"]?.toLowerCase() === "yes") {
      baplieContent.push(`DGS+IMD+${row["IMDG Code"] || "3"}+${row["UN Number"] || "2055"}'`);
    }

    if (row["Reefer Temp"]) {
      baplieContent.push(`TMP+2+${row["Reefer Temp"]}:CEL'`);
    }

    baplieContent.push(`NAD+CA+${row["Carrier Code"] || "MAIP1"}:172:20'`);
  });

  baplieContent.push(`UNT+${data.length + 10}+1'`, `UNZ+1+1'`);
  return baplieContent.join("\n");
}

// Serve processed BAPLIE files dynamically
app.get("/download/:filename", (req, res) => {
  const filePath = path.join(__dirname, "output", req.params.filename);
  res.download(filePath, req.params.filename, err => {
    if (err) {
      console.error("Error in file download:", err);
      res.status(500).json({ error: "Failed to download file" });
    }
  });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
