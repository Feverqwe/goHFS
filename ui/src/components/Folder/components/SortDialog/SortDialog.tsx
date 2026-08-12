import * as React from 'react';
import {SyntheticEvent} from 'react';
import {ButtonGroup, Dialog, DialogContent} from '@mui/material';

import {DirSort} from '../../../../types';
import SortButton from './SortButton';

const keyName = {
  ctime: 'Create time',
  name: 'Name',
  size: 'Size',
  random: 'Random',
};

interface SortChooseDialogProps {
  sortKey: DirSort;
  changeSort: (key: DirSort) => Promise<void>;
  onClose: () => void;
}

const SortDialog = React.memo(({sortKey, changeSort, onClose}: SortChooseDialogProps) => {
  const handleClose = React.useCallback(
    (e: SyntheticEvent) => {
      onClose();
    },
    [onClose],
  );

  const handleChangeSort = React.useCallback(
    async (key: DirSort) => {
      await changeSort(key);
    },
    [changeSort],
  );

  return (
    <Dialog onClose={handleClose} open={true}>
      <DialogContent>
        <ButtonGroup orientation="vertical">
          {Object.entries(keyName).map(([type, name]) => {
            const {key: currentType, revers: direction} = sortKey;
            return (
              <SortButton
                key={type}
                type={type}
                name={name}
                active={currentType === type}
                direction={direction}
                onClick={handleChangeSort}
              />
            );
          })}
        </ButtonGroup>
      </DialogContent>
    </Dialog>
  );
});

export default SortDialog;
