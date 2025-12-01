import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { KmService } from 'src/app/services/KmService';
import { UploadService } from 'src/app/services/UploadService';

@Component({
  selector: 'app-km-form',
  templateUrl: './km-form.component.html',
  styleUrls: ['./km-form.component.css']
})
export class KmFormComponent {

  kmForm!: FormGroup;
  selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private kmService: KmService,
    private uploadService: UploadService,
    private router: Router
  ) {

    const today = new Date().toISOString().split('T')[0];  // ⭐ Default today date

    this.kmForm = this.fb.group({
      salesperson: [''],
      startKm: [''],
      endKm: [''],
      visitedPlace: [''],
      batchNo: [''],
      trnDate: [today],   // ⭐ Auto-filled date
      filePath: ['']
    });
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  submitKm() {
    if (this.selectedFile) {
      this.uploadService.uploadFile(this.selectedFile).subscribe((fileName: any) => {
        this.kmForm.patchValue({ filePath: fileName });
        this.saveKmDetails();
      });
    } else {
      this.saveKmDetails();
    }
  }

  saveKmDetails() {
    this.kmService.saveKm(this.kmForm.value).subscribe({
      next: () => {
        // Navigation instead of alert
        this.router.navigate(['/km-list']);  // ⭐ Redirect after save
      },
      error: () => {
        alert("Error saving KM details!");
      }
    });
  }
}
