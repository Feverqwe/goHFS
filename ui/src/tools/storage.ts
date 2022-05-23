import {doReq} from "./apiRequest";

class Storage {
  static get<T>(keys: string[]) {
    return doReq<T>('/~/storage/get', keys);
  }

  static async set(data: Record<string, any>) {
    await doReq('/~/storage/set', data);
  }
}

export default Storage;

