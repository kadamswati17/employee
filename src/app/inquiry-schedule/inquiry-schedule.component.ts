import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { InquiryScheduleService } from '../services/InquiryScheduleService';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-inquiry-schedule',
  templateUrl: './inquiry-schedule.component.html',
  styleUrls: ['./inquiry-schedule.component.css']
})
export class InquiryScheduleComponent implements OnInit {

  showList = true;
  isEdit = false;

  form!: FormGroup;
  selectedId: number | null = null;

  pageSize = 5;
  currentPage = 1;

  schedules: any[] = [];
  filteredSchedules: any[] = [];
  paginatedData: any[] = [];

  // 👇 THIS WILL POWER THE DROPDOWN
  inquiries: any[] = [];

  filterFromDate = '';
  filterToDate = '';
  filterStatus = '';

  constructor(
    private fb: FormBuilder,
    private scheduleService: InquiryScheduleService,
    private http: HttpClient,
    private route: ActivatedRoute
  ) { }
  ngOnInit(): void {

    this.route.queryParams.subscribe(params => {
      if (params['openForm']) {
        this.showList = false;   // 🔥 OPEN FORM DIRECTLY
        this.isEdit = false;
      }
    });

    const today = this.getToday();   // ✅ today

    // ✅ SHOW TODAY IN FILTER INPUTS
    this.filterFromDate = today;
    this.filterToDate = today;

    this.form = this.fb.group({
      inquiryId: [''],
      scheduleDate: [''],
      scheduleTime: [''],
      remark: [''],
      status: ['OPEN'],
      assignTo: ['']
    });

    this.loadSchedules();        // ✅ REQUIRED (same as Project)
    this.loadInquiryDropdown();
  }


  // ================= LOAD SCHEDULES =================
  loadSchedules(): void {
    this.scheduleService.getAllSchedules().subscribe(res => {
      this.schedules = res || [];
      this.filteredSchedules = [...this.schedules];
      this.currentPage = 1;
      this.updatePagination();
    });
  }

  // ================= 🔥 LOAD INQUIRY + LEAD NAME =================
  loadInquiryDropdown(): void {

    // 1️⃣ Get inquiries
    this.http.get<any[]>('http://localhost:8080/api/inquiries')
      .subscribe(inquiries => {

        // 2️⃣ Get leads
        this.http.get<any[]>('http://localhost:8080/api/leads')
          .subscribe(leads => {

            // 3️⃣ Map inquiryId + lead name
            this.inquiries = inquiries.map(inq => {
              const lead = leads.find(l => l.leadId === inq.leadAccountId);

              return {
                inqId: inq.inqueryId,                // ✅ REAL inquiry id
                cname: lead ? lead.cname : '-'       // ✅ lead name
              };
            });

          });
      });
  }

  openForm(): void {
    this.showList = false;
    this.isEdit = false;
    this.selectedId = null;
    this.form.reset({ status: 'OPEN' });
  }

  backToList(): void {
    this.showList = true;
    this.form.reset();
  }

  editSchedule(data: any): void {
    this.isEdit = true;
    this.showList = false;
    this.selectedId = data.inqId;

    this.form.patchValue({
      inquiryId: data.inquiryId,
      scheduleDate: data.scheduleDate,
      scheduleTime: data.scheTime,
      remark: data.remark,
      status: data.inqStatus,
      assignTo: data.assignTo
    });

  }

  submit(): void {
    const payload = {
      inquiryId: this.form.value.inquiryId,
      scheduleDate: this.form.value.scheduleDate,
      scheTime: this.form.value.scheduleTime,
      remark: this.form.value.remark,
      inqStatus: this.form.value.status,
      assignTo: this.form.value.assignTo
    };

    if (this.isEdit && this.selectedId) {
      this.scheduleService.updateSchedule(this.selectedId, payload).subscribe(() => {
        this.loadSchedules();
        this.backToList();
      });
    } else {
      this.scheduleService.createSchedule(payload).subscribe(() => {
        this.loadSchedules();
        this.backToList();
      });
    }
  }

  // ================= FILTER =================
  applyFilters(): void {
    this.filteredSchedules = this.schedules.filter(s => {
      let ok = true;

      if (
        this.filterFromDate &&
        this.filterToDate &&
        new Date(this.filterToDate) < new Date(this.filterFromDate)
      ) {
        alert('To Date cannot be earlier than From Date');
        return;
      }

      if (this.filterFromDate) {
        ok = ok && new Date(s.scheduleDate).getTime() >=
          new Date(this.filterFromDate).setHours(0, 0, 0, 0);
      }

      if (this.filterToDate) {
        ok = ok && new Date(s.scheduleDate).getTime() <=
          new Date(this.filterToDate).setHours(23, 59, 59, 999);
      }

      if (this.filterStatus) {
        ok = ok && s.inqStatus === this.filterStatus;
      }

      return ok;
    });

    this.currentPage = 1;
    this.updatePagination();
  }

  getToday(): string {
    const today = new Date();
    return today.toISOString().split('T')[0]; // yyyy-MM-dd
  }


  clearFilters(): void {
    const today = this.getToday();
    this.filterFromDate = today;   // ✅ today
    this.filterToDate = today;     // ✅ today
    this.filterStatus = '';
    this.filteredSchedules = [...this.schedules];
    this.currentPage = 1;
    this.updatePagination();
  }

  // ================= PAGINATION =================
  updatePagination(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    this.paginatedData = this.filteredSchedules.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredSchedules.length / this.pageSize);
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

  exportData(type: string): void {
    if (!type) return;

    const data = this.filteredSchedules.map((s, i) => ({
      '#': i + 1,
      'Inquiry ID': s.inquiryId,
      'Schedule Date': s.scheduleDate,
      'Time': s.scheTime,
      'Remark': s.remark,
      'Status': s.inqStatus,
      'Assign To': s.assignTo
    }));

    if (type === 'pdf') {
      const doc = new jsPDF();
      autoTable(doc, {
        head: [Object.keys(data[0])],
        body: data.map(d => Object.values(d)),
        startY: 20
      });
      doc.save('schedule-report.pdf');
    }

    if (type === 'excel') {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Schedules');
      XLSX.writeFile(wb, 'schedule-report.xlsx');
    }
  }

}
