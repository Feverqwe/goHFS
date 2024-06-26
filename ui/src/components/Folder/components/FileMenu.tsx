import * as React from 'react';
import {FC, ReactNode, SyntheticEvent, useCallback, useContext, useMemo, useState} from 'react';
import {
  CircularProgress,
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  styled,
  Tooltip,
} from '@mui/material';
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
import {RootStoreUpdateCtx} from '../../RootStore/RootStoreUpdateCtx';

const MyListItemIcon = styled(ListItemIcon)(() => {
  return {
    justifyContent: 'flex-end',
  };
});

interface DividerItem {
  isDivider: true;
}

interface Item {
  id: string;
  label: string;
  icon: ReactNode;
  onSubmit?: () => Promise<void> | void;
  href?: string;
  newPage?: boolean;
}

interface FileDialogProps {
  writable: boolean;
  file: FileInfo;
  dir: string;
  onClose: () => void;
  onRename: () => void;
  anchorEl: Element;
  customActions: ExtAction[];
}

const FileMenu: FC<FileDialogProps> = ({
  anchorEl,
  writable,
  file,
  dir,
  onRename,
  onClose,
  customActions,
}) => {
  const changeSelected = useContext(SelectChangeSelectedCtx);
  const updateStore = useContext(RootStoreUpdateCtx);

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
      ...(customActions.length ? [{isDivider: true} as DividerItem] : []),
      ...(!writable
        ? []
        : [
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
              },
            },
            {
              id: 'rename',
              label: 'Rename',
              icon: <DriveFileRenameOutlineIcon />,
              onSubmit: () => {
                onRename();
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
                await updateStore();
              },
            },
          ]),
    ];
  }, [dir, file, updateStore, onRename, changeSelected, customActions, writable]);

  if (!menu.length) return null;

  return (
    <Menu anchorEl={anchorEl} open onClose={onClose}>
      {menu.map((item) => {
        if ('isDivider' in item) {
          return <Divider />;
        }

        return <ActionBtn key={item.id} item={item} onSuccess={onClose} />;
      })}
    </Menu>
  );
};

interface ActionBtnProps {
  item: Item;
  onSuccess: () => void;
}

const ActionBtn: FC<ActionBtnProps> = ({item, onSuccess}) => {
  const {label, icon, onSubmit, href, newPage} = item;
  const [loading, setLoading] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [error, setError] = useState<null | Error>(null);

  const handleClick = useCallback(
    async (e: SyntheticEvent) => {
      e.preventDefault();
      if (!onSubmit) return;

      try {
        setPressed(true);
        setLoading(true);
        await onSubmit();
        onSuccess();
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    },
    [onSubmit, onSuccess],
  );

  const handleLinkClick = useCallback(() => {
    onSuccess();
  }, [onSuccess]);

  const itemProps = useMemo(() => {
    if (href) {
      return {
        component: 'a',
        href,
        target: newPage ? '_blank' : undefined,
        onClick: handleLinkClick,
      };
    }
    return {onClick: handleClick};
  }, [handleClick, href, newPage, handleLinkClick]);

  return (
    <MenuItem {...itemProps} disabled={loading}>
      <ListItemIcon>{icon}</ListItemIcon>
      <ListItemText>{label}</ListItemText>
      {pressed && (
        <MyListItemIcon>
          {loading ? (
            <CircularProgress size={20} />
          ) : error ? (
            <Tooltip title={error.message}>
              <ErrorIcon color="error" />
            </Tooltip>
          ) : (
            <DoneIcon />
          )}
        </MyListItemIcon>
      )}
    </MenuItem>
  );
};

export default FileMenu;
