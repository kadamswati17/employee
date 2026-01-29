import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { RejectionService } from '../services/RejectionService';
import { CubeTestService } from '../services/CubeTestService';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AuthService } from '../services/auth.service';



@Component({
  selector: 'app-rejection-component',
  templateUrl: './rejection-component.component.html',
  styleUrls: ['./rejection-component.component.css']
})
export class RejectionComponentComponent implements OnInit {

  form!: FormGroup;
  cubeTests: any[] = [];

  list: any[] = [];
  filtered: any[] = [];
  paginated: any[] = [];

  showLeads = true;
  editId: any = null;

  filterFromDate = '';
  filterToDate = '';
  filterShift = '';

  currentPage = 1;
  pageSize = 5;
  totalPages = 0;


  constructor(private fb: FormBuilder, private service: RejectionService,
    private auth: AuthService,
    private cubeTestService: CubeTestService) { }

  ngOnInit() {

    const today = new Date().toISOString().split('T')[0]; // ✅ yyyy-MM-dd

    this.form = this.fb.group({
      date: [today],          // 👈 default today
      batchNo: [''],
      shift: [''],
      blockSize: [''],
      qty: [''],
      cornerDamage: [0],
      eruptionType: [0],
      topSideDamages: [0],
      sideCrackThermalCrack: [0],
      risingCrack: [0],
      centreCrack: [0],
      bottomUncutBlocks: [0],
      totalBreakages: [0],
      isActive: [1]
    });

    this.load();
    this.loadCubeTests();

  }


  load() {
    this.service.getAll().subscribe((r: any[]) => {
      this.list = r;

      // 🔥 important
      this.filtered = [...r];

      this.setupPagination();
    });
  }


  loadCubeTests() {
    this.cubeTestService.getAll().subscribe((res: any[]) => {
      console.log('Cube tests:', res);   // 🔥 debug
      this.cubeTests = res;
    });
  }



  onBatchSelect(event: any) {

    const batch = event.target.value;

    const selected = this.cubeTests.find((x: any) => x.batchNo == batch);

    if (selected) {
      this.form.patchValue({
        date: selected.castDate   // optional
      });
    }
  }

  setupPagination() {
    this.totalPages = Math.ceil(this.filtered.length / this.pageSize);
    this.currentPage = 1;
    this.updatePage();
  }

  updatePage() {
    const s = (this.currentPage - 1) * this.pageSize;
    this.paginated = this.filtered.slice(s, s + this.pageSize);
  }

  nextPage() { if (this.currentPage < this.totalPages) { this.currentPage++; this.updatePage(); } }
  prevPage() { if (this.currentPage > 1) { this.currentPage--; this.updatePage(); } }

  applyFilters() {

    // ✅ Validate date range first
    if (this.filterFromDate && this.filterToDate) {

      const from = new Date(this.filterFromDate);
      const to = new Date(this.filterToDate);

      if (to < from) {
        alert('To Date must be equal or greater than From Date');
        this.filterToDate = '';
        return;
      }
    }

    this.filtered = this.list.filter(r => {

      const rowDate = new Date(r.date).setHours(0, 0, 0, 0);

      if (this.filterFromDate) {
        const from = new Date(this.filterFromDate).setHours(0, 0, 0, 0);
        if (rowDate < from) return false;
      }

      if (this.filterToDate) {
        const to = new Date(this.filterToDate).setHours(0, 0, 0, 0);
        if (rowDate > to) return false;
      }

      // ✅ Shift filter
      if (this.filterShift && r.shift != this.filterShift) return false;

      return true;
    });

    this.setupPagination();
  }



  delete(id: any) {

    if (!confirm('Are you sure you want to delete this record?')) return;

    this.service.delete(id).subscribe(() => {
      alert('Deleted successfully');
      this.load();   // refresh list
    });
  }


  clearFilters() {
    this.filterFromDate = '';
    this.filterToDate = '';
    this.filterShift = '';
    this.filtered = [...this.list];
    this.setupPagination();
  }

  openCreate() {

    const today = new Date().toISOString().split('T')[0];

    this.form.reset({
      date: today,     // ✅ keep today after reset
      isActive: 1
    });

    this.editId = null;
    this.showLeads = false;
  }

  edit(r: any) {

    const date = r.date ? r.date.split('T')[0] : '';

    this.form.patchValue({
      date: date,
      batchNo: r.batchNo,
      blockSize: r.blockSize,
      qty: r.qty,
      shift: r.shift,
      cornerDamage: +r.cornerDamage || 0,
      eruptionType: +r.eruptionType || 0,
      topSideDamages: +r.topSideDamages || 0,
      sideCrackThermalCrack: +r.sideCrackThermalCrack || 0,
      risingCrack: +r.risingCrack || 0,
      centreCrack: +r.centreCrack || 0,
      bottomUncutBlocks: +r.bottomUncutBlocks || 0
    });

    this.editId = r.id;
    this.showLeads = false;
  }



  submit() {
    const userId = this.auth.getLoggedInUserId();
    const f = this.form.value;

    f.totalBreakages =
      +f.cornerDamage +
      +f.eruptionType +
      +f.topSideDamages +
      +f.sideCrackThermalCrack +
      +f.risingCrack +
      +f.centreCrack +
      +f.bottomUncutBlocks;

    const payload = {
      ...f,
      userId: userId
    };

    const req = this.editId
      ? this.service.update(this.editId, f)
      : this.service.create(f);

    req.subscribe(() => {
      alert('Saved');
      this.showLeads = true;
      this.load();
    });
  }

  backToList() { this.showLeads = true; }

  // ===== dummy export/import (no errors) =====
  onExportChange(e: any) {
    if (e.target.value === 'excel') this.exportExcel();
    if (e.target.value === 'pdf') this.exportPdf();
    e.target.value = '';
  }

  exportExcel() {

    const data = this.filtered.map(r => ({

      ID: r.id,
      Date: new Date(r.date).toLocaleDateString(),
      Shift: r.shift,                 // ✅ added shift

      BatchNo: r.batchNo,
      BlockSize: r.blockSize,
      Qty: r.qty,

      CornerDamage: r.cornerDamage,
      EruptionType: r.eruptionType,
      TopSideDamages: r.topSideDamages,
      SideCrack: r.sideCrackThermalCrack,
      RisingCrack: r.risingCrack,
      CentreCrack: r.centreCrack,
      BottomUncut: r.bottomUncutBlocks,

      TotalBreakages: r.totalBreakages,
      Status: r.isActive ? 'Active' : 'Inactive'
    }));

    if (!data.length) {
      alert('No records to export');
      return;
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, 'Rejection');

    XLSX.writeFile(wb, 'Rejection.xlsx');
  }



  exportPdf() {

    if (!this.paginated.length) {
      alert('No records to export');
      return;
    }

    const doc = new jsPDF();

    autoTable(doc, {
      head: [['Date', 'Shift', 'Batch', 'Block', 'Qty', 'Total']],
      body: this.paginated.map(r => [
        new Date(r.date).toLocaleDateString(),
        r.shift,
        r.batchNo,
        r.blockSize,
        r.qty,
        r.totalBreakages
      ])
    });

    doc.save('Rejection.pdf');
  }


  onExcelSelect(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    alert('Import coming later'); // placeholder
  }

}
