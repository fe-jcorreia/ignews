import { useState } from "react";
import { useEffect } from "react";

export function Async() {
  const [isButtonInvisible, setIsButtonInvisible] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setIsButtonVisible(true);
    }, 1000);
  }, []);

  return (
    <div>
      <div>Hello World</div>
      {!isButtonInvisible && <button>BUTTON</button>}
    </div>
  );
}
