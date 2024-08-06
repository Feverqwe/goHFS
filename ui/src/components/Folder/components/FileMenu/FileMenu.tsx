import * as React from 'react';
import {FC, useContext, useMemo} from 'react';
import {Divider, Menu} from '@mui/material';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import HighlightAltIcon from '@mui/icons-material/HighlightAlt';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import {ExtAction, FileInfo} from '../../../../types';
import {api} from '../../../../tools/api';
import {SelectChangeSelectedCtx} from '../SelectProvider/SelectCtx';
import {formatUrl, unicLast} from '../../utils';
import {RootStoreUpdateCtx} from '../../../RootStore/RootStoreUpdateCtx';
import ActionBtn, {Item} from './ActionBtn';

interface DividerItem {
  isDivider: true;
}

interface FileDialogProps {
  writable: boolean;
  fileUrl: string;
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
  fileUrl,
  file,
  dir,
  onRename,
  onClose,
  customActions,
}) => {
  const changeSelected = useContext(SelectChangeSelectedCtx);
  const updateStore = useContext(RootStoreUpdateCtx);

  const menu = useMemo<(Item | DividerItem)[]>(() => {
    const customActionMenu: (Item | DividerItem)[] = customActions.map(
      ({name, url, newPage}, index) => {
        return {
          id: String(index),
          label: name,
          icon: <OpenInNewIcon />,
          href: formatUrl(url, {dir, name: file.name}),
          newPage,
        };
      },
    );

    if (customActionMenu.length) {
      customActionMenu.push({isDivider: true});
    }

    return [
      {
        id: 'open',
        label: 'Open',
        icon: <OpenInNewIcon />,
        href: fileUrl,
      },
      {isDivider: true},
      ...customActionMenu,
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
  }, [customActions, fileUrl, writable, dir, file, changeSelected, onRename, updateStore]);

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

export default FileMenu;
