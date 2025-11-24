import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CustomerService } from '../services/customer.service';
import { CustomerTrn } from '../models/customer.model';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-customer-form',
  templateUrl: './customer-form.component.html',
  styleUrls: ['./customer-form.component.css']
})
export class CustomerFormComponent implements OnInit {

  customerForm!: FormGroup;
  isSaving = false;
  errorMessage = '';

  cartItems: CustomerTrn[] = [];

  // logged-in user (for createdby)
  currentUserName: string = '';

  constructor(
    private fb: FormBuilder,
    private customerService: CustomerService,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    // const today = new Date().toISOString().substring(0, 10);
    const today = new Date().toLocaleDateString('en-CA');
    this.authService.getCurrentUserFromAPI().subscribe({
      next: (res) => {
        this.currentUserName = res.username; // from /api/auth/me
        this.customerForm.patchValue({ createdby: this.currentUserName });
      },
      error: () => {
        this.currentUserName = 'SYSTEM';
        this.customerForm.patchValue({ createdby: 'SYSTEM' });
      }
    });

    this.customerForm = this.fb.group({
      // header / hidden fields
      // trndate: ['', Validators.required],
      trndate: [today, Validators.required],
      createdby: [this.currentUserName],      // no validators, set programmatically
      aproval1: [''],
      aproval2: [''],
      aproval3: [''],
      aproval4: [''],

      // transaction fields
      customerName: ['', [Validators.required, Validators.minLength(2)]],
      toolingdrawingpartno: ['', Validators.required],
      partdrawingname: ['', Validators.required],
      partdrawingno: ['', Validators.required],
      descriptionoftooling: ['', Validators.required],
      cmworkorderno: ['', Validators.required],
      toolingassetno: ['', Validators.required]
    });

    // ensure createdby control is in sync
    this.customerForm.patchValue({ createdby: this.currentUserName });
  }

  // Add one transaction to cart
  addToCart(): void {
    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      return;
    }

    const v = this.customerForm.value;
    const createdBy = this.currentUserName || 'SYSTEM';

    const item: CustomerTrn = {
      trbactno: undefined,
      trndate: v.trndate,
      createdby: createdBy,
      customerName: v.customerName,
      toolingdrawingpartno: v.toolingdrawingpartno,
      partdrawingname: v.partdrawingname,
      partdrawingno: v.partdrawingno,
      descriptionoftooling: v.descriptionoftooling,
      cmworkorderno: v.cmworkorderno,
      toolingassetno: v.toolingassetno,
      status: 'PENDING'
    };

    this.cartItems.push(item);

    // clear only transaction fields
    this.customerForm.patchValue({
      customerName: '',
      toolingdrawingpartno: '',
      partdrawingname: '',
      partdrawingno: '',
      descriptionoftooling: '',
      cmworkorderno: '',
      toolingassetno: ''
    });

    [
      'customerName',
      'toolingdrawingpartno',
      'partdrawingname',
      'partdrawingno',
      'descriptionoftooling',
      'cmworkorderno',
      'toolingassetno'
    ].forEach(ctrl => {
      const c = this.customerForm.get(ctrl);
      c?.markAsPristine();
      c?.markAsUntouched();
    });
  }

  removeFromCart(index: number): void {
    this.cartItems.splice(index, 1);
  }

  // Save batch + all transactions
  saveTransactions(): void {
    if (this.cartItems.length === 0) {
      alert('Cart is empty. Add at least one transaction.');
      return;
    }

    const trndateCtrl = this.customerForm.get('trndate');
    if (!trndateCtrl || trndateCtrl.invalid) {
      trndateCtrl?.markAsTouched();
      alert('Please fill Transaction Date.');
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    const v = this.customerForm.value;
    const createdBy = this.currentUserName || 'SYSTEM';

    const header = {
      trndate: v.trndate,
      createdby: createdBy,
      aproval1: v.aproval1,
      aproval2: v.aproval2,
      aproval3: v.aproval3,
      aproval4: v.aproval4
    };

    // 1) create batch
    this.customerService.createBatch(header).subscribe({
      next: (batch: any) => {
        const bactno = batch.bactno;

        // 2) for each cart item, create transaction
        const calls = this.cartItems.map(c => {
          const payload: CustomerTrn = {
            ...c,
            trbactno: bactno,
            trndate: header.trndate,
            createdby: createdBy,
            status: c.status || 'PENDING'
          };
          return this.customerService.createTransactionWithBatch(bactno, payload);
        });

        forkJoin(calls).subscribe({
          next: () => {
            this.isSaving = false;
            alert('Batch and transactions saved successfully!');
            this.cartItems = [];
            this.customerForm.reset();
            // set createdby again after reset
            this.customerForm.patchValue({ createdby: createdBy });
            this.router.navigate(['/customers']);
          },
          error: (err) => {
            console.error('Error saving transactions:', err);
            this.isSaving = false;
            this.errorMessage = 'Failed to save transactions.';
          }
        });
      },
      error: (err) => {
        console.error('Error creating batch:', err);
        this.isSaving = false;
        this.errorMessage = 'Failed to create batch.';
      }
    });
  }

  // Cancel: clear form + clear cart
  cancel(): void {
    this.errorMessage = '';
    this.isSaving = false;
    this.cartItems = [];
    this.customerForm.reset();
    // keep createdby filled with current user
    this.customerForm.patchValue({
      createdby: this.currentUserName
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.customerForm.get(fieldName);
    if (!field) return '';
    if (field.hasError('required')) {
      return `${fieldName} is required`;
    }
    if (field.hasError('minlength')) {
      return `${fieldName} must be at least ${field.errors?.['minlength'].requiredLength} characters`;
    }
    return '';
  }


}

