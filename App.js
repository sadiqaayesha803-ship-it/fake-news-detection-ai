import React, { useState } from "react";
import "./App.css";

function App() {
  const [text, setText] = useState("");

  return (
    <div className="container">
      <h1>Fake News Detection System</h1>

      <textarea
        placeholder="Paste news article here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <button>Check News</button>

      <div className="result-card">
        <h2>Result will appear here</h2>
      </div>
    </div>
  );
}

export default App;