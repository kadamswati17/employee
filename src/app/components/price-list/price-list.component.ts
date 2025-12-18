import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PriceMasterService } from 'src/app/services/price-master.service';

@Component({
  selector: 'app-price-list',
  templateUrl: './price-list.component.html',
  styleUrls: ['./price-list.component.css']
})
export class PriceListComponent implements OnInit {

  form!: FormGroup;

  parties: any[] = [];
  products: any[] = [];

  // 🔹 FULL DATA FROM BACKEND
  priceList: any[] = [];

  // 🔹 PAGINATED DATA (DISPLAY)
  paginatedPriceList: any[] = [];

  // 🔹 PAGINATION
  page = 1;
  pageSize = 5;

  // 🔹 EDIT STATE
  isEdit: boolean = false;
  editId: number | null = null;

  // 🔹 PARTY FILTER
  selectedPartyId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private priceService: PriceMasterService
  ) { }

  // ================= INIT =================
  ngOnInit(): void {
    this.form = this.fb.group({
      party: ['', Validators.required],
      product: ['', Validators.required],
      price: ['', Validators.required]
    });

    this.loadParties();
    this.loadProducts();
    this.loadPriceList();

    // ✅ FILTER TABLE WHEN PARTY CHANGES
    this.form.get('party')?.valueChanges.subscribe(party => {
      this.selectedPartyId = party ? party.id : null;
      this.page = 1;
      this.applyPartyFilter();
    });
  }

  // ================= LOAD PARTIES =================
  loadParties(): void {
    this.priceService.getParties().subscribe({
      next: (data) => this.parties = data,
      error: () => alert('Failed to load parties')
    });
  }

  // ================= LOAD PRODUCTS =================
  loadProducts(): void {
    this.priceService.getProducts().subscribe({
      next: (data) => this.products = data,
      error: () => alert('Failed to load products')
    });
  }

  // ================= LOAD PRICE LIST =================
  loadPriceList(): void {
    this.priceService.getAllPartyPrices().subscribe({
      next: (data) => {
        // ✅ LATEST FIRST
        this.priceList = data.sort((a: any, b: any) => b.id - a.id);
        this.page = 1;
        this.applyPartyFilter();
      },
      error: () => alert('Failed to load price list')
    });
  }

  // ================= APPLY PARTY FILTER =================
  applyPartyFilter(): void {

    // ❌ NO PARTY SELECTED → SHOW NOTHING
    if (!this.selectedPartyId) {
      this.paginatedPriceList = [];
      return;
    }

    // ✅ PARTY SELECTED → FILTER
    const filtered = this.priceList.filter(
      item => item.partyId === this.selectedPartyId
    );

    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.paginatedPriceList = filtered.slice(start, end);
  }


  // ================= SUBMIT / UPDATE =================
  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value;

    const payload: any = {
      partyId: formValue.party.id,
      productId: formValue.product.id,
      price: formValue.price
    };

    // ✅ UPDATE MODE
    if (this.isEdit && this.editId !== null) {
      payload.id = this.editId;
    }

    this.priceService.savePartyPrice(payload).subscribe({
      next: () => {
        alert(this.isEdit ? 'Price updated successfully' : 'Price added successfully');
        this.resetForm();
        this.loadPriceList();
      },
      error: (err) => {

        // 🔐 HANDLE DUPLICATE / AUTH / VALIDATION
        if (err.status === 401) {
          alert('Duplicate entry not allowed');
          return;
        }

        if (err?.error?.message) {
          alert(err.error.message);
          return;
        }

        alert('Error saving price');
      }
    });
  }

  // ================= EDIT =================
  edit(item: any): void {
    this.isEdit = true;
    this.editId = item.id;

    this.form.patchValue({
      party: this.parties.find(p => p.id === item.partyId),
      product: this.products.find(p => p.id === item.productId),
      price: item.price
    });
  }

  // ================= RESET =================
  resetForm(): void {
    this.form.reset();
    this.isEdit = false;
    this.editId = null;
    this.selectedPartyId = null;
    this.page = 1;
    this.applyPartyFilter();
  }

  // ================= PAGINATION =================
  setPage(page: number): void {
    this.page = page;
    this.applyPartyFilter();
  }
  totalPages(): number {

    if (!this.selectedPartyId) {
      return 0;
    }

    const filtered = this.priceList.filter(
      item => item.partyId === this.selectedPartyId
    );

    return Math.ceil(filtered.length / this.pageSize);
  }

  getSerialNo(i: number): number {
    if (!this.selectedPartyId) return 0;

    const filteredCount = this.priceList.filter(
      item => item.partyId === this.selectedPartyId
    ).length;

    return filteredCount - ((this.page - 1) * this.pageSize + i);
  }


}
