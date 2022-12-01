export interface FileInfo {
  size: number,
  ctime: number,
  name: string,
  isDir: boolean,
}

export interface RootStore {
  dir: string,
  isRoot: boolean,
  isWritable: boolean,
  files: FileInfo[],
  extHandle: Partial<Record<string, string>>,
}
