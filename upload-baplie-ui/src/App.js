import React, { useState } from "react";
import {Helmet} from "react-helmet";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify"; // Named imports
import "react-toastify/dist/ReactToastify.css";         // Import CSS for styling
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [vesselName, setVesselName] = useState("");
  const [senderName, setSenderName] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [baplieData, setBaplieData] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file || !vesselName || !senderName || !receiverName) {
      toast.error("Please fill in all fields and upload a file!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("vesselName", vesselName);
    formData.append("senderName", senderName);
    formData.append("receiverName", receiverName);

    try {
      const response = await axios.post("http://localhost:5000/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setBaplieData(response.data.baplie);
      toast.success("File uploaded successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload file!");
    }
  };

  const handleDownload = () => {
    window.open("http://localhost:5000/download", "_blank");
  };

  return (
    <div>
    <div className="application">
            <Helmet>
                <meta charSet="utf-8" />
                <title>Baplie Converter</title>
                <link rel="canonical" href="http://BaplieConverter" />
            </Helmet>
            ...
        </div>
    <div className="App">
      <ToastContainer />
      <div className="container">
        <h1>BAPLIE Code Converter</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Upload Excel File</label>
            <input type="file" onChange={handleFileChange} accept=".xlsx" />
          </div>
          <div className="form-group">
            <label>Vessel Name</label>
            <input
              type="text"
              value={vesselName}
              onChange={(e) => setVesselName(e.target.value)}
              placeholder="Enter vessel name"
            />
          </div>
          <div className="form-group">
            <label>Sender Name</label>
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="Enter sender name"
            />
          </div>
          <div className="form-group">
            <label>Receiver Name</label>
            <input
              type="text"
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
              placeholder="Enter receiver name"
            />
          </div>
          <button type="submit" className="btn">Upload & Generate</button>
        </form>
        {baplieData && (
          <div className="result">
            <h2>Generated BAPLIE</h2>
            <pre>{baplieData}</pre>
            <button onClick={handleDownload} className="btn download">
              Download Output File
            </button>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

export default App;
