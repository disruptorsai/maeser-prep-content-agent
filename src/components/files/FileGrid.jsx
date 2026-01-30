import React from 'react';
import { MoreVertical, File as FileIcon, Image, Video, Music, Archive, Code } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import FolderGridItem from './FolderGridItem';

const fileTypeIcons = {
  image: <Image className="w-8 h-8 text-blue-500" />,
  video: <Video className="w-8 h-8 text-purple-500" />,
  audio: <Music className="w-8 h-8 text-pink-500" />,
  document: <FileIcon className="w-8 h-8 text-green-500" />,
  archive: <Archive className="w-8 h-8 text-yellow-500" />,
  code: <Code className="w-8 h-8 text-gray-500" />,
  other: <FileIcon className="w-8 h-8 text-gray-500" />,
};

export default function FileGrid({ items, onFileAction, formatFileSize, onFolderClick, agents = [] }) {

  const getAgentDisplayName = (agentName) => {
    if (!agentName || agentName === 'shared') return 'All Agents';
    const agent = agents.find(a => a.name === agentName);
    return agent ? agent.display_name : 'Unknown Agent';
  };

  const renderFile = (file) => (
    <Card key={file.id} className="group relative transition-all hover:shadow-lg hover:-translate-y-1">
      <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
        <div className="mb-3">{fileTypeIcons[file.file_type] || fileTypeIcons.other}</div>
        <p className="font-semibold text-sm truncate w-full" title={file.filename}>
          {file.filename}
        </p>
        <p className="text-xs text-slate-500">{formatFileSize(file.file_size)}</p>
        <div className="mt-2">
            <Badge variant="outline">{getAgentDisplayName(file.agent_name)}</Badge>
        </div>
      </CardContent>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreVertical className="w-4 h-4 text-slate-600" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onFileAction('preview', file)}>Preview</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onFileAction('delete', file)} className="text-red-500">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Card>
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {items.map(item =>
        item.type === 'folder' ? (
          <FolderGridItem key={item.path} folder={item} onFolderClick={onFolderClick} />
        ) : (
          renderFile(item)
        )
      )}
    </div>
  );
}