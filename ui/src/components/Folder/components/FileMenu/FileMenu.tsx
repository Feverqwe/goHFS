import * as React from 'react';
import {FC, useContext, useMemo} from 'react';
import {Divider, Menu} from '@mui/material';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import HighlightAltIcon from '@mui/icons-material/HighlightAlt';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import {ExtAction, FileInfo} from '../../../../types';
import {api, apiUrl} from '../../../../tools/api';
import {SelectChangeSelectedCtx} from '../SelectProvider/SelectCtx';
import {unicLast} from '../../utils';
import {RootStoreUpdateCtx} from '../../../RootStore/RootStoreUpdateCtx';
import ActionBtn, {Item} from './ActionBtn';

interface DividerItem {
  isDivider: true;
}

interface FileDialogProps {
  writable: boolean;
  fileUrl: string;
  launchUrl?: string;
  file: FileInfo;
  dir: string;
  onClose: () => void;
  onRename: () => void;
  anchorEl: Element;
  customActions: ExtAction[];
}

const FileMenu: FC<FileDialogProps> = ({
  customActions,
  launchUrl,
  anchorEl,
  writable,
  onRename,
  onClose,
  fileUrl,
  file,
  dir,
}) => {
  const changeSelected = useContext(SelectChangeSelectedCtx);
  const updateStore = useContext(RootStoreUpdateCtx);

  const menu = useMemo<(Item | DividerItem)[]>(() => {
    const actions: (Item | DividerItem)[] = [];

    const dividerItem: DividerItem = {isDivider: true};

    if (launchUrl) {
      actions.push({
        id: 'open',
        label: 'Launch',
        icon: <RocketLaunchIcon />,
        href: launchUrl,
        newPage: true,
      });
    }

    actions.push({
      id: 'open',
      label: 'Open',
      icon: <OpenInNewIcon />,
      href: fileUrl,
      newPage: true,
    });

    if (customActions.length) {
      actions.push(dividerItem);
      customActions.forEach(({name, newPage}, index) => {
        actions.push({
          id: String(index),
          label: name,
          icon: <OpenInNewIcon />,
          href: apiUrl.extAction({
            place: dir,
            name: file.name,
            action: name,
          }),
          newPage,
        });
      });
    }

    if (writable) {
      actions.push(dividerItem);
      actions.push(
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
      );
    }

    return actions;
  }, [
    launchUrl,
    fileUrl,
    customActions,
    writable,
    dir,
    file,
    changeSelected,
    onRename,
    updateStore,
  ]);

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
