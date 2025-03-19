
import { ResourceItem } from "../types/fileTypes";

export const itemTypeToTab: {[key: string]: string} = {
  "IK1_WEAPON": "Weapon",
  "IK1_ARMOR": "Armor", 
  "IK1_GENERAL": "Other Item",
  "IK1_ACCESSORY": "Accessory",
  "IK1_PAPERDOLL": "Fashion",
  "IK1_MONSTER": "Monster",
  "IK1_NPC": "NPC",
  "IK1_COLLECT": "Collecting",
  "IK1_SKILL": "Skill",
  "IK1_QUEST": "Quest",
  "IK1_GIFTBOX": "Giftbox"
};

export const getItemTab = (item: ResourceItem): string => {
  const itemKind1 = item.data.dwItemKind1 as string;
  return itemTypeToTab[itemKind1] || "Other Item";
};

export const getFilteredItems = (fileData: any, currentTab: string): ResourceItem[] => {
  if (!fileData) {
    console.log("No fileData available for filtering");
    return [];
  }
  
  console.log(`Filtering tab: ${currentTab}, total items: ${fileData.items.length}`);
  
  if (currentTab === "Set Effect") {
    const filtered = fileData.items.filter((item: ResourceItem) => item.setEffects && item.setEffects.length > 0);
    console.log(`Filtered Set Effect items: ${filtered.length}`);
    return filtered;
  }
  
  const filtered = fileData.items.filter((item: ResourceItem) => getItemTab(item) === currentTab);
  console.log(`Filtered ${currentTab} items: ${filtered.length}`);
  if (filtered.length > 0) {
    console.log("First filtered item:", filtered[0]);
  }
  return filtered;
};

export const tabs = [
  "Weapon", "Armor", "Fashion", "Monster", "Other Item", 
  "Accessory", "NPC", "Collecting", "Skill", "Quest", "Giftbox", "Set Effect"
];
