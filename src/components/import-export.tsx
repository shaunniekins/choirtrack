"use client";

import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Upload } from "lucide-react";
import { useHymnStore } from "@/lib/store";
import { toast } from "sonner";

export function ImportExportButton() {
  const { exportData, importData } = useHymnStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    exportData();
    toast.success("Backup downloaded successfully.");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonData = event.target?.result as string;
        const result = importData(jsonData);
        
        if (result.success) {
          toast.success("Backup restored successfully.");
        } else {
          toast.error(result.error || "Failed to restore backup.");
        }
      } catch {
        toast.error("Failed to read file.");
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex space-x-2">
      <input 
        type="file" 
        accept=".json" 
        style={{ display: 'none' }} 
        ref={fileInputRef} 
        onChange={handleImport}
      />
      <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} title="Restore from backup">
        <Upload className="h-4 w-4 mr-2" />
        Import
      </Button>
      <Button variant="outline" size="sm" onClick={handleExport} title="Download backup">
        <Download className="h-4 w-4 mr-2" />
        Export
      </Button>
    </div>
  );
}
