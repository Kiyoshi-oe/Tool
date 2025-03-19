import { useState } from "react";
import { X } from "lucide-react";
interface AboutModalProps {
  isVisible: boolean;
  onClose: () => void;
}
const AboutModal = ({
  isVisible,
  onClose
}: AboutModalProps) => {
  if (!isVisible) return null;
  return <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-cyrus-dark-light rounded-lg p-6 shadow-lg w-[500px] max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-cyrus-gold">About Cyrus Resource Tool</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex justify-center mb-6">
          <img alt="Cyrus Resource Tool" src="/lovable-uploads/dc71e438-a0f8-41e5-be06-f9d1dac670f1.png" className="w-80 h-auto" />
        </div>
        
        <div className="mb-6 text-gray-300">
          <h3 className="text-lg font-semibold mb-2 text-cyrus-blue">Company Information</h3>
          <p className="mb-4">
            <strong>Manufacturer:</strong> ArtLab Digitals
          </p>
          <p className="mb-4">
            Cyrus Resource Tool is a powerful editor designed for editing game resource files,
            with special focus on Spec_Item.txt formatting and editing. Our tool simplifies the
            editing process for game developers and modders.
          </p>
          
          <h3 className="text-lg font-semibold mb-2 text-cyrus-blue">Features</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Edit .txt, .h, and .inc files with structured interfaces</li>
            <li>Advanced categorization by item types</li>
            <li>Real-time change logging and history tracking</li>
            <li>Custom themes and appearance options</li>
            <li>Intelligent auto-completion</li>
            <li>Multi-document editing</li>
            <li>To-Do list management</li>
          </ul>
        </div>
        
        <div className="mb-6 text-gray-300">
          <h3 className="text-lg font-semibold mb-2 text-cyrus-blue">System Requirements</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Operating System: Windows 10/11, macOS 12+, Linux</li>
            <li>Memory: 4GB RAM minimum, 8GB recommended</li>
            <li>Disk Space: 200MB available space</li>
            <li>Internet Connection: Required for updates and cloud features</li>
          </ul>
        </div>
        
        <div className="text-center text-gray-400 text-sm mt-8">
          <p>© 2025 ArtLab Digitals. All rights reserved.</p>
          <p className="mt-1">Version 1.0.0</p>
        </div>
      </div>
    </div>;
};
export default AboutModal;