import * as React from 'react';
import {
  ArrowDropDown as ArrowDropDownIcon,
  ArrowDropUp as ArrowDropUpIcon,
} from '@mui/icons-material';
import {SyntheticEvent} from 'react';
import {DirSort} from '../../../../types';
import ActionButton from '../ActionButton/ActionButton';

interface SortBtnProps {
  type: string;
  name: string;
  active: boolean;
  direction: boolean;
  onClick: (prop: DirSort) => Promise<void>;
}

const SortButton = React.memo(({type, name, active, direction, onClick}: SortBtnProps) => {
  let icon;
  if (active && direction) {
    icon = <ArrowDropDownIcon />;
  } else {
    icon = <ArrowDropUpIcon />;
  }

  const handleClick = React.useCallback(
    async (e: SyntheticEvent) => {
      e.preventDefault();
      if (active) {
        await onClick({key: type, revers: !direction});
      } else {
        await onClick({key: type, revers: direction});
      }
    },
    [active, direction, onClick, type],
  );

  return (
    <ActionButton onSubmit={handleClick} variant={active ? 'contained' : 'outlined'} endIcon={icon}>
      {name}
    </ActionButton>
  );
});

export default SortButton;
