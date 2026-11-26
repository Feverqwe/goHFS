import React, {useId, useState} from 'react';
import {Box, IconButton, Menu, MenuItem, Tooltip} from '@mui/material';
import RepeatIcon from '@mui/icons-material/Repeat';
import RepeatOneIcon from '@mui/icons-material/RepeatOne';
import RestoreIcon from '@mui/icons-material/Restore';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import SortIcon from '@mui/icons-material/Sort';
import type {PlaylistRepeat, PlaylistSort} from '../../playlist';

const sortOptions: Record<PlaylistSort, string> = {
  original: 'Folder order',
  name: 'Name A–Z',
  nameDescending: 'Name Z–A',
};

const repeatOptions = {
  off: {label: 'Repeat off', next: 'all'},
  all: {label: 'Repeat playlist', next: 'one'},
  one: {label: 'Repeat current file', next: 'off'},
} as const;

interface PlaylistToolbarProps {
  sort: PlaylistSort;
  onSort: (sort: PlaylistSort) => void;
  repeat: PlaylistRepeat;
  onRepeat: (repeat: PlaylistRepeat) => void;
  shuffle: boolean;
  onShuffle: () => void;
  resume: boolean;
  onResume: () => void;
}

export default function PlaylistToolbar({
  sort,
  onSort,
  repeat,
  onRepeat,
  shuffle,
  onShuffle,
  resume,
  onResume,
}: PlaylistToolbarProps) {
  const sortButtonId = useId();
  const menuId = useId();
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
  const repeatOption = repeatOptions[repeat];

  return (
    <Box
      role="group"
      aria-label="Playlist controls"
      sx={{
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
        gap: 0.5,
        px: 1,
        py: 0.5,
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        '& .MuiIconButton-root[aria-pressed=true]': {
          color: 'primary.main',
          bgcolor: 'action.selected',
        },
      }}
    >
      <Tooltip title={`Sort by · ${sortOptions[sort]}`}>
        <IconButton
          id={sortButtonId}
          aria-label="Sort playlist"
          aria-haspopup="menu"
          aria-expanded={Boolean(anchor)}
          aria-controls={anchor ? menuId : undefined}
          onClick={(event) => setAnchor(event.currentTarget)}
        >
          <SortIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{vertical: 'top', horizontal: 'left'}}
        transformOrigin={{vertical: 'bottom', horizontal: 'left'}}
        slotProps={{list: {id: menuId, 'aria-labelledby': sortButtonId}}}
      >
        {(Object.keys(sortOptions) as PlaylistSort[]).map((option) => (
          <MenuItem
            key={option}
            role="menuitemradio"
            aria-checked={sort === option}
            selected={sort === option}
            onClick={() => {
              onSort(option);
              setAnchor(null);
            }}
          >
            {sortOptions[option]}
          </MenuItem>
        ))}
      </Menu>
      <Tooltip title="Shuffle playback">
        <IconButton aria-label="Shuffle playback" aria-pressed={shuffle} onClick={onShuffle}>
          <ShuffleIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title={repeatOption.label}>
        <IconButton
          aria-label={repeatOption.label}
          aria-pressed={repeat !== 'off'}
          onClick={() => onRepeat(repeatOption.next)}
        >
          {repeat === 'one' ? <RepeatOneIcon fontSize="small" /> : <RepeatIcon fontSize="small" />}
        </IconButton>
      </Tooltip>
      <Tooltip title={resume ? 'Resume from last position' : 'Start from the beginning'}>
        <IconButton aria-label="Resume from last position" aria-pressed={resume} onClick={onResume}>
          {resume ? <RestoreIcon fontSize="small" /> : <RestartAltIcon fontSize="small" />}
        </IconButton>
      </Tooltip>
    </Box>
  );
}
