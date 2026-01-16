import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
// import { WireCuttingReportService } from '../services/wire-cutting-report.service';
import { ProductionService } from '../services/ProductionService';
import { WireCuttingReportService } from '../services/WireCuttingReportService';

@Component({
  selector: 'app-wire-cutting-report',
  templateUrl: './wire-cutting-report.component.html',
  styleUrls: ['./wire-cutting-report.component.css']
})
export class WireCuttingReportComponent implements OnInit {

  showForm = false;
  form!: FormGroup;

  list: any[] = [];
  productionList: any[] = [];

  editId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private service: WireCuttingReportService,
    private productionService: ProductionService
  ) { }

  ngOnInit(): void {

    const today = new Date().toISOString().substring(0, 10);

    this.form = this.fb.group({
      reportDate: [today],                          // ✅ TODAY (READ ONLY)
      cuttingDate: [today, Validators.required],   // ✅ WIRE CUTTING DATE

      batchNo: ['', Validators.required],
      mouldNo: [0],
      size: [0],
      ballTestMm: [0],
      time: [''],
      otherReason: ['']
    });

    this.load();
    this.loadProduction();
  }

  // =====================
  // LOAD TABLE
  // =====================
  load() {
    this.service.getAll().subscribe(res => this.list = res);
  }

  // =====================
  // LOAD BATCH DROPDOWN
  // =====================
  loadProduction() {
    this.productionService.getAll().subscribe(res => {
      this.productionList = res;
    });
  }

  // =====================
  // OPEN FORM (ADD)
  // =====================
  openForm() {
    this.showForm = true;
    this.editId = null;

    const today = new Date().toISOString().substring(0, 10);
    this.form.reset({
      reportDate: today,
      cuttingDate: today
    });
  }

  // =====================
  // EDIT
  // =====================
  edit(row: any) {
    this.editId = row.id;
    this.showForm = true;

    this.form.patchValue({
      reportDate: new Date().toISOString().substring(0, 10), // always today
      cuttingDate: row.cuttingDate,                          // actual date
      batchNo: row.batchNo,
      mouldNo: row.mouldNo,
      size: row.size,
      ballTestMm: row.ballTestMm,
      time: row.time,
      otherReason: row.otherReason
    });
  }

  // =====================
  // DELETE
  // =====================
  delete(id: number) {
    if (confirm('Delete this wire cutting record?')) {
      this.service.delete(id).subscribe(() => this.load());
    }
  }

  // =====================
  // SAVE / UPDATE
  // =====================
  submit() {
    const { reportDate, ...formData } = this.form.value; // reportDate not sent

    const payload = {
      ...formData,
      userId: 1,
      branchId: 1,
      orgId: 1
    };

    if (this.editId) {
      this.service.update(this.editId, payload).subscribe(() => this.afterSave());
    } else {
      this.service.save(payload).subscribe(() => this.afterSave());
    }
  }

  afterSave() {
    this.showForm = false;
    this.editId = null;
    this.load();
  }

  cancel() {
    this.showForm = false;
    this.editId = null;
  }
}
