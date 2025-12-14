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

  imagePreview: string | null = null;

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
      password: [''],               // 🔧 not required by default
      role: ['', Validators.required],
      mobile: [''],
      profileImage: ['']
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.userId = +id;
      this.loadUser(this.userId);
    } else {
      // password required ONLY when creating
      this.form.get('password')?.setValidators(Validators.required);
    }
  }

  loadUser(id: number) {
    this.userService.getUser(id).subscribe(user => {
      this.form.patchValue({
        username: user.username,
        email: user.email,
        role: user.role,
        mobile: user.mobile
        // ❌ do NOT patch profileImage blindly
      });

      this.imagePreview = user.profileImage || null;
    });
  }

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      this.imagePreview = base64;
      this.form.patchValue({ profileImage: base64 });
    };
    reader.readAsDataURL(file);
  }

  onSubmit() {
    if (this.form.invalid) return;

    const payload = { ...this.form.value };

    // 🔥 prevent empty overwrite
    if (!payload.profileImage) {
      delete payload.profileImage;
    }

    if (!payload.password) {
      delete payload.password;
    }

    if (this.isEdit) {
      this.userService.updateUser(this.userId!, payload)
        .subscribe(() => this.router.navigate(['/users']));
    } else {
      this.userService.createUser(payload)
        .subscribe(() => this.router.navigate(['/users']));
    }
  }
}
