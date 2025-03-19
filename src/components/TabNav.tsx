
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";

interface TabNavProps {
  tabs: string[];
  activeTab: string;
  onChangeTab: (tab: string) => void;
}

const TabNav = ({ tabs, activeTab, onChangeTab }: TabNavProps) => {
  return (
    <div className="flex overflow-x-auto bg-cyrus-dark border-b border-cyrus-dark-lightest">
      <Tabs defaultValue={activeTab} onValueChange={onChangeTab} className="w-full">
        <TabsList className="bg-cyrus-dark border-b border-cyrus-dark-lightest h-auto">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-200
                ${activeTab === tab 
                  ? 'text-white border-b-2 border-[#007BFF] data-[state=active]:bg-transparent data-[state=active]:text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-opacity-20 hover:bg-[#007BFF]'}`}
            >
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
};

export default TabNav;
