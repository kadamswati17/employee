import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { LocationService } from 'src/app/services/LocationService';

@Component({
  selector: 'app-district-master',
  templateUrl: './district-master.component.html',
  styleUrls: ['./district-master.component.css']
})
export class DistrictMasterComponent implements OnInit {

  form!: FormGroup;

  states: any[] = [];
  districts: any[] = [];
  paginated: any[] = [];

  isEdit = false;
  editId: number | null = null;

  page = 1;
  pageSize = 5;

  constructor(
    private fb: FormBuilder,
    private service: LocationService
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      stateId: ['', Validators.required],
      name: ['', Validators.required]
    });

    this.loadStates();
  }

  // ================= LOAD STATES =================
  loadStates(): void {
    this.service.getStates().subscribe(res => {
      this.states = res;
    });
  }

  // ================= SUBMIT =================
  onSubmit(): void {

    if (this.form.invalid) return;

    const payload = {
      name: this.form.value.name.trim()
    };

    const stateId = this.form.value.stateId;

    if (this.isEdit && this.editId) {

      this.service.updateDistrict(payload, this.editId, stateId)
        .subscribe(() => {
          alert("District Updated");
          this.afterSave(stateId);
        });

    } else {

      this.service.addDistrict(payload, stateId)
        .subscribe(() => {
          alert("District Added");
          this.afterSave(stateId);
        });
    }
  }

  // ================= AFTER SAVE =================
  afterSave(stateId: number) {
    this.reset();
    this.form.patchValue({ stateId });
    this.onStateChange();
  }

  // ================= EDIT =================
  edit(d: any): void {
    this.isEdit = true;
    this.editId = d.id;

    this.form.patchValue({
      name: d.name,
      stateId: d.state?.id
    });
  }

  // ================= RESET =================
  reset(): void {
    this.form.reset();
    this.isEdit = false;
    this.editId = null;
  }

  // ================= PAGINATION =================
  setPage(page: number): void {
    this.page = page;
    const start = (page - 1) * this.pageSize;
    this.paginated = this.districts.slice(start, start + this.pageSize);
  }

  totalPages(): number {
    return Math.ceil(this.districts.length / this.pageSize);
  }

  // ================= FILTER BY STATE =================
  onStateChange(): void {
    const stateId = this.form.get('stateId')?.value;
    if (!stateId) return;

    this.service.getDistricts(stateId).subscribe(res => {
      this.districts = res;
      this.setPage(1);
    });
  }
  nextPage(): void {
    if (this.page < this.totalPages()) {
      this.setPage(this.page + 1);
    }
  }

  prevPage(): void {
    if (this.page > 1) {
      this.setPage(this.page - 1);
    }
  }
}
