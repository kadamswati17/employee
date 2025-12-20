import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LocationService } from 'src/app/services/LocationService';

@Component({
  selector: 'app-city-master',
  templateUrl: './city-master.component.html',
  styleUrls: ['./city-master.component.css']
})
export class CityMasterComponent implements OnInit {

  form!: FormGroup;

  talukas: any[] = [];
  cities: any[] = [];
  paginatedCities: any[] = [];

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
      talukaId: ['', Validators.required]
    });

    this.loadTalukas();
    this.loadCities();
  }

  // ================= LOAD =================

  loadTalukas(): void {
    this.service.getAllTalukas().subscribe(res => {
      this.talukas = res;
    });
  }

  loadCities(): void {
    this.service.getAllCities().subscribe((res: any[]) => {
      this.cities = res.sort((a, b) => b.id - a.id);
      this.setPage(1);
    });
  }

  // ================= SUBMIT =================

  onSubmit(): void {
    if (this.form.invalid) return;

    const payload: any = {
      name: this.form.value.name.trim()
    };

    this.service
      .addCity(payload, this.form.value.talukaId)
      .subscribe(() => {
        alert('City Saved');
        this.reset();
        this.loadCities();
      });
  }

  // ================= EDIT =================

  // edit(c: any): void {
  //   this.isEdit = true;
  //   this.editId = c.id;

  //   this.form.patchValue({
  //     name: c.name,
  //     talukaId: c.taluka?.id
  //   });
  // }
  edit(c: any): void {
    this.isEdit = true;
    this.editId = c.cityId;

    this.form.patchValue({
      name: c.cityName,
      talukaId: c.talukaId
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
    this.paginatedCities = this.cities.slice(start, start + this.pageSize);
  }

  totalPages(): number {
    return Math.ceil(this.cities.length / this.pageSize);
  }
}
