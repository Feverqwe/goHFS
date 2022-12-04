import {ReactNode} from 'react';

export enum DialogType {
  Confirm = 'confirm',
}

interface BaseDialog {
  title?: ReactNode;
  content?: ReactNode;
  cancelText?: string;
  okText?: string;
  onSubmit: () => Promise<void>;
}

export interface ConfirmDialog extends BaseDialog {
  type: DialogType.Confirm;
}

export type DialogData = ConfirmDialog;
