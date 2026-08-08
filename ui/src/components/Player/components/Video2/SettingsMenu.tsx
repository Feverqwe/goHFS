import React, {FC, KeyboardEvent, useEffect, useRef, useState} from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ClosedCaption,
  Fullscreen,
  FullscreenExit,
  GraphicEq,
  PictureInPictureAlt,
  SlowMotionVideo,
} from '@mui/icons-material';
import {ListItemIcon, ListItemText, Menu, MenuItem} from '@mui/material';
import type Player from 'video.js/dist/types/player';
import {PLAYBACK_RATES} from './constants';
import type {TrackController, TrackOption} from './tracks';

type MenuSection = 'audio' | 'speed' | 'subtitles';
type MenuView = 'main' | MenuSection;

interface SettingsMenuProps {
  anchorEl: HTMLElement | null;
  container: HTMLElement | null;
  onClose: () => void;
  player?: Player;
  trackController?: TrackController;
}

interface SelectableItemProps {
  label: string;
  onClick: () => void;
  selected: boolean;
}

const SelectableItem: FC<SelectableItemProps> = ({label, onClick, selected}) => (
  <MenuItem data-settings-option onClick={onClick} selected={selected}>
    <ListItemIcon>{selected ? <Check fontSize="small" /> : null}</ListItemIcon>
    <ListItemText>{label}</ListItemText>
  </MenuItem>
);

const SettingsMenu: FC<SettingsMenuProps> = ({
  anchorEl,
  container,
  onClose,
  player,
  trackController,
}) => {
  const [view, setView] = useState<MenuView>('main');
  const [, setRevision] = useState(0);
  const lastSectionRef = useRef<MenuSection>('subtitles');
  const menuListRef = useRef<HTMLUListElement>(null);

  const openSection = (section: MenuSection) => {
    lastSectionRef.current = section;
    setView(section);
  };
  const returnToMain = () => setView('main');

  useEffect(() => {
    if (!anchorEl) setView('main');
  }, [anchorEl]);

  useEffect(() => {
    if (!anchorEl) return;

    const list = menuListRef.current;
    const preferredTarget =
      view === 'main'
        ? list?.querySelector<HTMLElement>(`[data-settings-view="${lastSectionRef.current}"]`)
        : (list?.querySelector<HTMLElement>('[data-settings-option].Mui-selected') ??
          list?.querySelector<HTMLElement>('[data-settings-option]'));
    const fallbackTarget = list?.querySelector<HTMLElement>(
      '[role="menuitem"]:not([aria-disabled="true"])',
    );
    const focusTarget =
      preferredTarget?.getAttribute('aria-disabled') === 'true' ? fallbackTarget : preferredTarget;
    focusTarget?.focus();
  }, [anchorEl, view]);

  useEffect(() => {
    if (!player) return undefined;

    const updateMenu = () => setRevision((value) => value + 1);
    const playerEvents = [
      'enterpictureinpicture',
      'fullscreenchange',
      'leavepictureinpicture',
      'ratechange',
      'texttrackchange',
    ];
    const trackEvents = ['addtrack', 'change', 'removetrack'];
    const audioTrackList = player.audioTracks();
    const textTrackList = player.textTracks();

    player.on(playerEvents, updateMenu);
    audioTrackList.on(trackEvents, updateMenu);
    textTrackList.on(trackEvents, updateMenu);

    return () => {
      player.off(playerEvents, updateMenu);
      audioTrackList.off(trackEvents, updateMenu);
      textTrackList.off(trackEvents, updateMenu);
    };
  }, [player]);

  const audioTracks = trackController?.getAudioTracks() ?? [];
  const subtitleTracks = trackController?.getSubtitleTracks() ?? [];
  const currentAudio = audioTracks.find(({selected}) => selected)?.label;
  const currentSubtitle = subtitleTracks.find(({selected}) => selected)?.label ?? 'Off';
  const playbackRate = player?.playbackRate() ?? 1;
  const isFullscreen = player?.isFullscreen() ?? false;
  const isPictureInPicture = player?.isInPictureInPicture() ?? false;
  const isPictureInPictureSupported = Boolean(
    player &&
    document.pictureInPictureEnabled &&
    typeof document.exitPictureInPicture === 'function' &&
    player.disablePictureInPicture() === false,
  );

  const selectAudioTrack = (track: TrackOption) => {
    trackController?.selectAudioTrack(track.index);
    setRevision((value) => value + 1);
    setView('main');
  };
  const selectSubtitleTrack = (index: number | null) => {
    trackController?.selectSubtitleTrack(index);
    setRevision((value) => value + 1);
    setView('main');
  };
  const selectPlaybackRate = (rate: number) => {
    player?.playbackRate(rate);
    setRevision((value) => value + 1);
    setView('main');
  };
  const toggleFullscreen = () => {
    if (!player) return;
    onClose();
    const operation = player.isFullscreen() ? player.exitFullscreen() : player.requestFullscreen();
    operation.catch((error: unknown) => console.error('fullscreen error: %O', error));
  };
  const togglePictureInPicture = () => {
    if (!player || !isPictureInPictureSupported) return;
    onClose();
    const operation = player.isInPictureInPicture()
      ? player.exitPictureInPicture()
      : player.requestPictureInPicture();
    operation.catch((error: unknown) => console.error('picture-in-picture error: %O', error));
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (view !== 'main' && ['ArrowLeft', 'Backspace', 'Escape'].includes(event.key)) {
      event.preventDefault();
      event.stopPropagation();
      returnToMain();
      return;
    }
    if (view !== 'main' || event.key !== 'ArrowRight') return;

    const target = event.target as HTMLElement;
    const section = target.closest<HTMLElement>('[data-settings-view]')?.dataset.settingsView;
    if (section === 'audio' || section === 'speed' || section === 'subtitles') {
      event.preventDefault();
      event.stopPropagation();
      openSection(section);
    }
  };

  const backItem = (title: string) => (
    <MenuItem data-settings-back onClick={returnToMain}>
      <ListItemIcon>
        <ChevronLeft fontSize="small" />
      </ListItemIcon>
      <ListItemText>{title}</ListItemText>
    </MenuItem>
  );

  return (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{horizontal: 'right', vertical: 'top'}}
      className="vjs-settings-menu"
      container={container}
      onClick={(event) => event.stopPropagation()}
      onClose={onClose}
      onKeyDownCapture={handleKeyDown}
      open={Boolean(anchorEl && player && trackController)}
      slotProps={{
        list: {dense: true, ref: menuListRef},
        paper: {
          sx: {mb: 1, minWidth: 260},
        },
      }}
      transformOrigin={{horizontal: 'right', vertical: 'bottom'}}
    >
      {view === 'main' ? (
        <>
          {subtitleTracks.length ? (
            <MenuItem data-settings-view="subtitles" onClick={() => openSection('subtitles')}>
              <ListItemIcon>
                <ClosedCaption fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Subtitles" secondary={currentSubtitle} />
              <ChevronRight fontSize="small" />
            </MenuItem>
          ) : null}
          {audioTracks.length ? (
            <MenuItem data-settings-view="audio" onClick={() => openSection('audio')}>
              <ListItemIcon>
                <GraphicEq fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Audio" secondary={currentAudio} />
              <ChevronRight fontSize="small" />
            </MenuItem>
          ) : null}
          <MenuItem data-settings-view="speed" onClick={() => openSection('speed')}>
            <ListItemIcon>
              <SlowMotionVideo fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Playback speed" secondary={`${playbackRate}×`} />
            <ChevronRight fontSize="small" />
          </MenuItem>
          <MenuItem onClick={toggleFullscreen}>
            <ListItemIcon>
              {isFullscreen ? <FullscreenExit fontSize="small" /> : <Fullscreen fontSize="small" />}
            </ListItemIcon>
            <ListItemText>{isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}</ListItemText>
          </MenuItem>
          {isPictureInPictureSupported ? (
            <MenuItem onClick={togglePictureInPicture}>
              <ListItemIcon>
                <PictureInPictureAlt fontSize="small" />
              </ListItemIcon>
              <ListItemText>
                {isPictureInPicture ? 'Exit Picture-in-Picture' : 'Picture-in-Picture'}
              </ListItemText>
            </MenuItem>
          ) : null}
        </>
      ) : null}

      {view === 'subtitles' ? (
        <>
          {backItem('Subtitles')}
          <SelectableItem
            label="Off"
            onClick={() => selectSubtitleTrack(null)}
            selected={!subtitleTracks.some(({selected}) => selected)}
          />
          {subtitleTracks.map((track) => (
            <SelectableItem
              key={track.index}
              label={track.label}
              onClick={() => selectSubtitleTrack(track.index)}
              selected={track.selected}
            />
          ))}
        </>
      ) : null}

      {view === 'audio' ? (
        <>
          {backItem('Audio')}
          {audioTracks.map((track) => (
            <SelectableItem
              key={track.index}
              label={track.label}
              onClick={() => selectAudioTrack(track)}
              selected={track.selected}
            />
          ))}
        </>
      ) : null}

      {view === 'speed' ? (
        <>
          {backItem('Playback speed')}
          {PLAYBACK_RATES.map((rate) => (
            <SelectableItem
              key={rate}
              label={`${rate}×`}
              onClick={() => selectPlaybackRate(rate)}
              selected={rate === playbackRate}
            />
          ))}
        </>
      ) : null}
    </Menu>
  );
};

export default SettingsMenu;
