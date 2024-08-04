export interface FileInfo {
  size: number;
  ctime: number;
  name: string;
  isDir: boolean;
  progress: number;
}

export interface ExtAction {
  name: string;
  url: string;
  newPage?: boolean;
}

export interface DirSort {
  key: string;
  revers: boolean;
}

export interface RootStore {
  dir: string;
  isRoot: boolean;
  isWritable: boolean;
  files: FileInfo[];
  extHandle: Partial<Record<string, string>>;
  extActions: Partial<Record<string, ExtAction[]>>;
  dirSort: DirSort | null;
  showHidden?: boolean;
}

export interface DiskUsage {
  path: string;
  fstype: string;
  total: number;
  free: number;
  used: number;
  usedPercent: number;
  inodesTotal: number;
  inodesUsed: number;
  inodesFree: number;
  inodesUsedPercent: number;
}
