import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormArray
} from '@angular/forms';
import { AutoclaveService } from '../services/AutoclaveService';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { WireCuttingReportService } from '../services/WireCuttingReportService';
import { AuthService } from '../services/auth.service';


@Component({
  selector: 'app-autoclave',
  templateUrl: './autoclave.component.html',
  styleUrls: ['./autoclave.component.css']
})
export class AutoclaveComponent implements OnInit {

  // ================= UI STATE =================
  showForm = false;

  // ================= MAIN FORM =================
  form!: FormGroup;

  // ================= WAGON FORM =================
  wagonForm!: FormGroup;

  // ================= DATA =================
  list: any[] = [];
  filteredList: any[] = [];
  pagedList: any[] = [];

  availableBatches: string[] = [];


  // ================= FILTER =================
  filterFromDate = '';
  filterToDate = '';

  // ================= PAGINATION =================
  pageSize = 5;
  currentPage = 1;
  totalPages = 0;

  // ================= EDIT =================
  editId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private service: AutoclaveService,
    private wireCuttingService: WireCuttingReportService,
    private auth: AuthService
  ) { }

  // ================= INIT =================
  ngOnInit(): void {
    const today = new Date().toISOString().substring(0, 10);

    // Main Autoclave Form
    this.form = this.fb.group({
      // autoclaveNo: ['', Validators.required],
      runNo: [''],
      startedAt: [''],
      startedDate: [today],
      completedAt: [''],
      completedDate: [''],
      remarks: ['']
    });

    this.wagonForm = this.fb.group({
      eBatch: ['', Validators.required],
      eSize: [''],
      mBatch: [''],
      mSize: [''],
      wBatch: [''],
      wSize: [''],
      wagons: this.fb.array([])
    });
    this.loadCuttingBatches();
    this.loadList();
  }

  // ================= WAGONS =================
  get wagons(): FormArray {
    return this.wagonForm.get('wagons') as FormArray;
  }

  loadCuttingBatches(): void {
    this.wireCuttingService.getAll().subscribe(res => {

      console.log('CUTTING API RESPONSE:', res);

      // ✅ NO FILTER – take ALL batch numbers
      this.availableBatches = [
        ...new Set(res.map(r => r.batchNo))
      ];

      console.log('AVAILABLE BATCHES (ALL):', this.availableBatches);
    });
  }


  addWagon(): void {
    if (this.wagons.length >= 14) return;

    const wagon = this.fb.group({
      eBatch: this.wagonForm.value.eBatch,
      eSize: this.wagonForm.value.eSize,
      mBatch: this.wagonForm.value.mBatch,
      mSize: this.wagonForm.value.mSize,
      wBatch: this.wagonForm.value.wBatch,
      wSize: this.wagonForm.value.wSize
    });

    this.wagons.push(wagon);

    // clear input fields after add
    this.wagonForm.patchValue({
      eBatch: '',
      eSize: '',
      mBatch: '',
      mSize: '',
      wBatch: '',
      wSize: ''
    });
  }


  removeWagon(index: number): void {
    this.wagons.removeAt(index);
  }

  isBatchUsed(batch: string): boolean {
    return this.wagons.controls.some(ctrl =>
      Object.values(ctrl.value).includes(batch)
    );
  }

  // ================= LOAD =================
  loadList(): void {
    this.service.getAll().subscribe(res => {

      console.log('API RESPONSE:', res);
      console.log('TOTAL RECORDS FROM API:', res.length);

      this.list = res || [];
      this.applyFilters();
    });
  }


  applyFilters(): void {
    const from = this.filterFromDate
      ? new Date(this.filterFromDate).getTime()
      : null;

    const to = this.filterToDate
      ? new Date(this.filterToDate + 'T23:59:59').getTime()
      : null;

    this.filteredList = this.list.filter(r => {
      const d = new Date(r.startedDate).getTime();
      return (!from || d >= from) && (!to || d <= to);
    });

    console.log('FILTERED LIST COUNT:', this.filteredList.length);

    this.currentPage = 1;
    this.updatePagination();
  }


  clearFilters(): void {
    this.filterFromDate = '';
    this.filterToDate = '';
    this.filteredList = [...this.list];
    this.updatePagination();
  }

  // ================= PAGINATION =================
  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredList.length / this.pageSize);
    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedList = this.filteredList.slice(start, start + this.pageSize);
  }

  goToPage(p: number): void {
    this.currentPage = p;
    this.updatePagination();
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  // ================= CRUD =================
  openForm(): void {
    this.showForm = true;
    this.editId = null;

    this.form.reset({
      startedDate: new Date().toISOString().substring(0, 10)
    });

    this.wagonForm.reset();
    this.wagons.clear();
  }

  edit(row: any): void {
    this.showForm = true;
    this.editId = row.id;

    this.form.patchValue(row);

    this.wagons.clear();
    if (row.wagons?.length) {
      row.wagons.forEach((w: any) => {
        this.wagons.push(this.fb.group(w));
      });
    }
  }

  save(): void {
    const userId = this.auth.getLoggedInUserId();
    const payload = {
      ...this.form.value,
      wagons: this.wagonForm.value.wagons,
      userId: userId,
      branchId: 1,
      orgId: 1
    };

    const req$ = this.editId
      ? this.service.update(this.editId, payload)
      : this.service.save(payload);

    req$.subscribe(() => {
      this.showForm = false;
      this.editId = null;
      this.wagonForm.reset();
      this.wagons.clear();
      this.loadList();
    });
  }

  delete(id: number): void {
    if (confirm('Delete this autoclave cycle?')) {
      this.service.delete(id).subscribe(() => this.loadList());
    }
  }

  // ================= NAV =================
  back(): void {
    this.cancel();
  }

  cancel(): void {
    this.showForm = false;
    this.editId = null;
  }

  // ================= EXPORT =================
  onExportChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;

    if (value === 'excel') {
      this.exportExcel();
    }

    if (value === 'pdf') {
      this.exportPdf();
    }

    // reset dropdown
    (event.target as HTMLSelectElement).value = '';
  }

  exportExcel(): void {

    const combinedData: any[] = [];

    this.filteredList.forEach((r: any) => {

      // If wagons exist → create one row per wagon
      if (r.wagons && r.wagons.length > 0) {
        r.wagons.forEach((w: any, i: number) => {
          combinedData.push({
            'Autoclave No': r.autoclaveNo,
            'Run No': r.runNo,
            'Started At': r.startedAt,
            'Started Date': r.startedDate,
            'Completed At': r.completedAt,
            'Completed Date': r.completedDate,
            'Remarks': r.remarks || '',
            'Wagon No': i + 1,
            'E Batch': w.eBatch,
            'E Size': w.eSize,
            'M Batch': w.mBatch,
            'M Size': w.mSize,
            'W Batch': w.wBatch,
            'W Size': w.wSize
          });
        });
      }

      // If NO wagons → still export autoclave row
      else {
        combinedData.push({
          'Autoclave No': r.autoclaveNo,
          'Run No': r.runNo,
          'Started At': r.startedAt,
          'Started Date': r.startedDate,
          'Completed At': r.completedAt,
          'Completed Date': r.completedDate,
          'Remarks': r.remarks || '',
          'Wagon No': '',
          'E Batch': '',
          'E Size': '',
          'M Batch': '',
          'M Size': '',
          'W Batch': '',
          'W Size': ''
        });
      }
    });

    // Create single worksheet
    const worksheet = XLSX.utils.json_to_sheet(combinedData);

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Autoclave + Wagons');

    // Download
    XLSX.writeFile(workbook, 'Autoclave_Cycle_Combined.xlsx');
  }




  exportPdf(): void {
    const doc = new jsPDF();

    autoTable(doc, {
      head: [[
        'Autoclave No',
        'Run No',
        'Start Date',
        'Completed Date',
        'Remarks'
      ]],
      body: this.filteredList.map(r => [
        r.autoclaveNo,
        r.runNo,
        r.startedDate,
        r.completedDate,
        r.remarks || ''
      ])
    });

    doc.save('Autoclave_Cycle.pdf');
  }

  // ================= IMPORT =================
  onImportSelect(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;

    if (value === 'excel') {
      const fileInput = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;

      fileInput?.click();
    }

    (event.target as HTMLSelectElement).value = '';
  }

  onExcelSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = (e: any) => {
      const wb = XLSX.read(e.target.result, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws);

      console.log('Imported Excel Data:', data);

      // 🔥 OPTIONAL: call backend API here
      // this.service.bulkImport(data).subscribe(...)
    };

    reader.readAsBinaryString(file);
  }

}
