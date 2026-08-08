import Hls, {type CuesParsedData} from 'hls.js';
import videojs from 'video.js';
import type Player from 'video.js/dist/types/player';
import type AudioTrack from 'video.js/dist/types/tracks/audio-track';
import type AudioTrackList from 'video.js/dist/types/tracks/audio-track-list';

interface TextCueLike {
  endTime: number;
  id?: string;
  startTime: number;
  text: string;
}

interface TextTrackLike {
  activeCues?: ArrayLike<{text: string}> | null;
  addCue: (cue: TextCueLike) => void;
  addEventListener: (type: string, listener: () => void) => void;
  kind: string;
  label?: string;
  language?: string;
  mode: 'disabled' | 'hidden' | 'showing';
  removeEventListener: (type: string, listener: () => void) => void;
}

interface TrackListLike<T> {
  readonly length: number;
  readonly [index: number]: T;
  addEventListener: (type: string, listener: (event: Event & {track?: T}) => void) => void;
  addTrack: (track: T) => void;
  removeEventListener: (type: string, listener: (event: Event & {track?: T}) => void) => void;
  removeTrack: (track: T) => void;
}

export interface TrackOption {
  index: number;
  label: string;
  selected: boolean;
}

export interface TrackController {
  cycleAudioTrack: () => void;
  cycleSubtitleTrack: () => void;
  dispose: () => void;
  getAudioTracks: () => TrackOption[];
  getSubtitleTracks: () => TrackOption[];
  selectAudioTrack: (index: number) => void;
  selectSubtitleTrack: (index: number | null) => void;
}

type IndexableAudioTrackList = AudioTrackList & {readonly [index: number]: AudioTrack};

export function createTrackController(
  player: Player,
  subtitleEl: HTMLElement,
  showNotice: (text: string) => void,
  hls?: Hls,
): TrackController {
  const audioTrackList = player.audioTracks() as IndexableAudioTrackList;
  const textTrackList = player.textTracks() as unknown as TrackListLike<TextTrackLike>;
  const playerSubtitleTracks = () => filterSubtitleTracks(textTrackList);

  const renderSubtitles = () => {
    subtitleEl.replaceChildren();
    playerSubtitleTracks().forEach((track) => {
      if (track.mode === 'disabled' || !track.activeCues) return;
      for (let index = 0; index < track.activeCues.length; index++) {
        const cue = track.activeCues[index];
        if (cue) appendCue(subtitleEl, cue.text);
      }
    });
  };
  const boundSubtitleTracks = new Set<TextTrackLike>();
  const bindSubtitleTrack = (track: TextTrackLike) => {
    if (boundSubtitleTracks.has(track)) return;
    boundSubtitleTracks.add(track);
    track.addEventListener('cuechange', renderSubtitles);
  };
  const onTextTrackAdded = (event: Event & {track?: TextTrackLike}) => {
    const {track} = event;
    if (!track || (track.kind !== 'subtitles' && track.kind !== 'captions')) return;
    bindSubtitleTrack(track);
    renderSubtitles();
  };

  const bridgedAudioTracks: AudioTrack[] = [];
  let isSyncingAudioTrack = false;
  const clearBridgedAudioTracks = () => {
    bridgedAudioTracks.splice(0).forEach((track) => audioTrackList.removeTrack(track));
  };
  const syncSelectedAudioTrack = () => {
    if (!hls) return;
    isSyncingAudioTrack = true;
    bridgedAudioTracks.forEach((track, index) => {
      track.enabled = hls.audioTrack === index;
    });
    isSyncingAudioTrack = false;
  };
  const syncAudioTracks = () => {
    if (!hls) return;
    clearBridgedAudioTracks();
    hls.audioTracks.forEach((track, index) => {
      const audioTrack = new videojs.AudioTrack({
        enabled: hls.audioTrack === index,
        id: `hls-audio-${index}`,
        kind: index === 0 ? 'main' : 'alternative',
        label: track.name || track.lang || `Track ${index}`,
        language: track.lang || '',
      });
      bridgedAudioTracks.push(audioTrack);
      audioTrackList.addTrack(audioTrack);
    });
  };
  const onAudioTrackListChange = () => {
    if (!hls || isSyncingAudioTrack) return;
    const enabledIndex = bridgedAudioTracks.findIndex((track) => track.enabled);
    if (enabledIndex >= 0 && hls.audioTrack !== enabledIndex) hls.audioTrack = enabledIndex;
  };

  const proxySubtitleTracks: TextTrackLike[] = [];
  const proxySubtitleCueKeys: Set<string>[] = [];
  let isSyncingSubtitleTrack = false;
  const clearProxySubtitleTracks = () => {
    proxySubtitleCueKeys.splice(0);
    proxySubtitleTracks.splice(0).forEach((track) => {
      track.removeEventListener('cuechange', renderSubtitles);
      boundSubtitleTracks.delete(track);
      textTrackList.removeTrack(track);
    });
    renderSubtitles();
  };
  const syncSelectedSubtitleTrack = () => {
    if (!hls) return;
    isSyncingSubtitleTrack = true;
    proxySubtitleTracks.forEach((track, index) => {
      track.mode = hls.subtitleTrack === index ? 'showing' : 'disabled';
    });
    isSyncingSubtitleTrack = false;
    renderSubtitles();
  };
  const syncSubtitleTracks = () => {
    if (!hls) return;
    clearProxySubtitleTracks();
    hls.subtitleTracks.forEach((track, index) => {
      const proxyTrack = new videojs.TextTrack({
        tech: player.tech(true),
        kind: 'subtitles',
        label: track.name || track.lang || `Track ${index}`,
        language: track.lang || '',
        mode: hls.subtitleTrack === index ? 'showing' : 'disabled',
      } as ConstructorParameters<typeof videojs.TextTrack>[0]) as unknown as TextTrackLike;
      proxySubtitleTracks.push(proxyTrack);
      proxySubtitleCueKeys.push(new Set());
      bindSubtitleTrack(proxyTrack);
      textTrackList.addTrack(proxyTrack);
    });
  };
  const onTextTrackChange = () => {
    if (isSyncingSubtitleTrack) return;
    if (hls) {
      const selectedIndex = proxySubtitleTracks.findIndex((track) => track.mode === 'showing');
      if (hls.subtitleTrack !== selectedIndex) hls.subtitleTrack = selectedIndex;
    }
    renderSubtitles();
  };
  const onCuesParsed = (_event: typeof Hls.Events.CUES_PARSED, data: CuesParsedData) => {
    if (!hls || data.type !== 'subtitles') return;
    const trackMatch = /^subtitles(\d+)$/.exec(data.track);
    const trackIndex = trackMatch ? Number(trackMatch[1]) : hls.subtitleTrack;
    const proxyTrack = proxySubtitleTracks[trackIndex];
    const cueKeys = proxySubtitleCueKeys[trackIndex];
    if (!proxyTrack || !cueKeys || !Array.isArray(data.cues)) return;

    (data.cues as TextCueLike[]).forEach((cue) => {
      const cueKey = cue.id || `${cue.startTime}:${cue.endTime}:${cue.text}`;
      if (cueKeys.has(cueKey)) return;
      cueKeys.add(cueKey);
      proxyTrack.addCue(cue);
    });
  };

  playerSubtitleTracks().forEach(bindSubtitleTrack);
  textTrackList.addEventListener('addtrack', onTextTrackAdded);
  textTrackList.addEventListener('change', onTextTrackChange);
  if (hls) {
    audioTrackList.addEventListener('change', onAudioTrackListChange);
    hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, syncAudioTracks);
    hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, syncSelectedAudioTrack);
    hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, syncSubtitleTracks);
    hls.on(Hls.Events.SUBTITLE_TRACK_SWITCH, syncSelectedSubtitleTrack);
    hls.on(Hls.Events.CUES_PARSED, onCuesParsed);
  }

  return {
    cycleAudioTrack: () => {
      if (!audioTrackList.length) return;
      let enabledIndex = -1;
      for (let index = 0; index < audioTrackList.length; index++) {
        if (audioTrackList[index]?.enabled) enabledIndex = index;
      }
      const nextIndex = (enabledIndex + 1) % audioTrackList.length;
      for (let index = 0; index < audioTrackList.length; index++) {
        const track = audioTrackList[index];
        if (track) track.enabled = index === nextIndex;
      }
      showNotice(`Audio ${nextIndex}: ${trackLabel(audioTrackList[nextIndex], nextIndex)}`);
    },
    cycleSubtitleTrack: () => {
      const tracks = playerSubtitleTracks();
      if (!tracks.length) return;
      const showingIndex = tracks.findIndex((track) => track.mode === 'showing');
      const nextIndex = showingIndex === tracks.length - 1 ? -1 : showingIndex + 1;
      tracks.forEach((track, index) => {
        track.mode = index === nextIndex ? 'showing' : 'disabled';
      });
      if (hls) hls.subtitleTrack = nextIndex;
      showNotice(
        nextIndex < 0
          ? 'Subtitles: Disabled'
          : `Stream ${nextIndex}: ${trackLabel(tracks[nextIndex], nextIndex)}`,
      );
      renderSubtitles();
    },
    getAudioTracks: () => {
      const tracks: TrackOption[] = [];
      for (let index = 0; index < audioTrackList.length; index++) {
        const track = audioTrackList[index];
        if (track) {
          tracks.push({index, label: trackLabel(track, index), selected: track.enabled});
        }
      }
      return tracks;
    },
    getSubtitleTracks: () =>
      playerSubtitleTracks().map((track, index) => ({
        index,
        label: trackLabel(track, index),
        selected: track.mode === 'showing',
      })),
    selectAudioTrack: (selectedIndex: number) => {
      if (selectedIndex < 0 || selectedIndex >= audioTrackList.length) return;
      for (let index = 0; index < audioTrackList.length; index++) {
        const track = audioTrackList[index];
        if (track) track.enabled = index === selectedIndex;
      }
      showNotice(
        `Audio ${selectedIndex}: ${trackLabel(audioTrackList[selectedIndex], selectedIndex)}`,
      );
    },
    selectSubtitleTrack: (selectedIndex: number | null) => {
      const tracks = playerSubtitleTracks();
      const normalizedIndex = selectedIndex ?? -1;
      if (normalizedIndex < -1 || normalizedIndex >= tracks.length) return;
      tracks.forEach((track, index) => {
        track.mode = index === normalizedIndex ? 'showing' : 'disabled';
      });
      if (hls) hls.subtitleTrack = normalizedIndex;
      showNotice(
        normalizedIndex < 0
          ? 'Subtitles: Disabled'
          : `Stream ${normalizedIndex}: ${trackLabel(tracks[normalizedIndex], normalizedIndex)}`,
      );
      renderSubtitles();
    },
    dispose: () => {
      textTrackList.removeEventListener('addtrack', onTextTrackAdded);
      textTrackList.removeEventListener('change', onTextTrackChange);
      if (hls) {
        hls.off(Hls.Events.AUDIO_TRACKS_UPDATED, syncAudioTracks);
        hls.off(Hls.Events.AUDIO_TRACK_SWITCHED, syncSelectedAudioTrack);
        hls.off(Hls.Events.SUBTITLE_TRACKS_UPDATED, syncSubtitleTracks);
        hls.off(Hls.Events.SUBTITLE_TRACK_SWITCH, syncSelectedSubtitleTrack);
        hls.off(Hls.Events.CUES_PARSED, onCuesParsed);
        audioTrackList.removeEventListener('change', onAudioTrackListChange);
      }
      clearBridgedAudioTracks();
      clearProxySubtitleTracks();
      boundSubtitleTracks.forEach((track) => {
        track.removeEventListener('cuechange', renderSubtitles);
      });
      boundSubtitleTracks.clear();
    },
  };
}

function filterSubtitleTracks(tracks: TrackListLike<TextTrackLike>): TextTrackLike[] {
  const subtitles: TextTrackLike[] = [];
  for (let index = 0; index < tracks.length; index++) {
    const track = tracks[index];
    if (track && (track.kind === 'subtitles' || track.kind === 'captions')) {
      subtitles.push(track);
    }
  }
  return subtitles;
}

function appendCue(subtitleEl: HTMLElement, text: string) {
  text
    .replace(/\\h/g, '\u00a0')
    .split(/\r?\n/)
    .forEach((line) => {
      const paragraphEl = document.createElement('p');
      const lineEl = document.createElement('span');
      lineEl.textContent = line;
      paragraphEl.appendChild(lineEl);
      subtitleEl.appendChild(paragraphEl);
    });
}

function trackLabel(track: object, index: number): string {
  const labeledTrack = track as {label?: string; language?: string};
  return labeledTrack.label || labeledTrack.language || `Track ${index}`;
}
