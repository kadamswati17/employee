import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserRoleDetailsService } from 'src/app/services/UserRoleDetailsService';
import { LocationService } from 'src/app/services/LocationService';

@Component({
  selector: 'app-user-details',
  templateUrl: './user-details.component.html',
  styleUrls: ['./user-details.component.css']
})
export class UserDetailsComponent implements OnInit {

  form!: FormGroup;

  // 🔹 ORIGINAL DATA (FROM DB)
  allUsers: any[] = [];

  // 🔹 FILTERED + UNIQUE DATA (FOR TABLE)
  users: any[] = [];

  partyUsers: any[] = [];   // ROLE_PARTY_NAME
  roots: any[] = [];        // ROOT MASTER

  // 🔹 LOCATION DATA
  states: any[] = [];
  districts: any[] = [];
  talukas: any[] = [];
  cities: any[] = [];

  isEdit: boolean = false;
  editId: number | null = null;

  // 🔹 PAGINATION
  page = 1;
  pageSize = 3;
  paginatedUsers: any[] = [];

  constructor(
    private fb: FormBuilder,
    private service: UserRoleDetailsService,
    private locationService: LocationService
  ) { }

  // ================= INIT =================

  ngOnInit(): void {
    this.form = this.fb.group({
      username: ['', Validators.required],
      rootName: ['', Validators.required],
      gstNo: ['', Validators.required],
      address: [''],
      state: [''],
      dist: [''],
      tq: [''],
      city: [''],
      balance: ['']
    });

    this.loadStates();
    this.loadPartyUsers();
    this.loadRoots();
    this.loadUserDetails();

    // 🔹 LIVE FILTERING
    this.form.valueChanges.subscribe(() => {
      this.applyFilter();
    });
  }

  // ================= LOCATION LOAD =================

  loadStates(): void {
    this.locationService.getStates().subscribe(res => {
      this.states = res;
    });
  }

  onStateChange(): void {
    const stateId = this.form.get('state')?.value;

    this.form.patchValue({ dist: '', tq: '', city: '' });
    this.districts = [];
    this.talukas = [];
    this.cities = [];

    if (!stateId) return;

    this.locationService.getDistricts(stateId)
      .subscribe(res => this.districts = res);
  }


  onDistrictChange(): void {
    const districtId = this.form.get('dist')?.value;

    this.form.patchValue({ tq: '', city: '' });
    this.talukas = [];
    this.cities = [];

    if (!districtId) return;

    this.locationService.getTalukas(districtId)
      .subscribe(res => this.talukas = res);
  }


  onTalukaChange(): void {
    const talukaId = this.form.get('tq')?.value;

    this.form.patchValue({ city: '' });
    this.cities = [];

    if (!talukaId) return;

    this.locationService.getCities(talukaId)
      .subscribe(res => this.cities = res);
  }


  // ================= LOAD DATA =================

  loadPartyUsers(): void {
    this.service.getPartyUsers().subscribe(data => {
      this.partyUsers = data;
    });
  }

  loadRoots(): void {
    this.service.getRoots().subscribe(data => {
      this.roots = data;
    });
  }

  loadUserDetails(): void {
    this.service.getAll().subscribe(data => {
      this.allUsers = data.sort((a, b) => b.id - a.id);
      this.applyFilter();
    });
  }

  // ================= FILTER + REMOVE DUPLICATES =================

  applyFilter(): void {
    const { username, rootName, gstNo } = this.form.value;

    let filtered = [...this.allUsers];

    if (username) {
      filtered = filtered.filter(u =>
        u.username?.toLowerCase().includes(username.toLowerCase())
      );
    }

    if (rootName) {
      filtered = filtered.filter(u =>
        u.rootName?.toLowerCase().includes(rootName.toLowerCase())
      );
    }

    if (gstNo) {
      filtered = filtered.filter(u =>
        u.gstNo?.toLowerCase().includes(gstNo.toLowerCase())
      );
    }

    const uniqueMap = new Map<string, any>();
    filtered.forEach(u => {
      const key = `${u.username}_${u.rootName}_${u.gstNo}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, u);
      }
    });

    this.users = Array.from(uniqueMap.values());
    this.setPage(1);
  }

  // ================= SUBMIT / UPDATE =================

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { username, rootName, gstNo } = this.form.value;

    const duplicate = this.allUsers.find(u =>
      u.username === username &&
      u.rootName === rootName &&
      u.gstNo === gstNo &&
      (!this.isEdit || u.id !== this.editId)
    );

    if (duplicate) {
      alert('Duplicate not allowed for same User Name, Root Name and GST No');
      return;
    }

    const payload: any = { ...this.form.value };

    if (this.isEdit && this.editId !== null) {
      payload.id = this.editId;
    }

    this.service.save(payload).subscribe({
      next: () => {
        alert(this.isEdit ? 'Updated successfully' : 'Saved successfully');
        this.resetForm();
        this.loadUserDetails();
      },
      error: () => alert('Error saving record')
    });
  }

  // ================= EDIT =================

  edit(user: any): void {
    this.isEdit = true;
    this.editId = user.id;

    this.form.patchValue({
      username: user.username,
      rootName: user.rootName,
      gstNo: user.gstNo,
      address: user.address,
      state: user.state,
      dist: user.dist,
      tq: user.tq,
      city: user.city,
      balance: user.balance
    });
  }

  // ================= RESET =================

  resetForm(): void {
    this.form.reset();
    this.isEdit = false;
    this.editId = null;
    this.applyFilter();
  }

  // ================= PAGINATION =================

  setPage(page: number): void {
    this.page = page;
    const start = (page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedUsers = this.users.slice(start, end);
  }

  totalPages(): number {
    return Math.ceil(this.users.length / this.pageSize);
  }
}
