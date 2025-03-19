
import { FolderOpen, Save, SaveAll, Eye, Edit } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FileMenuProps {
  onOpen: () => void;
  onSave: () => void;
  onSaveAllFiles: () => void;
  onSaveAs: (fileName: string) => void;
  editMode: boolean;
  onToggleEditMode: () => void;
}

const FileMenu = ({ onOpen, onSave, onSaveAllFiles, onSaveAs, editMode, onToggleEditMode }: FileMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="px-2 py-1 text-sm" asChild>
        <button>File</button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-cyrus-dark-light border border-cyrus-dark-lightest rounded-md shadow-lg z-50 w-64">
        <div className="p-2">
          <DropdownMenuItem 
            className="w-full flex items-center space-x-2 px-3 py-2 text-gray-300 hover:bg-cyrus-dark-lighter rounded text-sm cursor-pointer"
            onClick={() => {
              onOpen();
              toast.info("Opening file selector");
            }}
          >
            <FolderOpen size={16} />
            <span>Open File</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            className="w-full flex items-center space-x-2 px-3 py-2 text-gray-300 hover:bg-cyrus-dark-lighter rounded text-sm cursor-pointer"
            onClick={onToggleEditMode}
          >
            {editMode ? (
              <>
                <Eye size={16} />
                <span>View</span>
              </>
            ) : (
              <>
                <Edit size={16} />
                <span>Edit</span>
              </>
            )}
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            className="w-full flex items-center space-x-2 px-3 py-2 text-gray-300 hover:bg-cyrus-dark-lighter rounded text-sm cursor-pointer"
            onClick={() => onSave()}
          >
            <Save size={16} />
            <span>Save Current File</span>
          </DropdownMenuItem>

          <DropdownMenuItem 
            className="w-full flex items-center space-x-2 px-3 py-2 text-gray-300 hover:bg-cyrus-dark-lighter rounded text-sm cursor-pointer"
            onClick={() => onSaveAllFiles()}
          >
            <SaveAll size={16} />
            <span>Save All Modified Files</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            className="w-full flex items-center space-x-2 px-3 py-2 text-gray-300 hover:bg-cyrus-dark-lighter rounded text-sm cursor-pointer"
            onClick={() => onSaveAs("Spec_Item.txt")}
          >
            <SaveAll size={16} />
            <span>Save As...</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default FileMenu;
