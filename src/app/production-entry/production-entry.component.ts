import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ProductionService } from '../services/ProductionService';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-production-entry',
  templateUrl: './production-entry.component.html',
  styleUrls: ['./production-entry.component.css']
})
export class ProductionEntryComponent implements OnInit {

  productionForm!: FormGroup;

  productionList: any[] = [];
  filteredProductionList: any[] = [];

  showForm = false;
  editId: number | null = null;

  siloList: number[] = [];

  filterFromDate = '';
  filterToDate = '';

  constructor(
    private fb: FormBuilder,
    private service: ProductionService
  ) { }

  ngOnInit(): void {

    this.siloList = Array.from({ length: 5 }, (_, i) => i + 1);

    const today = new Date().toISOString().substring(0, 10);
    this.filterFromDate = today;
    this.filterToDate = today;

    this.productionForm = this.fb.group({
      shift: [''],
      productionDate: [today],

      siloNo1: [''],
      literWeight1: [''],
      faSolid1: [''],

      siloNo2: [''],
      literWeight2: [''],
      faSolid2: [''],

      waterLiter: [''],
      cementKg: [''],
      limeKg: [''],
      gypsumKg: [''],
      solOilKg: [''],
      aiPowerGm: [''],
      tempC: [''],

      castingTime: [''],
      productionTime: [''],
      productionRemark: [''],
      remark: [''],

      userId: [1],
      branchId: [1],
      orgId: [1]
    });

    this.setShiftByTime();
    this.loadData();
  }

  loadData() {
    this.service.getAll().subscribe(res => {
      this.productionList = res || [];
      this.applyFilters();
    });
  }

  applyFilters() {

    // 🚫 VALIDATION FIRST
    if (
      this.filterFromDate &&
      this.filterToDate &&
      new Date(this.filterToDate) < new Date(this.filterFromDate)
    ) {
      alert('To Date cannot be earlier than From Date');
      return;
    }

    const from = this.filterFromDate
      ? new Date(this.filterFromDate).getTime()
      : null;

    const to = this.filterToDate
      ? new Date(this.filterToDate + 'T23:59:59').getTime()
      : null;

    this.filteredProductionList = this.productionList.filter(p => {
      const date = new Date(p.createdDate).getTime();

      return (!from || date >= from) &&
        (!to || date <= to);
    });
  }



  clearFilters() {
    this.filterFromDate = '';
    this.filterToDate = '';
    this.filteredProductionList = [...this.productionList];
  }

  exportData(type: string) {
    if (type === 'pdf') this.exportPDF();
    if (type === 'excel') this.exportExcel();
  }

  exportPDF() {
    if (!this.filteredProductionList.length) {
      alert('No data to export');
      return;
    }

    const doc = new jsPDF();

    autoTable(doc, {
      head: [[
        'Batch No',
        'Date',
        'Shift',
        'Total Solid',
        'Production Time'
      ]],
      body: this.filteredProductionList.map(p => [
        p.batchNo,
        this.formatDate(p.createdDate),
        `Shift ${p.shift}`,
        p.totalSolid,
        p.productionTime
      ])
    });

    doc.save('production-register.pdf');
  }

  formatDate(date: any): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-GB'); // dd/MM/yyyy
  }


  exportExcel() {
    if (!this.filteredProductionList.length) {
      alert('No data to export');
      return;
    }

    const excelData = this.filteredProductionList.map(p => ({
      'Batch No': p.batchNo,
      'Date': this.formatDate(p.createdDate),
      'Shift': `Shift ${p.shift}`,
      'Total Solid': p.totalSolid,
      'Production Time': p.productionTime
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, 'Production Register');
    XLSX.writeFile(wb, 'production-register.xlsx');
  }


  calculateTotalSolid(): number {
    return (+this.productionForm.value.faSolid1 || 0) +
      (+this.productionForm.value.faSolid2 || 0);
  }

  setShiftByTime() {
    const hour = new Date().getHours();
    if (hour >= 9 && hour < 18) this.productionForm.patchValue({ shift: 'G' });
    else if (hour < 14) this.productionForm.patchValue({ shift: '1' });
    else if (hour < 22) this.productionForm.patchValue({ shift: '2' });
    else this.productionForm.patchValue({ shift: '3' });
  }

  openForm() {
    this.showForm = true;
    this.editId = null;
    this.productionForm.reset({ productionDate: new Date().toISOString().substring(0, 10) });
    this.setShiftByTime();
  }

  submit() {
    const payload = {
      ...this.productionForm.value,
      totalSolid: this.calculateTotalSolid()
    };

    const req$ = this.editId
      ? this.service.update(this.editId, payload)
      : this.service.save(payload);

    req$.subscribe(() => {
      this.showForm = false;
      this.loadData();
    });
  }

  edit(row: any) {
    this.editId = row.id;
    this.showForm = true;
    this.productionForm.patchValue(row);
  }

  delete(id: number) {
    if (confirm('Delete this production entry?')) {
      this.service.delete(id).subscribe(() => this.loadData());
    }
  }
}
