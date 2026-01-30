import React, { useCallback, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, CloudUpload, Loader2, FileText } from 'lucide-react';

export default function FileUploadZone({ onUpload, uploading, acceptedFileTypes = null, helpText = null }) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragOver(true);
    }
  }, []);

  const handleDragOut = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      onUpload(files);
    }
  }, [onUpload]);

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      onUpload(files);
    }
  };

  return (
    <Card 
      className={`bg-white/80 backdrop-blur-sm border-2 border-dashed transition-all duration-200 ${
        dragOver 
          ? 'border-blue-400 bg-blue-50' 
          : 'border-slate-300 hover:border-blue-300 hover:bg-blue-25'
      } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <CardContent className="p-8 text-center">
        {uploading ? (
          <div className="space-y-4">
            <Loader2 className="w-12 h-12 text-blue-600 mx-auto animate-spin" />
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Processing Files...</h3>
              <p className="text-slate-600">Extracting content and importing to your library.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              {dragOver ? (
                <CloudUpload className="w-16 h-16 text-blue-600" />
              ) : (
                <FileText className="w-16 h-16 text-slate-400" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {dragOver ? 'Drop files here' : 'Upload Files'}
              </h3>
              <p className="text-slate-600 mb-4">
                {helpText || 'Drag and drop files here, or click to browse'}
              </p>
              <input
                type="file"
                multiple
                accept={acceptedFileTypes || "*"}
                className="hidden"
                id="file-upload"
                onChange={handleFileSelect}
              />
              <Button asChild className="bg-blue-600 hover:bg-blue-700">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Files
                </label>
              </Button>
            </div>
            <p className="text-xs text-slate-500">
              {acceptedFileTypes === ".pdf,.docx,.doc" 
                ? "Supports PDF and DOCX files • Max 10MB per file"
                : "Supports all file types • Max 10MB per file"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}