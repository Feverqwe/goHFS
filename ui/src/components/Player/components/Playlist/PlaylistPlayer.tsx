import React, {useEffect, useId, useMemo, useRef, useState} from 'react';
import {
  Box,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SearchIcon from '@mui/icons-material/Search';
import {defaultPlaylistSettings, type PlaylistEntry, type PlaylistSettings} from '../../playlist';
import Video2 from '../Video2/Video2';
import {formatTime} from '../Video2/utils';
import PlaylistToolbar from './PlaylistToolbar';

const collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});

interface PlaylistPlayerProps {
  playlist: readonly PlaylistEntry[];
  initialPositions?: Record<string, number>;
  initialTrack?: string;
  onTrackChange?: (url: string) => void;
  initialSettings?: PlaylistSettings;
  onSettingsChange?: (settings: PlaylistSettings) => void;
  autoplay?: boolean;
  persistPosition?: boolean;
}

function shuffleFrom(entries: readonly PlaylistEntry[], current: PlaylistEntry) {
  const rest = entries.filter((entry) => entry.url !== current.url);
  for (let i = rest.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return [current, ...rest];
}

function findAdjacent(
  order: readonly PlaylistEntry[],
  index: number,
  direction: -1 | 1,
  wrap: boolean,
  failed: ReadonlySet<string>,
) {
  if (index < 0) return undefined;

  for (let offset = 1; offset <= order.length; offset += 1) {
    const candidateIndex = index + direction * offset;
    const entry = order[wrap ? (candidateIndex + order.length) % order.length : candidateIndex];
    if (!entry) break;
    if (!failed.has(entry.url)) return entry;
  }
  return undefined;
}

export default function PlaylistPlayer({
  playlist,
  initialPositions = {},
  initialTrack,
  onTrackChange,
  initialSettings = defaultPlaylistSettings,
  onSettingsChange,
  autoplay = true,
  persistPosition,
}: PlaylistPlayerProps) {
  const panelId = useId();
  const [panelOpen, setPanelOpen] = useState(true);
  const [search, setSearch] = useState('');
  const [settings, setSettings] = useState(initialSettings);
  const {sort, repeat, shuffle, resume} = settings;
  const [playingUrl, setPlayingUrl] = useState<string>();
  const [failed, setFailed] = useState<ReadonlySet<string>>(() => new Set());
  const [positions, setPositions] = useState(initialPositions);
  const [durations, setDurations] = useState<Record<string, number | undefined>>({});
  const sorted = useMemo(() => {
    if (sort === 'original') return playlist;
    const sign = sort === 'name' ? 1 : -1;
    return [...playlist].sort((a, b) => sign * collator.compare(a.name, b.name));
  }, [playlist, sort]);
  const [playback, setPlayback] = useState(() => {
    const linkedEntry = playlist.find((entry) => entry.url === initialTrack);
    const url = (linkedEntry ?? sorted[0])?.url;
    const start = resume ? (initialPositions[url] ?? 0) : 0;
    return {url, start, revision: 0};
  });
  const [shuffled, setShuffled] = useState(() => {
    const entry = playlist.find(({url}) => url === playback.url);
    return shuffle && entry ? shuffleFrom(playlist, entry) : undefined;
  });
  const togglePlaybackRef = useRef<(() => void) | null>(null);
  const panelButtonRef = useRef<HTMLButtonElement>(null);
  const activeRowRef = useRef<HTMLButtonElement>(null);

  const order = shuffled ?? sorted;
  const current = playlist.find((entry) => entry.url === playback.url) ?? sorted[0];
  const currentUrl = current?.url;
  const startPosition = playback.url === currentUrl ? playback.start : 0;
  const index = order.findIndex((entry) => entry.url === current?.url);
  const previous = findAdjacent(order, index, -1, repeat === 'all', failed);
  const next = findAdjacent(order, index, 1, repeat === 'all', failed);
  const term = search.trim().toLocaleLowerCase();
  const visible = useMemo(
    () => sorted.filter((entry) => entry.name.toLocaleLowerCase().includes(term)),
    [sorted, term],
  );

  useEffect(() => {
    if (panelOpen && !term) activeRowRef.current?.scrollIntoView({block: 'nearest'});
  }, [current?.url, panelOpen, sorted, term]);

  useEffect(() => {
    if (currentUrl) onTrackChange?.(currentUrl);
  }, [currentUrl, onTrackChange]);

  if (!current) {
    return (
      <Typography role="status" sx={{p: 2}}>
        This playlist is empty.
      </Typography>
    );
  }

  const updateSettings = (patch: Partial<PlaylistSettings>) => {
    const updated = {...settings, ...patch};
    setSettings(updated);
    onSettingsChange?.(updated);
  };
  const handleShuffle = () => {
    setShuffled(shuffle ? undefined : shuffleFrom(playlist, current));
    updateSettings({shuffle: !shuffle});
  };
  const play = (entry: PlaylistEntry, restart = false) => {
    if (entry.url === current.url && !restart) return;
    setPlayingUrl(undefined);
    const start = resume && !restart ? (positions[entry.url] ?? 0) : 0;
    setPlayback(({revision}) => ({url: entry.url, start, revision: revision + 1}));
    if (
      shuffled &&
      entry.url !== previous?.url &&
      entry.url !== next?.url &&
      entry.url !== current.url
    ) {
      setShuffled(shuffleFrom(playlist, entry));
    }
  };
  const closePanel = () => {
    setPanelOpen(false);
    panelButtonRef.current?.focus();
  };
  const handleEnded = () => {
    if (repeat === 'one') play(current, true);
    else if (next) play(next, next.url === current.url);
  };
  const handlePlaybackError = () => {
    setPlayingUrl(undefined);
    setFailed((entries) => new Set(entries).add(current.url));
    if (next && next.url !== current.url) play(next);
  };
  const handleRowClick = (entry: PlaylistEntry) => {
    if (failed.has(entry.url)) {
      setFailed((entries) => {
        const updated = new Set(entries);
        updated.delete(entry.url);
        return updated;
      });
      play(entry, entry.url === current.url);
    } else if (entry.url === current.url) {
      togglePlaybackRef.current?.();
    } else {
      play(entry);
    }
  };
  const updatePosition = (position: number) => {
    setPositions((saved) => ({...saved, [current.url]: position}));
  };
  const updateDuration = (seconds: number) => {
    const duration = Number.isFinite(seconds) && seconds > 0 ? seconds : undefined;
    setDurations((saved) =>
      saved[current.url] === duration ? saved : {...saved, [current.url]: duration},
    );
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'grid',
        overflow: 'hidden',
        gridTemplateColumns: panelOpen
          ? {xs: 'minmax(0, 1fr)', md: 'minmax(0, 1fr) clamp(290px, 30vw, 420px)'}
          : 'minmax(0, 1fr)',
        gridTemplateRows: panelOpen
          ? {xs: 'minmax(104px, 46%) minmax(0, 1fr)', md: 'minmax(0, 1fr)'}
          : 'minmax(0, 1fr)',
      }}
    >
      <Box sx={{minWidth: 0, minHeight: 0, bgcolor: 'common.black', overflow: 'hidden'}}>
        <Video2
          key={`${current.url}-${playback.revision}`}
          url={current.url}
          metadata={startPosition}
          mediaTitle={current.name}
          autoplay={autoplay || playback.revision > 0}
          persistPosition={persistPosition}
          onPositionChange={updatePosition}
          onDurationChange={updateDuration}
          onPlayingChange={(playing) => setPlayingUrl(playing ? current.url : undefined)}
          onPlaybackError={handlePlaybackError}
          ref={togglePlaybackRef}
          onEnded={handleEnded}
          playlistControls={{
            panelId,
            panelOpen,
            toggleRef: panelButtonRef,
            onToggle: () => setPanelOpen((open) => !open),
            onPrevious: previous && (() => play(previous, previous.url === current.url)),
            onNext: next && (() => play(next, next.url === current.url)),
          }}
        />
      </Box>

      {panelOpen && (
        <Box
          id={panelId}
          component="aside"
          aria-label="Playlist"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            minHeight: 0,
            overflow: 'hidden',
            bgcolor: 'background.default',
          }}
        >
          <Box
            sx={{
              px: 1,
              py: 0.75,
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              flexShrink: 0,
            }}
          >
            <TextField
              type="search"
              size="small"
              placeholder="Find a file"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              sx={{
                flex: 1,
                minWidth: 0,
                '& .MuiInputBase-root': {height: 32},
                '& .MuiInputBase-input': {py: 0.5},
              }}
              slotProps={{
                htmlInput: {'aria-label': 'Find a file'},
                input: {
                  startAdornment: (
                    <InputAdornment position="start" sx={{mr: 0.75}}>
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Tooltip title="Close playlist">
              <IconButton aria-label="Close playlist" onClick={closePanel} size="small">
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <Box sx={{flex: 1, minHeight: 0, overflowY: 'auto'}}>
            {visible.length > 0 ? (
              <List dense disablePadding sx={{p: 0.75}} aria-label="Playlist files">
                {visible.map((entry) => {
                  const active = entry.url === current.url;
                  const duration = durations[entry.url];
                  const playing = entry.url === playingUrl;
                  const PlaybackIcon = playing ? PauseIcon : PlayArrowIcon;
                  const hasError = failed.has(entry.url);
                  let rowLabel: string | undefined;
                  if (hasError) rowLabel = `Retry ${entry.name}`;
                  else if (active) rowLabel = `${playing ? 'Pause' : 'Play'} ${entry.name}`;
                  return (
                    <ListItem key={entry.url} disablePadding>
                      <ListItemButton
                        component="button"
                        ref={active ? activeRowRef : undefined}
                        selected={active}
                        aria-current={active ? 'true' : undefined}
                        aria-label={rowLabel}
                        aria-description={
                          rowLabel && duration !== undefined
                            ? `Duration ${formatTime(duration)}`
                            : undefined
                        }
                        onClick={() => handleRowClick(entry)}
                        sx={{width: '100%', px: 1, py: 1, gap: 1, textAlign: 'left'}}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            width: 20,
                            flexShrink: 0,
                            color: 'primary.main',
                          }}
                        >
                          {hasError && (
                            <Tooltip title="Playback failed">
                              <ErrorOutlinedIcon color="warning" fontSize="small" />
                            </Tooltip>
                          )}
                          {active && !hasError && <PlaybackIcon fontSize="small" />}
                        </Box>
                        <Typography
                          variant="body2"
                          noWrap
                          sx={{flex: 1, fontWeight: active ? 600 : undefined}}
                          title={entry.name}
                        >
                          {entry.name}
                        </Typography>
                        {duration !== undefined && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{fontVariantNumeric: 'tabular-nums'}}
                          >
                            {formatTime(duration)}
                          </Typography>
                        )}
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            ) : (
              <Typography role="status" color="text.secondary" variant="body2" sx={{p: 2}}>
                No files match your search.
              </Typography>
            )}
          </Box>
          <PlaylistToolbar
            sort={sort}
            onSort={(value) => updateSettings({sort: value})}
            repeat={repeat}
            onRepeat={(value) => updateSettings({repeat: value})}
            shuffle={shuffle}
            onShuffle={handleShuffle}
            resume={resume}
            onResume={() => updateSettings({resume: !resume})}
          />
        </Box>
      )}
    </Box>
  );
}
