import * as React from 'react';
import {ChangeEvent, FC, memo, useCallback, useContext} from 'react';
import {Box, Checkbox} from '@mui/material';
import {SelectChangeSelectedCtx, SelectSelectedCtx} from '../../SelectProvider/SelectCtx';

interface SelectBoxProps {
  name: string;
}

const SelectBox: FC<SelectBoxProps> = ({name}) => {
  const selected = useContext(SelectSelectedCtx);
  const changeSelect = useContext(SelectChangeSelectedCtx);

  const handleSelect = useCallback((e: ChangeEvent, checked: boolean) => {
    changeSelect((prevIds) => {
      const pos = prevIds.indexOf(name);
      const ids = prevIds.slice(0);
      if (checked) {
        pos === -1 && ids.push(name);
      } else {
        pos !== -1 && ids.splice(pos, 1);
      }
      return ids;
    });
  }, [name, changeSelect]);

  return (
    <Box display="flex" alignItems="center">
      <Checkbox size={"small"} checked={selected.includes(name)} onChange={handleSelect} />
    </Box>
  );
};

export default memo(SelectBox);
