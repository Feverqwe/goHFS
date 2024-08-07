import React, {FC, SyntheticEvent} from 'react';
import {ButtonProps} from '@mui/material/Button/Button';
import {Button} from '@mui/material';
import useActionButton from '../../hooks/useActionButton';

export type ActionButtonProps = Omit<ButtonProps, 'onSubmit' | 'onClick'> & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (event: SyntheticEvent<any, any>) => Promise<void>;
};

const ActionButton: FC<ActionButtonProps> = ({onSubmit, children, ...props}) => {
  const {isLoading, handleSubmit, stateNode} = useActionButton({onSubmit});

  return (
    <Button {...props} disabled={isLoading || props.disabled} onClick={handleSubmit}>
      {children} {stateNode}
    </Button>
  );
};

export default ActionButton;
