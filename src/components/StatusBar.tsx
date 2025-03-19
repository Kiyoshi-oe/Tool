
import { useState, useEffect } from "react";

interface StatusBarProps {
  mode: string;
  itemCount?: number;
}

const StatusBar = ({ mode, itemCount = 0 }: StatusBarProps) => {
  const [time, setTime] = useState<string>("");
  
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setTime(timeString);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  const isEditMode = mode === "Edit";
  
  return (
    <div className={`flex items-center justify-between px-4 py-1 ${isEditMode ? 'bg-[#da4b4b]' : 'bg-cyrus-blue'} text-white text-xs`}>
      <div>Mode: {mode}</div>
      <div>Items: {itemCount}</div>
      <div>{time}</div>
    </div>
  );
};

export default StatusBar;
