import { useEffect } from "react";

export const AntiScreenshot = () => {
  useEffect(() => {
    // Disable right-click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Detect print screen or typical screenshot shortcuts (MacOS/Win)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "PrintScreen" ||
        (e.ctrlKey && e.key === "p") ||
        (e.metaKey && e.shiftKey && (e.key === "3" || e.key === "4" || e.key === "5" || e.key === "s"))
      ) {
        // Obscure the body immediately
        document.body.style.opacity = "0";
        // Optionally try to clear clipboard, though require focus and permissions
        try {
          navigator.clipboard.writeText("Captures d'écran interdites.");
        } catch (err) {}
        
        setTimeout(() => {
          document.body.style.opacity = "1";
        }, 3000);
      }
    };

    // When the window loses focus (e.g. opening Snipping Tool), blur the sensitive content
    const handleBlur = () => {
      const root = document.getElementById("root");
      if (root) {
        root.style.filter = "blur(15px)";
        root.style.opacity = "0.5";
      }
    };

    const handleFocus = () => {
      const root = document.getElementById("root");
      if (root) {
        root.style.filter = "none";
        root.style.opacity = "1";
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  return null;
};
