import { Component, OnInit } from '@angular/core';
import { PurchaseOrderService } from '../../services/purchase-order.service';

@Component({
  selector: 'app-purchase-order-list',
  templateUrl: './purchase-order-list.component.html',
  styleUrls: ['./purchase-order-list.component.css']
})
export class PurchaseOrderListComponent implements OnInit {

  orders: any[] = [];

  constructor(private poService: PurchaseOrderService) { }

  ngOnInit(): void {
    this.poService.getAll().subscribe(res => {
      this.orders = res;
    });
  }
}
