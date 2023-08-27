import * as React from 'react';
import {FC, ReactNode, SyntheticEvent, useCallback, useContext, useMemo, useState} from 'react';
import {CircularProgress, Divider, ListItemIcon, ListItemText, Menu, MenuItem, styled, Tooltip} from '@mui/material';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import ErrorIcon from '@mui/icons-material/Error';
import DoneIcon from '@mui/icons-material/Done';
import HighlightAltIcon from '@mui/icons-material/HighlightAlt';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import {ExtAction, FileInfo} from '../../../types';
import {api} from '../../../tools/api';
import {SelectChangeSelectedCtx} from './SelectProvider/SelectCtx';
import {formatUrl, unicLast} from '../utils';

const MyListItemIcon = styled(ListItemIcon)(() => {
  return {
    justifyContent: 'flex-end',
  };
});

interface DividerItem {
  isDivider: true
}

interface Item {
  id: string;
  label: string;
  icon: ReactNode,
  onSubmit?: () => Promise<void> | void,
  href?: string;
  newPage?: boolean;
}

interface FileDialogProps {
  writable: boolean;
  file: FileInfo,
  dir: string,
  onClose: () => void,
  onRemoved: () => void,
  onRename: () => void,
  anchorEl: Element,
  customActions: ExtAction[],
}

const FileMenu: FC<FileDialogProps> = ({anchorEl, writable, file, dir, onRemoved, onRename, onClose, customActions}) => {
  const changeSelected = useContext(SelectChangeSelectedCtx);

  const menu = useMemo<(Item | DividerItem)[]>(() => {
    return [
      ...customActions.map(({name, url, newPage}, index) => {
        return {
          id: String(index),
          label: name,
          icon: <OpenInNewIcon />,
          href: formatUrl(url, {dir, name: file.name}),
          newPage,
        };
      }),
      ...(customActions.length ? [
        {isDivider: true} as DividerItem,
      ] : []),
      ...(!writable ? [] : [
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
      ]),
    ];
  }, [dir, file, onRemoved, onRename, changeSelected, onClose, customActions, writable]);

  if (!menu.length) return null;

  return (
    <Menu anchorEl={anchorEl} open onClose={onClose}>
      {menu.map((item) => {
        if ('isDivider' in item) {
          return (<Divider />);
        }

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
  const {label, icon, onSubmit, href, newPage} = item;
  const [loading, setLoading] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [error, setError] = useState<null | Error>(null);

  const handleClick = useCallback(async (e: SyntheticEvent) => {
    e.preventDefault();
    if (!onSubmit) return;

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

  const itemProps = useMemo(() => {
    if (href) {
      return {component: 'a', href, target: newPage ? '_blank' : undefined};
    }
    return {onClick: handleClick};
  }, [handleClick, href, newPage]);

  return (
    <MenuItem {...itemProps} disabled={loading}>
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
