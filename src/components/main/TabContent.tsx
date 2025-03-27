import React from "react";

interface TabContentProps {
  currentTab: string;
  activeTab: string;
}

const TabContent: React.FC<TabContentProps> = ({ currentTab, activeTab }) => {
  return (
    <div className="h-full bg-cyrus-dark p-4 overflow-auto">
      {currentTab === "main" && (
        <div>
          <h2 className="text-xl font-bold mb-4">Willkommen bei Cluster Tool</h2>
          
          {activeTab === "resources" && (
            <div>
              <p className="mb-2">Ressourcen-Übersicht</p>
              <ul className="list-disc pl-5 text-gray-300">
                <li>Wählen Sie einen Ressourcentyp aus der Seitenleiste aus</li>
                <li>Erstellen oder bearbeiten Sie Ressourcen</li>
                <li>Speichern Sie Ihre Änderungen</li>
              </ul>
            </div>
          )}
          
          {activeTab === "files" && (
            <div>
              <p className="mb-2">Dateien-Übersicht</p>
              <ul className="list-disc pl-5 text-gray-300">
                <li>Durchsuchen Sie Projektdateien</li>
                <li>Bearbeiten Sie Konfigurationsdateien</li>
                <li>Verwalten Sie Assets und Ressourcen</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TabContent; 