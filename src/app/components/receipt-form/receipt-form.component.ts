import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ReceiptService } from 'src/app/services/receiptService';
import { UserService } from 'src/app/services/UserService';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-receipt-form',
  templateUrl: './receipt-form.component.html',
  styleUrls: ['./receipt-form.component.css']
})
export class ReceiptFormComponent implements OnInit {

  form!: FormGroup;
  isEdit = false;
  id: number | null = null;

  users: any[] = [];
  uploadedFile: File | null = null;
  selectedFileName: string | null = null;

  today = new Date().toISOString().split("T")[0];


  constructor(
    private fb: FormBuilder,
    private receiptService: ReceiptService,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {

    this.form = this.fb.group({
      partyId: [''],
      // mobile: [''],
      amount: [''],
      transactionType: ['1'],
      paymentMode: ['0'],
      transactionId: [''],
      receiptDate: [this.today],
      description: ['']
    });

    this.loadUsers();

    this.id = Number(this.route.snapshot.paramMap.get("id"));
    if (this.id) {
      this.isEdit = true;
      this.loadExisting();
    }
  }

  loadUsers() {
    this.userService.getAllUsers().subscribe(res => {
      this.users = res;
    });
  }

  loadExisting() {
    this.receiptService.getById(this.id!).subscribe(r => {
      this.form.patchValue(r);
      if (r.receiptImage) {
        this.selectedFileName = "(Existing Image)";
      }
    });
  }

  onPartyChange(event: any) {
    const userId = event.target.value;
    const u = this.users.find(x => x.id == userId);
    // if (u) this.form.patchValue({ mobile: u.mobile });
  }

  triggerFile() {
    document.getElementById("fileUpload")?.click();
  }

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.uploadedFile = file;
    this.selectedFileName = file.name;
  }

  submit() {
    const formData = new FormData();

    Object.entries(this.form.value).forEach(([k, v]) => {
      formData.append(k, v as any);
    });

    if (this.uploadedFile) {
      formData.append("receiptImage", this.uploadedFile);
    }

    if (this.isEdit) {
      this.receiptService.update(this.id!, formData).subscribe(() => {
        alert("Updated!");
        this.router.navigate(['/receipts']);
      });
    } else {
      this.receiptService.create(formData).subscribe(() => {
        alert("Saved!");
        this.router.navigate(['/receipts']);
      });
    }
  }

  close() {
    this.router.navigate(['/receipts']);
  }

}
