import * as React from 'react';
import {FC, ReactNode, SyntheticEvent, useCallback, useContext, useMemo, useState} from 'react';
import {CircularProgress, ListItemIcon, ListItemText, Menu, MenuItem, styled, Tooltip} from '@mui/material';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import ErrorIcon from '@mui/icons-material/Error';
import DoneIcon from '@mui/icons-material/Done';
import HighlightAltIcon from '@mui/icons-material/HighlightAlt';
import {FileInfo} from '../../../types';
import {api} from '../../../tools/api';
import {SelectChangeSelectedCtx} from './SelectProvider/SelectCtx';
import {unicLast} from '../utils';

const MyListItemIcon = styled(ListItemIcon)(() => {
  return {
    justifyContent: 'flex-end',
  };
});

interface Item {
  id: string;
  label: string;
  icon: ReactNode,
  onSubmit: () => Promise<void> | void,
}

interface FileDialogProps {
  file: FileInfo,
  dir: string,
  onClose: () => void,
  onRemoved: () => void,
  onRename: () => void,
  anchorEl: Element,
}

const FileMenu: FC<FileDialogProps> = ({anchorEl, file, dir, onRemoved, onRename, onClose}) => {
  const changeSelected = useContext(SelectChangeSelectedCtx);

  const menu = useMemo<Item[]>(() => {
    return [
      {
        id: 'select',
        label: 'Select',
        icon: <HighlightAltIcon />,
        onSubmit: () => {
          changeSelected((selected_) => {
            const selected = selected_.slice(0);
            const {name} = file;
            const pos = selected.indexOf(name);
            if (pos === -1) {
              selected.push(name);
            } else {
              selected.splice(pos, 1);
            }
            return unicLast(selected);
          });
          onClose();
        },
      },
      {
        id: 'rename',
        label: 'Rename',
        icon: <DriveFileRenameOutlineIcon />,
        onSubmit: () => {
          onRename();
          onClose();
        },
      },
      {
        id: 'remove',
        label: 'Delete',
        icon: <DeleteForeverIcon />,
        onSubmit: async () => {
          await api.remove({
            place: dir,
            name: file.name,
            isDir: file.isDir,
          });
          onRemoved();
          onClose();
        },
      },
    ];
  }, [dir, file, onRemoved, onRename, changeSelected, onClose]);

  return (
    <Menu anchorEl={anchorEl} open onClose={onClose}>
      {menu.map((item) => {
        return (
          <ActionBtn
            key={item.id}
            item={item}
          />
        );
      })}
    </Menu>
  );
};

interface ActionBtnProps {
  item: Item,
}

const ActionBtn: FC<ActionBtnProps> = ({item}) => {
  const {label, icon, onSubmit} = item;
  const [loading, setLoading] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [error, setError] = useState<null | Error>(null);

  const handleClick = useCallback(async (e: SyntheticEvent) => {
    e.preventDefault();

    try {
      setPressed(true);
      setLoading(true);
      await onSubmit();
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [onSubmit]);

  return (
    <MenuItem onClick={handleClick} disabled={loading}>
      <ListItemIcon>
        {icon}
      </ListItemIcon>
      <ListItemText>{label}</ListItemText>
      {pressed && (
        <MyListItemIcon>
          {loading ? (
            <CircularProgress size={20} />
          ) : error ? (
            <Tooltip title={error.message}>
              <ErrorIcon color="error" />
            </Tooltip>
          ) : <DoneIcon />}
        </MyListItemIcon>
      )}
    </MenuItem>
  );
};

export default FileMenu;
