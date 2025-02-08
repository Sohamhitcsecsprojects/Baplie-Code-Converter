const express = require("express");
const multer = require("multer");
const xlsx = require("xlsx");
const fs = require("fs");
const cors = require("cors");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const { vesselName, senderName, receiverName } = req.body; // Get user input
  if (!vesselName || !senderName || !receiverName) {
    return res.status(400).json({ error: "Vessel, Sender, and Receiver names are required" });
  }

  const workbook = xlsx.readFile(req.file.path);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet);

  let baplieData = generateBaplie(data, vesselName, senderName, receiverName);

  fs.writeFileSync("output.txt", baplieData);
  res.json({ baplie: baplieData });
});

function generateBaplie(data, vesselName, senderName, receiverName) {
  let baplieContent = `UNB+UNOA:2+${senderName}+${receiverName}+${new Date().toISOString().replace(/[-T:.Z]/g, '')}+0'\n`;
  baplieContent += `UNH+1+BAPLIE:D:95B:UN:SMDG20'\n`;
  baplieContent += `BGM++0+9'\n`;
  baplieContent += `DTM+137:${new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 12)}:201'\n`;
  baplieContent += `TDT+20+VOY12345+++MSC:172:20+++5LBN5:103:ZZZ:${vesselName}'\n`; // Vessel name updated dynamically
  baplieContent += `LOC+5+INHAL'\n`;
  baplieContent += `LOC+61+SGSIN'\n`;
  baplieContent += `RFF+VON:VOY12345'\n`;

  data.forEach((row) => {
    baplieContent += `LOC+147+${row["Container No"]}::5'\n`;
    baplieContent += `MEA+VGM++KGM:${row["Weight (kg)"]}'\n`;
    baplieContent += `LOC+9+${row["Port of Loading"]}:139:6'\n`;
    baplieContent += `LOC+11+${row["Port of Discharge"]}:139:6'\n`;
    baplieContent += `RFF+BM:${row["Booking Ref"] || "1"}'\n`;
    baplieContent += `EQD+CN+${row["Container No"]}+${row["ISO Code"] || "45G1"}+++5'\n`;

    if (row["Hazardous"] && row["Hazardous"].toLowerCase() === "yes") {
      baplieContent += `DGS+IMD+${row["IMDG Code"] || "3"}+${row["UN Number"] || "2055"}'\n`;
    }

    if (row["Reefer Temp"]) {
      baplieContent += `TMP+2+${row["Reefer Temp"]}:CEL'\n`;
    }

    baplieContent += `NAD+CA+${row["Carrier Code"] || "MAIP1"}:172:20'\n`;
  });

  baplieContent += `UNT+${data.length + 10}+1'\n`;
  baplieContent += `UNZ+1+1'\n`;

  return baplieContent;
}

app.get("/download", (req, res) => {
  res.download("output.txt");
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));