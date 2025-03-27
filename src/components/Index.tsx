import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import OpenTabs from "./main/OpenTabs";
import TabContent from "./main/TabContent";
import MainContent from "./main/MainContent";
import { Toaster } from "react-hot-toast";

const Index = () => {
  const [activeTab, setActiveTab] = useState("resources");
  const [openTabs, setOpenTabs] = useState<string[]>(["main"]);
  const [currentTab, setCurrentTab] = useState("main");
  const [itemCount, setItemCount] = useState(0);
  const [showChangeLog, setShowChangeLog] = useState(false);

  // Simuliere das Laden von Ressourcen
  useEffect(() => {
    // In einer realen Anwendung würden hier Ressourcen geladen werden
    setItemCount(Math.floor(Math.random() * 100) + 10);
  }, []);

  const handleSelectTab = (tab: string) => {
    setActiveTab(tab);
  };

  const handleSelectOpenTab = (tab: string) => {
    setCurrentTab(tab);
  };

  const handleOpenChangeLog = () => {
    setShowChangeLog(true);
    // Hier würde man das Changelog-Modal öffnen
    alert("Änderungsprotokoll wurde geöffnet (Platzhalter)");
    setShowChangeLog(false);
  };

  return (
    <div className="flex h-screen bg-cyrus-dark text-white overflow-hidden">
      <Sidebar 
        onSelectTab={handleSelectTab} 
        activeTab={activeTab}
        onOpenChangeLog={handleOpenChangeLog}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <OpenTabs 
          tabs={openTabs}
          currentTab={currentTab}
          onSelectTab={handleSelectOpenTab}
          itemCount={itemCount}
        />
        
        <div className="flex-1 overflow-hidden">
          {currentTab === "main" ? (
            <MainContent activeTab={activeTab} />
          ) : (
            <TabContent currentTab={currentTab} activeTab={activeTab} />
          )}
        </div>
      </div>
      
      <Toaster position="bottom-right" />
    </div>
  );
};

export default Index; 