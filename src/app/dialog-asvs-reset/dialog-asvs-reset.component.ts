import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-asvs-reset',
  templateUrl: './dialog-asvs-reset.component.html',
  styleUrls: ['./dialog-asvs-reset.component.scss'],
  standalone: false
})
export class DialogAsvsResetComponent {
  constructor(public dialogRef: MatDialogRef<DialogAsvsResetComponent>) {}

  cancel(): void {
    this.dialogRef.close(false);
  }

  confirm(): void {
    this.dialogRef.close(true);
  }
}
