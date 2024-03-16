export interface FileInfo {
  size: number;
  ctime: number;
  name: string;
  isDir: boolean;
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
