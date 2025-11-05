import React, { useEffect, useState } from "react";

function App() {
  const [status, setStatus] = useState("Loading...");

  useEffect(() => {
    fetch("http://localhost:3001/api/health")
      .then((res) => res.json())
      .then((data) => {
        setStatus(`${data.message} (${data.time})`);
      })
      .catch((err) => {
        console.error(err);
        setStatus("Error connecting to backend");
      });
  }, []);
  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Mini Thames Water Dashboard</h1>
      <p>{status}</p>
    </div>
  );
}

export default App;
