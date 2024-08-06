import {FC, ReactNode, SyntheticEvent, useCallback, useMemo, useState} from 'react';
import {
  CircularProgress,
  ListItemIcon,
  ListItemText,
  MenuItem,
  styled,
  Tooltip,
} from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';
import DoneIcon from '@mui/icons-material/Done';
import * as React from 'react';

export interface Item {
  id: string;
  label: string;
  icon: ReactNode;
  onSubmit?: () => Promise<void> | void;
  href?: string;
  newPage?: boolean;
}

const MyListItemIcon = styled(ListItemIcon)(() => {
  return {
    justifyContent: 'flex-end',
  };
});

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
      {icon && <ListItemIcon>{icon}</ListItemIcon>}
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

export default ActionBtn;
