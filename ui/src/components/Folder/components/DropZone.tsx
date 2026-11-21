import React, {FC, useState} from 'react';
import {Fade, styled} from '@mui/material';
import {alpha} from '@mui/material/styles';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import type {UploadEntry} from './hooks/useUpload';

const MyDiv = styled('div')(({theme}) => {
  return {
    display: 'flex',
    backgroundColor: alpha(theme.palette.background.default, 0.72),

    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,

    alignItems: 'center',
    justifyContent: 'center',
  };
});

interface DropZoneProps {
  onUpload: (entries: UploadEntry[]) => void;
}

async function readEntry(entry: FileSystemEntry, prefix: string, entries: UploadEntry[]) {
  const path = prefix + entry.name;
  const result: UploadEntry = {path, isDirectory: entry.isDirectory};
  entries.push(result);
  try {
    if (entry.isFile) {
      result.file = await new Promise<File>((resolve, reject) => {
        (entry as FileSystemFileEntry).file(resolve, reject);
      });
    } else {
      const reader = (entry as FileSystemDirectoryEntry).createReader();
      while (true) {
        const children = await new Promise<FileSystemEntry[]>((resolve, reject) => {
          reader.readEntries(resolve, reject);
        });
        if (!children.length) break;
        for (const child of children) await readEntry(child, path + '/', entries);
      }
    }
  } catch (error) {
    result.error = `Could not read ${entry.isDirectory ? 'the folder' : 'the file'}. ${(error as Error).message}`;
  }
}

async function readDrop(transfer: DataTransfer): Promise<UploadEntry[]> {
  const items = Array.from(transfer.items).filter((item) => item.kind === 'file');
  if (!items.length) {
    return Array.from(transfer.files, (file) => ({path: file.name, file, isDirectory: false}));
  }

  // Access to the drag data ends when the drop event handler returns.
  const sources = items.map((item) => item.webkitGetAsEntry?.() ?? item.getAsFile());
  const entries: UploadEntry[] = [];
  for (const source of sources) {
    if (source instanceof File) {
      entries.push({path: source.name, file: source, isDirectory: false});
    } else if (source) {
      await readEntry(source, '', entries);
    }
  }
  return entries;
}

const DropZone: FC<DropZoneProps> = ({onUpload}) => {
  const [visible, setVisible] = useState(false);

  React.useEffect(() => {
    let dragTimeout: number | null = null;

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    function handleDragOver(e: DragEvent) {
      if (!e.dataTransfer?.types.includes('Files')) return;
      e.preventDefault();

      setVisible(true);

      if (dragTimeout) {
        clearTimeout(dragTimeout);
      }
      dragTimeout = window.setTimeout(() => {
        setVisible(false);
      }, 150);
    }

    async function handleDrop(e: DragEvent) {
      if (!e.dataTransfer?.types.includes('Files')) return;
      e.stopPropagation();
      e.preventDefault();
      setVisible(false);
      onUpload(await readDrop(e.dataTransfer));
    }

    return () => {
      if (dragTimeout) {
        clearTimeout(dragTimeout);
      }
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [onUpload]);

  return (
    <Fade in={visible} unmountOnExit>
      <MyDiv>
        <UploadFileIcon color="primary" fontSize="large" />
      </MyDiv>
    </Fade>
  );
};

export default DropZone;
