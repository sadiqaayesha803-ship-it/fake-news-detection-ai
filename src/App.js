import React, { useState } from "react";
import "./App.css";

function App() {
  const [text, setText] = useState("");
  const [result, setResult] = useState("");

  // Button function
  const handleCheck = () => {
    if (text === "") {
      setResult("Please enter some news!");
    } else {
      // Dummy logic (temporary)
      if (text.length > 50) {
        setResult("Fake News ❌");
      } else {
        setResult("Real News ✅");
      }
    }
  };

  return (
    <div className="container">
      <h1>Fake News Detection System</h1>

      {/* Textarea */}
      <textarea
        placeholder="Paste news article here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      {/* Button */}
      <button onClick={handleCheck}>Check News</button>

      {/* Result Box */}
      <div className="result-card">
        <h2>{result}</h2>
      </div>
    </div>
  );
}

export default App;