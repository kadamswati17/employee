import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BlockSeparatingService } from '../services/BlockSeparatingService';
// import { BlockSeparatingService } from '../services/block-separating.service';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-block-separating',
  templateUrl: './block-separating.component.html',
  styleUrls: ['./block-separating.component.css']
})
export class BlockSeparatingComponent implements OnInit {

  form!: FormGroup;
  isSubmitting = false;
  isEdit = false;
  filterFromDate = '';
  filterToDate = '';
  autoclaveBatches: any[] = [];
  // ================= PAGINATION =================
  pageSize = 5;        // records per page
  currentPage = 1;
  totalPages = 0;
  pagedList: any[] = [];
  editId: number | null = null;

  filterShift = '';
  filterBlockSize = '';

  blockSizes: string[] = [];
  usedBatchNumbers: string[] = [];

  showForm = false;

  list: any[] = [];          // full data
  filteredList: any[] = [];  // table data

  constructor(
    private fb: FormBuilder,
    private service: BlockSeparatingService,
    private auth: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    const today = new Date().toISOString().split('T')[0];

    this.form = this.fb.group({
      reportDate: [today, Validators.required],
      batchNumber: ['', Validators.required],
      castingDate: ['', Validators.required],
      blockSize: ['', Validators.required],
      shift: ['', Validators.required],
      time: ['', Validators.required],
      remark: ['']
    });

    this.loadList();
    // this.loadCuttingBatches();   // ✅ correct method
  }

  edit(row: any) {
    this.showForm = true;
    this.isEdit = true;
    this.editId = row.id;

    // 🔥 Allow current batch in dropdown
    this.autoclaveBatches = [
      { batchNo: row.batchNumber },
      ...this.autoclaveBatches
    ];

    this.form.patchValue({
      reportDate: row.reportDate,
      batchNumber: row.batchNumber,
      castingDate: row.castingDate,
      blockSize: row.blockSize,
      shift: row.shift,
      time: row.time,
      remark: row.remark
    });
  }

  goToDashboard() {
    this.router.navigate(['/production-dashboard']);
  }

  loadList() {
    this.service.getAll().subscribe(res => {

      const map = new Map<string, any>();
      res.forEach((r: any) => map.set(r.batchNumber, r));

      this.list = Array.from(map.values());
      this.filteredList = [...this.list];

      this.usedBatchNumbers = this.list.map(r => r.batchNumber);

      this.blockSizes = [
        ...new Set(this.list.map(r => r.blockSize).filter(Boolean))
      ];

      this.currentPage = 1;
      this.updatePagination();      // 🔥 ADD THIS

      this.loadCuttingBatches();    // dropdown refresh
    });
  }

  isInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!(control && control.touched && control.invalid);
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredList.length / this.pageSize);

    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.pagedList = this.filteredList.slice(start, end);
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagination();
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }



  loadCuttingBatches() {
    this.service.getCuttingBatches().subscribe({
      next: (res: any[]) => {

        // 🔥 REMOVE already used batch numbers
        this.autoclaveBatches = res
          .filter(r => !this.usedBatchNumbers.includes(r.batchNo))
          .map(r => ({ batchNo: r.batchNo }));

      },
      error: (err: any) => {
        console.error('Batch load error:', err);
        alert('Failed to load batches');
      }
    });
  }







  // ================= OPEN FORM =================
  openForm() {
    this.showForm = true;
    this.isEdit = false;

    const today = new Date().toISOString().split('T')[0];

    this.form.reset({
      reportDate: today
    });
  }
  resetFormWithDefaults() {
    const today = new Date().toISOString().split('T')[0];

    this.form.reset({
      reportDate: today,
      shift: ''     // or 'G' if you want default General
    });
  }

  cancel() {
    this.showForm = false;
    this.editId = null;
    this.isEdit = false;

    const today = new Date().toISOString().split('T')[0];
    this.form.reset({ reportDate: today });
  }


  // ================= SUBMIT =================
  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const userId = this.auth.getLoggedInUserId();



    const payload = {
      ...this.form.value,
      userId: userId
    };

    const request$ = this.editId
      ? this.service.update(this.editId, payload)
      : this.service.create(payload);

    request$.subscribe({
      next: () => {
        this.isSubmitting = false;
        this.showForm = false;
        this.editId = null;
        this.isEdit = false;

        this.loadList();
      },
      error: () => {
        alert('Error while saving');
        this.isSubmitting = false;
      }
    });
  }

  delete(id: number) {
    if (!confirm('Are you sure you want to delete this record?')) return;

    this.service.delete(id).subscribe({
      next: () => {
        this.loadList();
      },
      error: () => {
        alert('Delete failed');
      }
    });
  }

  applyFilters() {
    this.filteredList = this.list.filter(r => {

      let ok = true;

      if (this.filterFromDate) {
        ok = ok && new Date(r.castingDate) >= new Date(this.filterFromDate);
      }

      if (this.filterToDate) {
        ok = ok && new Date(r.castingDate) <= new Date(this.filterToDate);
      }

      if (this.filterShift) {
        ok = ok && r.shift === this.filterShift;
      }

      if (this.filterBlockSize) {
        ok = ok && r.blockSize === this.filterBlockSize;
      }

      return ok;
    });

    this.currentPage = 1;        // 🔥 RESET PAGE
    this.updatePagination();     // 🔥 IMPORTANT
  }




  clearFilters() {
    this.filterFromDate = '';
    this.filterToDate = '';
    this.filterShift = '';
    this.filterBlockSize = '';

    this.filteredList = [...this.list];
    this.currentPage = 1;
    this.updatePagination();
  }


  exportExcel() {

    // 🔥 Prepare FULL data
    const data = this.filteredList.map(r => ({
      'Report Date': r.reportDate ? new Date(r.reportDate).toLocaleDateString() : '',
      'Casting Date': new Date(r.castingDate).toLocaleDateString(),
      'Shift': r.shift,
      'Batch Number': r.batchNumber,
      'Block Size': r.blockSize,
      'Time': r.time,
      'Remark': r.remark || '',

    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Block Separating');

    // Download file
    XLSX.writeFile(workbook, 'Block_Separating_Register.xlsx');
  }


  // onImportSelect(event: any, fileInput: HTMLInputElement) {
  //   if (event.target.value === 'excel') {
  //     fileInput.click();
  //   }
  //   event.target.value = '';
  // }

  importExcel(event: any) {
    alert('Excel import will be added later');
  }

  onExportChange(event: any) {
    const value = event.target.value;

    if (value === 'excel') {
      this.exportExcel();
    }

    if (value === 'pdf') {
      this.exportPdf();
    }

    event.target.value = '';
  }


  exportPdf() {
    const doc = new jsPDF('landscape');

    autoTable(doc, {
      head: [[
        'Report Date',
        'Casting Date',
        'Shift',
        'Batch No',
        'Block Size',
        'Time',
        'Remark'
      ]],
      body: this.filteredList.map(r => [
        r.reportDate ? new Date(r.reportDate).toLocaleDateString() : '',
        new Date(r.castingDate).toLocaleDateString(),
        r.shift,
        r.batchNumber,
        r.blockSize,
        r.time,
        r.remark || ''
      ]),
      styles: {
        fontSize: 9
      },
      headStyles: {
        fillColor: [37, 99, 235] // blue header
      }
    });

    doc.save('Block_Separating_Register.pdf');
  }


  // ================= IMPORT SELECT =================
  onImportSelect(event: any) {
    const value = event.target.value;
    if (value === 'excel') {
      const fileInput = document.getElementById('blockExcelInput') as HTMLInputElement;
      fileInput?.click();
    }
    event.target.value = '';
  }

  // ================= FILE SELECT =================
  onExcelSelect(event: any) {
    this.importExcel(event);
  }

}
