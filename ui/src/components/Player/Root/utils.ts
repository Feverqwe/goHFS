import {getUrlParams} from "../../../tools/urlParams";

export function getParamsFromUrl() {
  const {url: rawUrl, time: rawTime} = getUrlParams();
  const url = typeof rawUrl === 'string' ? rawUrl : '';
  const time = Number(rawTime) || 0;
  return {url, time};
}