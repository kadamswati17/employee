import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CastingHallReportService } from '../services/CastingHallReportService';
import { ProductionService } from '../services/ProductionService';

@Component({
  selector: 'app-casting-hall-report',
  templateUrl: './casting-hall-report.component.html',
  styleUrls: ['./casting-hall-report.component.css']
})
export class CastingHallReportComponent implements OnInit {

  showForm = false;
  reportForm!: FormGroup;

  reportList: any[] = [];
  productionList: any[] = [];

  editId: number | null = null; // ✅ for edit/update

  constructor(
    private fb: FormBuilder,
    private service: CastingHallReportService,
    private productionService: ProductionService
  ) { }

  ngOnInit(): void {

    const today = new Date().toISOString().substring(0, 10);

    this.reportForm = this.fb.group({
      reportDate: [today, Validators.required],

      batchNo: ['', Validators.required],

      size: [0],
      bedNo: [0],
      mouldNo: [0],
      castingTime: [''],

      consistency: [0],
      flowInCm: [0],
      castingTempC: [0],
      vt: [0],
      massTemp: [0],
      fallingTestMm: [0],
      testTime: [0],
      hTime: [0],

      remark: ['']
    });

    this.loadReports();
    this.loadProductionBatches();
  }

  // ===============================
  // LOAD PRODUCTION (BATCH DROPDOWN)
  // ===============================
  loadProductionBatches() {
    this.productionService.getAll().subscribe((res: any[]) => {
      this.productionList = res;
    });
  }

  // ===============================
  // OPEN FORM (ADD MODE)
  // ===============================
  openForm() {
    this.showForm = true;
    this.editId = null;

    const today = new Date().toISOString().substring(0, 10);
    this.reportForm.reset({
      reportDate: today
    });
  }

  // ===============================
  // EDIT
  // ===============================
  edit(row: any) {
    this.editId = row.id;
    this.showForm = true;
    this.reportForm.patchValue(row);
  }

  // ===============================
  // DELETE
  // ===============================
  delete(id: number) {
    if (confirm('Are you sure you want to delete this casting report?')) {
      this.service.delete(id).subscribe(() => {
        this.loadReports();
      });
    }
  }

  // ===============================
  // SAVE / UPDATE
  // ===============================
  submit() {
    const { reportDate, ...formData } = this.reportForm.value;

    const payload = {
      ...formData,
      userId: 1,
      branchId: 1,
      orgId: 1
    };

    if (this.editId) {
      // UPDATE
      this.service.update(this.editId, payload).subscribe(() => {
        this.afterSave();
      });
    } else {
      // SAVE
      this.service.save(payload).subscribe(() => {
        this.afterSave();
      });
    }
  }

  afterSave() {
    this.showForm = false;
    this.editId = null;
    this.loadReports();
  }

  // ===============================
  // CANCEL
  // ===============================
  cancel() {
    this.showForm = false;
    this.editId = null;
    this.reportForm.reset();
  }

  // ===============================
  // LOAD TABLE DATA
  // ===============================
  loadReports() {
    this.service.getAll().subscribe((res: any[]) => {
      this.reportList = res;
    });
  }
}
