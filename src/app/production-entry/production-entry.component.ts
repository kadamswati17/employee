import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ProductionService } from '../services/ProductionService';

@Component({
  selector: 'app-production-entry',
  templateUrl: './production-entry.component.html',
  styleUrls: ['./production-entry.component.css']
})
export class ProductionEntryComponent implements OnInit {

  productionForm!: FormGroup;
  productionList: any[] = [];
  showForm = false;
  editId: number | null = null;

  siloList: number[] = [];

  constructor(
    private fb: FormBuilder,
    private service: ProductionService
  ) { }

  ngOnInit(): void {

    // 1️⃣ Silo dropdown (1–100)
    this.siloList = Array.from({ length: 5 }, (_, i) => i + 1);

    // 2️⃣ Form initialization
    this.productionForm = this.fb.group({
      shift: [''],
      productionDate: [''],

      siloNo1: [''],
      literWeight1: [''],
      faSolid1: [''],

      siloNo2: [''],
      literWeight2: [''],
      faSolid2: [''],

      waterLiter: [''],
      cementKg: [''],
      limeKg: [''],
      gypsumKg: [''],
      solOilKg: [''],
      aiPowerGm: [''],
      tempC: [''],

      castingTime: [''],
      productionTime: [''],
      productionRemark: [''],
      remark: [''],

      userId: [1],
      branchId: [1],
      orgId: [1]
    });

    // 3️⃣ Auto set today date
    const today = new Date().toISOString().substring(0, 10);
    this.productionForm.patchValue({
      productionDate: today
    });

    // 4️⃣ Auto set shift by time
    this.setShiftByTime();

    // 5️⃣ Load table data
    this.loadData();
  }


  setShiftByTime() {
    const hour = new Date().getHours();

    if (hour >= 9 && hour < 18) {
      this.productionForm.patchValue({ shift: 'G' }); // General
    }
    else if (hour >= 6 && hour < 14) {
      this.productionForm.patchValue({ shift: '1' });
    }
    else if (hour >= 14 && hour < 22) {
      this.productionForm.patchValue({ shift: '2' });
    }
    else {
      this.productionForm.patchValue({ shift: '3' });
    }
  }


  calculateTotalSolid(): number {
    const fa1 = +this.productionForm.value.faSolid1 || 0;
    const fa2 = +this.productionForm.value.faSolid2 || 0;
    return fa1 + fa2;
  }

  openForm() {
    this.showForm = true;
    this.editId = null;
    this.productionForm.reset({
      userId: 1,
      branchId: 1,
      orgId: 1
    });
    this.setTodayDate();
    this.setShiftByTime();
  }

  submit() {
    const payload = {
      ...this.productionForm.value,
      totalSolid: this.calculateTotalSolid()
    };

    if (this.editId) {
      this.service.update(this.editId, payload).subscribe(() => {
        this.afterSave();
      });
    } else {
      this.service.save(payload).subscribe(() => {
        this.afterSave();
      });
    }
  }

  afterSave() {
    this.showForm = false;
    this.loadData();
  }

  edit(row: any) {
    this.editId = row.id;
    this.showForm = true;
    this.productionForm.patchValue(row);
  }

  delete(id: number) {
    if (confirm('Delete this production entry?')) {
      this.service.delete(id).subscribe(() => this.loadData());
    }
  }

  loadData() {
    this.service.getAll().subscribe(res => this.productionList = res);
  }

  setTodayDate() {
    const today = new Date().toISOString().substring(0, 10);
    this.productionForm.patchValue({ productionDate: today });
  }

}
