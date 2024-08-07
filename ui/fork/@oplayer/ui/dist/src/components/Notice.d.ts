import { UIInterface } from '../types';
declare const POS_CLS: {
    center: string;
    left: string;
    'top-left': string;
    top: string;
    'top-center': string;
    'top-right': string;
    right: string;
    bottom: string;
    'left-bottom': string;
};
declare const render: (it: UIInterface) => (text: string, pos?: keyof typeof POS_CLS) => void;
export default render;
//# sourceMappingURL=Notice.d.ts.map