import React, { useState } from "react";
import { Helmet } from "react-helmet";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

const InputField = ({ label, name, value, onChange }) => (
  <div className="form-group">
    <label htmlFor={name}>{label}</label>
    <input
      type="text"
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={`Enter ${label.toLowerCase()}`}
    />
  </div>
);

function App() {
  const [formData, setFormData] = useState({
    file: null,
    vesselName: "",
    senderName: "",
    receiverName: "",
  });

  const [baplieData, setBaplieData] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.file || !formData.vesselName || !formData.senderName || !formData.receiverName) {
      toast.error("Please fill in all fields and upload a file!");
      return;
    }

    setLoading(true);
    const data = new FormData();
    Object.keys(formData).forEach((key) => data.append(key, formData[key]));

    try {
      const { data: response } = await axios.post("http://localhost:5000/upload", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setBaplieData(response.baplie);
      toast.success("File uploaded successfully!");

      // Auto-download file after generation
      const downloadLink = document.createElement("a");
      downloadLink.href = "http://localhost:5000/download";
      downloadLink.download = "baplie_output.txt";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to upload file!");
    } finally {
      setLoading(false);
    }
    
  };

  return (
    <div className="app-container">
      <div className="application">
            <Helmet>
                <meta charSet="utf-8" />
                <title>Baplie</title>
                <link rel="canonical" href="http://mysite.com/example" />
            </Helmet>
            
        </div>
      <ToastContainer />
      <div className="container">
        <h1>BAPLIE Code Converter</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="file">Upload Excel File</label>
            <input type="file" name="file" id="file" onChange={handleChange} accept=".xlsx" />
          </div>

          {["vesselName", "senderName", "receiverName"].map((field) => (
            <InputField
              key={field}
              label={field.replace(/([A-Z])/g, " $1")}
              name={field}
              value={formData[field]}
              onChange={handleChange}
            />
          ))}

          <button type="submit" className="btn" disabled={loading}>
            {loading ? "Uploading..." : "Upload & Generate"}
          </button>
        </form>

        {baplieData && (
          <div className="result">
            <h2>Generated BAPLIE</h2>
            <pre>{baplieData}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
