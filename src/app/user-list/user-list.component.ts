import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../services/UserService';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit {

  users: any[] = [];

  // 🔹 PAGINATION
  page = 1;
  pageSize = 5;
  paginatedUsers: any[] = [];

  isLoading = false;

  constructor(
    private userService: UserService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading = true;
    this.userService.getAllUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.setPage(1); // ✅ init pagination
        this.isLoading = false;
      }
    });
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

  addUser() {
    this.router.navigate(['/users/add']);
  }

  editUser(id: number) {
    this.router.navigate(['/users/edit', id]);
  }

  deleteUser(id: number) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.userService.deleteUser(id).subscribe(() => {
        this.loadUsers();
      });
    }
  }

  activate(id: number) {
    if (confirm("Activate this user?")) {
      this.userService.activateUser(id).subscribe(() => {
        alert("User activated!");
        this.loadUsers();
      });
    }
  }

  deactivate(id: number) {
    if (confirm("Deactivate this user?")) {
      this.userService.deactivateUser(id).subscribe(() => {
        alert("User deactivated!");
        this.loadUsers();
      });
    }
  }
}
