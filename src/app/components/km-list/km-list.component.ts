import { Component, OnInit } from '@angular/core';
import { KmService } from 'src/app/services/KmService';

@Component({
  selector: 'app-km-list',
  templateUrl: './km-list.component.html',
  styleUrls: ['./km-list.component.css']
})
export class KmListComponent implements OnInit {

  kmList: any[] = [];
  pagedKm: any[] = [];

  pageSize = 7;   // 🔥 Show 7 records per page
  currentPage = 1;
  totalPages = 1;

  constructor(private kmService: KmService) { }

  ngOnInit() {
    this.loadAllKm();
  }

  loadAllKm() {
    this.kmService.getAllKm().subscribe({
      next: (data) => {

        // 🔥 Sort by date descending (latest first)
        this.kmList = data.sort(
          (a, b) => new Date(b.trnDate).getTime() - new Date(a.trnDate).getTime()
        );

        this.totalPages = Math.ceil(this.kmList.length / this.pageSize);
        this.updatePage();
      },
      error: (err) => console.error(err)
    });
  }

  updatePage() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.pagedKm = this.kmList.slice(start, end);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePage();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePage();
    }
  }
}
