import { useState } from "react";

// Placeholder proving the React root renders. Replace with the prototype.
export function App() {
  const [count, setCount] = useState(0);

  return (
    <button type="button" onClick={() => setCount((c) => c + 1)}>
      React is wired up ({count})
    </button>
  );
}
