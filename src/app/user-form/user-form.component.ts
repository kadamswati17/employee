import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../services/UserService';

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.css']
})
export class UserFormComponent implements OnInit {

  form!: FormGroup;
  isEdit = false;
  userId: number | null = null;

  // Single-role (because DB column = role)
  roles = [
    'ROLE_ADMIN', 'ROLE_USER',
    'ROLE_L1', 'ROLE_L2', 'ROLE_L3', 'ROLE_L4', 'ROLE_L5'
  ];

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private route: ActivatedRoute,
    public router: Router
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      role: ['', Validators.required]   // ⬅ updated: single role
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.userId = +id;
      this.loadUser(this.userId);
    }
  }

  loadUser(id: number) {
    this.userService.getUser(id).subscribe(user => {
      this.form.patchValue({
        username: user.username,
        email: user.email,
        role: user.role   // ⬅ single role
      });

      // Password not required when editing
      this.form.get('password')?.clearValidators();
      this.form.get('password')?.updateValueAndValidity();
    });
  }

  onSubmit() {
    if (this.form.invalid) return;

    if (this.isEdit) {
      this.userService.updateUser(this.userId!, this.form.value).subscribe(() => {
        this.router.navigate(['/users']);
      });
    } else {
      this.userService.createUser(this.form.value).subscribe(() => {
        this.router.navigate(['/users']);
      });
    }
  }
}
