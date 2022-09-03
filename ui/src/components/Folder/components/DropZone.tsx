import React, {FC, useState} from "react";
import {Fade, styled} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";

const MyDiv = styled('div')(() => {
  return {
    display: 'flex',
    backgroundColor: 'rgba(0,0,0,0.5)',

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
  onUpload: (files: File[]) => void;
}

const DropZone: FC<DropZoneProps> = ({onUpload}) => {
  const [visible, setVisible] = useState(false);

  React.useEffect(() => {
    let dragTimeout: number | null = null;

    const {body} = document;
    body.addEventListener('dragover', handleDragOver);
    body.addEventListener('drop', handleDrop);

    function handleDragOver(e: DragEvent) {
      if (!e.dataTransfer?.types.includes('Files')) return;
      e.preventDefault();

      setVisible(true);

      dragTimeout && clearTimeout(dragTimeout);
      dragTimeout = window.setTimeout(() => {
        setVisible(false);
      }, 150);
    }

    function handleDrop(e: DragEvent) {
      if (!e.dataTransfer?.types.includes('Files')) return;
      e.stopPropagation();
      e.preventDefault();
      const files = e.dataTransfer.files;
      if (files.length) {
        onUpload(Array.from(files));
      }
    }

    return () => {
      dragTimeout && clearTimeout(dragTimeout);
      body.removeEventListener('dragover', handleDragOver);
      body.removeEventListener('drop', handleDrop);
    };
  }, []);

  return (
    <Fade in={visible} unmountOnExit>
      <MyDiv>
        <UploadFileIcon color="primary" fontSize="large"/>
      </MyDiv>
    </Fade>
  );
};

export default DropZone;