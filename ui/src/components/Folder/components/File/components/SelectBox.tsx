import * as React from 'react';
import {ChangeEvent, FC, memo, SyntheticEvent, useCallback, useContext} from 'react';
import {Box, Checkbox} from '@mui/material';
import {SelectChangeSelectedCtx, SelectSelectedCtx} from '../../SelectProvider/SelectCtx';
import {unicLast} from '../../../utils';

interface SelectBoxProps {
  name: string;
}

const SelectBox: FC<SelectBoxProps> = ({name}) => {
  const selected = useContext(SelectSelectedCtx);
  const changeSelect = useContext(SelectChangeSelectedCtx);

  const handleSelect = useCallback(
    (
      e: SyntheticEvent<HTMLInputElement, MouseEvent> | ChangeEvent<HTMLInputElement>,
      checked: boolean,
    ) => {
      const isShift = 'shiftKey' in e.nativeEvent ? e.nativeEvent.shiftKey : false;

      changeSelect((selected_, files) => {
        const selected = selected_.slice(0);
        const pos = selected.indexOf(name);
        if (isShift) {
          const names = files.map((file) => file.name);
          const startIndex = names.indexOf(selected[selected.length - 1] ?? names[0]);
          const endIndex = names.indexOf(name);
          const min = Math.min(startIndex, endIndex);
          const max = Math.max(startIndex, endIndex);
          for (let i = min; i <= max; i++) {
            const name = names[i];
            if (checked) {
              selected.push(name);
            } else {
              const pos = selected.indexOf(name);
              if (pos !== -1) {
                selected.splice(pos, 1);
              }
            }
          }
        } else if (checked) {
          selected.push(name);
        } else {
          selected.splice(pos, 1);
        }
        return unicLast(selected);
      });
    },
    [name, changeSelect],
  );

  return (
    <Box display="flex" alignItems="center">
      <Checkbox size="small" checked={selected.includes(name)} onChange={handleSelect} />
    </Box>
  );
};

export default memo(SelectBox);
