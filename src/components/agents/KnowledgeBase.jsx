import React, { useState, useEffect, useCallback } from 'react';
import { FileDocument } from '@/entities/FileDocument';
import { UploadFile } from '@/integrations/Core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FileUploadZone from '../files/FileUploadZone';
import FileGrid from '../files/FileGrid';
import { FolderOpen, Bot, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function KnowledgeBase({ agentName, agents }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedAgentForUpload, setSelectedAgentForUpload] = useState('shared');

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const fileData = await FileDocument.list(`-created_date`);
      setFiles(fileData);
    } catch (error) {
      console.error("Error loading knowledge base files:", error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleFileUpload = async (uploadedFiles) => {
    if (!selectedAgentForUpload) {
        toast.error("Please select an agent to assign the file(s) to.");
        return;
    }
    
    const MAX_FILE_SIZE_MB = 10;
    const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
    
    const validFiles = [];
    const oversizedFiles = [];

    for (const file of uploadedFiles) {
        if (file.size > MAX_FILE_SIZE_BYTES) {
            oversizedFiles.push(file);
        } else {
            validFiles.push(file);
        }
    }

    if (oversizedFiles.length > 0) {
        toast.error("Some files were too large", {
            description: `${oversizedFiles.map(f => f.name).join(', ')} exceeded the ${MAX_FILE_SIZE_MB}MB limit and were not uploaded.`,
            duration: 8000
        });
    }

    if (validFiles.length === 0) return;

    setUploading(true);
    try {
      for (const file of validFiles) {
        const { file_url } = await UploadFile({ file });
        await FileDocument.create({
          agent_name: selectedAgentForUpload,
          filename: file.name,
          file_url,
          file_size: file.size,
          mime_type: file.type,
          file_type: getFileType(file.type),
          folder_path: `/knowledge_base/${selectedAgentForUpload}/`,
        });
      }
      toast.success(`${validFiles.length} file(s) uploaded successfully!`);
      await loadFiles();
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("File Upload Failed", {
        description: "The server couldn't process the upload. This might be a temporary issue. Please try again in a few moments.",
        duration: 6000,
      });
    }
    setUploading(false);
  };
  
  const getFileType = (mimeType) => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf') || mimeType.includes('document')) return 'document';
    return 'other';
  };

  const handleFileAction = async (action, file) => {
    if (action === 'delete') {
      if (confirm(`Are you sure you want to remove "${file.filename}" from the knowledge base?`)) {
        try {
          await FileDocument.delete(file.id);
          loadFiles();
        } catch (error) {
          console.error("Error deleting file:", error);
        }
      }
    } else if (action === 'preview') {
      window.open(file.file_url, '_blank');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const knowledgeBaseItems = files.map(file => ({ ...file, type: 'file' }));

  return (
    <div className="space-y-6">
      <Card className="bg-white shadow-sm border">
        <CardHeader>
            <CardTitle>Upload to Knowledge Base</CardTitle>
            <p className="text-slate-600">Upload documents to provide context to your AI agents. Assign them to a specific agent or make them available to all agents.</p>
        </CardHeader>
        <CardContent className="space-y-4">
            <div>
              <Label htmlFor="agent-assignment" className="font-semibold">Assign to Agent</Label>
              <Select value={selectedAgentForUpload} onValueChange={setSelectedAgentForUpload}>
                  <SelectTrigger id="agent-assignment" className="w-full sm:w-1/2 mt-1">
                      <div className="flex items-center gap-2">
                          <Bot className="w-4 h-4 text-slate-500" />
                          <SelectValue placeholder="Select an agent..." />
                      </div>
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="shared">All Agents (Shared)</SelectItem>
                      {agents && agents.map(agent => (
                          <SelectItem key={agent.name} value={agent.name}>{agent.display_name}</SelectItem>
                      ))}
                  </SelectContent>
              </Select>
            </div>

            <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertTitle>Pro Tip for Best Results</AlertTitle>
                <AlertDescription>
                    For the most accurate data parsing, we recommend uploading documents in these formats:
                    <ul className="list-disc list-inside mt-2 text-sm">
                        <li><strong className="font-semibold">.txt (Plain Text):</strong> Ideal for raw text documents.</li>
                        <li><strong className="font-semibold">.md (Markdown):</strong> Best for structured text with headings.</li>
                        <li><strong className="font-semibold">.csv:</strong> Perfect for tabular or spreadsheet data.</li>
                    </ul>
                    <p className="text-xs mt-2 text-slate-500">
                        While PDFs are supported, text-based PDFs with simple, single-column layouts provide the best results.
                    </p>
                </AlertDescription>
            </Alert>

            <FileUploadZone onUpload={handleFileUpload} uploading={uploading} />
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm border">
        <CardHeader>
            <CardTitle>Global Knowledge Base</CardTitle>
            <p className="text-slate-600">These files provide context to the content generation agents.</p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading files...</p>
          ) : knowledgeBaseItems.length > 0 ? (
            <FileGrid 
              items={knowledgeBaseItems}
              onFileAction={handleFileAction}
              formatFileSize={formatFileSize}
              onFolderClick={() => {}}
              agents={agents}
            />
          ) : (
            <div className="text-center py-12">
              <FolderOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Knowledge Base is Empty</h3>
              <p className="text-slate-500">Upload files to give your content agents context about your business.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}