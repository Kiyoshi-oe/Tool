
import { useEffect, useState } from "react";

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [visible, setVisible] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onComplete, 500); // Allow fade out animation to complete
    }, 2500);
    
    return () => clearTimeout(timer);
  }, [onComplete]);
  
  return (
    <div className={`fixed inset-0 flex items-center justify-center bg-cyrus-dark z-50 transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="text-center">
        <img 
          src="/lovable-uploads/fb52f3a5-7dc6-4160-9fa1-1267aa92ece4.png" 
          alt="Cyrus Resource Tool" 
          className="w-80 h-auto mb-6"
        />
        <div className="mt-6 w-64 bg-gray-700 rounded-full h-2 mx-auto">
          <div className="bg-cyrus-blue h-2 rounded-full animate-loading-bar"></div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
