import type { Lang } from '../types';
export default class I18n {
    lang: Lang;
    private languages;
    constructor(defaultLang: Lang);
    get(key: string, ...arg: Array<string | number>): string;
    update(languages: Partial<Record<Lang, any>>): void;
}
//# sourceMappingURL=index.d.ts.map