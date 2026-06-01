import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { Button } from '../button/button';

export interface ConfirmDialogData {
  title: string;
  message?: string;
  confirmLabel?: string;
  variant?: 'primary' | 'danger';
}

@Component({
  selector: 'app-confirm-dialog',
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, Button],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialog {
  private dialogRef = inject(MatDialogRef<ConfirmDialog, boolean>);
  protected data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);

  protected get confirmLabel(): string {
    return this.data.confirmLabel ?? 'Conferma';
  }

  protected get variant(): 'primary' | 'danger' {
    return this.data.variant ?? 'primary';
  }

  protected cancel() {
    this.dialogRef.close(false);
  }

  protected confirm() {
    this.dialogRef.close(true);
  }
}
