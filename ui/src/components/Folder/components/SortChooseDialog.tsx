import * as React from 'react';
import {SyntheticEvent} from 'react';
import {Button, ButtonGroup, DialogContent} from '@mui/material';
import {
  ArrowDropDown as ArrowDropDownIcon,
  ArrowDropUp as ArrowDropUpIcon,
} from '@mui/icons-material';
import MyDialog from './MyDialog';

const keyName = {
  ctime: 'Create time',
  name: 'Name',
  size: 'Size',
};

type Key = [string, boolean];

interface SortChooseDialogProps {
  sortKey: Key;
  changeSort: (key: Key) => void;
  onClose: () => void;
}

const SortChooseDialog = React.memo(({sortKey, changeSort, onClose}: SortChooseDialogProps) => {
  const handleClose = React.useCallback(
    (e: SyntheticEvent) => {
      onClose();
    },
    [onClose],
  );

  const handleChangeSort = React.useCallback(
    (key: Key) => {
      changeSort(key);
    },
    [changeSort],
  );

  return (
    <MyDialog onClose={handleClose} open={true}>
      <DialogContent>
        <ButtonGroup orientation="vertical">
          {Object.entries(keyName).map(([type, name]) => {
            const [currentType, direction] = sortKey;
            return (
              <SortBtn
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
    </MyDialog>
  );
});

interface SortBtnProps {
  type: string;
  name: string;
  active: boolean;
  direction: boolean;
  onClick: (prop: Key) => void;
}

const SortBtn = React.memo(({type, name, active, direction, onClick}: SortBtnProps) => {
  let icon;
  if (active && direction) {
    icon = <ArrowDropUpIcon />;
  } else {
    icon = <ArrowDropDownIcon />;
  }

  const handleClick = React.useCallback(
    (e: SyntheticEvent) => {
      e.preventDefault();
      if (active) {
        onClick([type, !direction]);
      } else {
        onClick([type, direction]);
      }
    },
    [active, direction, onClick, type],
  );

  return (
    <Button onClick={handleClick} variant={active ? 'contained' : 'outlined'} endIcon={icon}>
      {name}
    </Button>
  );
});

export default SortChooseDialog;
