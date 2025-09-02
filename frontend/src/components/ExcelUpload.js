import React, { useState } from "react";
import axios from "axios";
import config from "../config";

export default function ExcelUpload({ onUploadComplete }) {
  const [file, setFile] = useState(null);

  const handleUpload = async () => {
    if (!file) return alert("Please select a file");
    const formData = new FormData();
    formData.append("file", file);

    try {
      console.log("Uploading file:", file.name);
      const response = await axios.post(`${config.API_URL}/api/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      console.log("Upload response:", response.data);
      alert("✅ Uploaded successfully!");
      if (onUploadComplete) onUploadComplete();
    } catch (error) {
      console.error("Upload error:", error);
      console.error("Error response:", error.response?.data);
      
      // Handle duplicate Unit # errors specifically
      if (error.response?.data?.error === "Duplicate Unit #s found") {
        const details = error.response.data.details;
        alert(`❌ Upload failed: Duplicate Unit #s found!\n\n${details}\n\nPlease fix the duplicates and try again.`);
      } else {
        alert(`❌ Upload failed: ${error.response?.data?.error || error.message}`);
      }
    }
  };

  return (
    <div>
      <input type="file" accept=".xlsx,.xls" onChange={e => setFile(e.target.files[0])} />
      <button onClick={handleUpload}>Upload Excel</button>
    </div>
  );
}
