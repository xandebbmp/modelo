export type ConfirmDialogType = 'danger' | 'warning' | 'export' | 'info' | 'financial';

export interface ConfirmDialogDetail {
  label: string;
  value: string;
  highlight?: boolean;
}

export interface ConfirmDialogHighlightItem {
  title: string;
  subtitle?: string;
  badge?: string;
}

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  description?: string;
  type?: ConfirmDialogType;
  icon?: string;
  confirmText?: string;
  cancelText?: string;
  badgeText?: string;
  highlightItem?: ConfirmDialogHighlightItem;
  details?: ConfirmDialogDetail[];
  securityNote?: string;
  riskWarning?: string;
}
