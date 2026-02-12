import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LocationService } from 'src/app/services/LocationService';

@Component({
  selector: 'app-taluka-master',
  templateUrl: './taluka-master.component.html',
  styleUrls: ['./taluka-master.component.css']
})
export class TalukaMasterComponent implements OnInit {

  form!: FormGroup;

  districts: any[] = [];
  talukas: any[] = [];
  paginatedTalukas: any[] = [];

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
      name: ['', Validators.required],
      districtId: ['', Validators.required]
    });

    this.loadDistricts();
    this.loadTalukas();
    // this.loadTalukas();
  }

  // ================= LOAD =================

  loadDistricts(): void {
    this.service.getAllDistricts().subscribe(res => {
      this.districts = res;
    });
  }

  loadTalukas(): void {
    this.service.getAllTalukas().subscribe((res: any[]) => {
      this.talukas = res.sort((a, b) => b.id - a.id);
      this.setPage(1);
    });
  }

  // ================= SUBMIT =================
  onSubmit(): void {
    if (this.form.invalid) return;

    const payload: any = {
      name: this.form.value.name.trim()
    };

    const districtId = this.form.value.districtId;

    // ✅ UPDATE MODE
    if (this.isEdit && this.editId) {
      this.service.updateTaluka(payload, this.editId, districtId)
        .subscribe(() => {
          alert('Taluka Updated');
          this.reset();
          this.onDistrictChange(); // reload list
        });
    }

    // ✅ CREATE MODE
    else {
      this.service.addTaluka(payload, districtId)
        .subscribe(() => {
          alert('Taluka Saved');
          this.reset();
          this.onDistrictChange(); // reload list
        });
    }
  }


  // ================= EDIT =================

  // edit(t: any): void {
  //   this.isEdit = true;
  //   this.editId = t.id;

  //   this.form.patchValue({
  //     name: t.name,
  //     districtId: t.district?.id
  //   });
  // }

  edit(t: any): void {
    this.isEdit = true;
    this.editId = t.id;

    this.form.patchValue({
      name: t.name,
      districtId: t.districtId
    });
  }


  // ================= UTILS =================

  reset(): void {
    this.form.reset();
    this.isEdit = false;
    this.editId = null;
  }

  setPage(page: number): void {
    this.page = page;
    const start = (page - 1) * this.pageSize;
    this.paginatedTalukas = this.talukas.slice(start, start + this.pageSize);
  }

  totalPages(): number {
    return Math.ceil(this.talukas.length / this.pageSize);
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

  onDistrictChange(): void {
    const districtId = this.form.get('districtId')?.value;
    if (!districtId) return;

    this.service.getTalukas(districtId).subscribe(res => {
      this.talukas = res;
      this.setPage(1);
    });
  }

}
