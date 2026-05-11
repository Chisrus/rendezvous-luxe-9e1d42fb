import { useEffect, useState } from "react";

// Pseudo-deterministic but lively: 180-340 range, drifts slowly
const baseFor = () => {
  const h = new Date().getHours();
  const peak = Math.sin(((h - 8) / 24) * Math.PI * 2) * 60 + 250;
  return Math.max(180, Math.min(340, Math.round(peak)));
};

const OnlineCounter = () => {
  const [count, setCount] = useState<number>(baseFor());

  useEffect(() => {
    const t = setInterval(() => {
      setCount((c) => {
        const drift = Math.round((Math.random() - 0.5) * 6);
        const next = Math.max(180, Math.min(340, c + drift));
        return next;
      });
    }, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      <span className="font-medium text-foreground/80">{count}</span> en ligne
    </span>
  );
};

export default OnlineCounter;