import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../services/product.service';
import { PurchaseOrderService } from '../../services/purchase-order.service';
import { Product } from '../../models/product.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-purchase-order-form',
  templateUrl: './purchase-order-form.component.html',
  styleUrls: ['./purchase-order-form.component.css']
})
export class PurchaseOrderFormComponent implements OnInit {

  supplierName = '';
  products: Product[] = [];
  items: any[] = [];

  constructor(
    private productService: ProductService,
    private poService: PurchaseOrderService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.productService.getAll().subscribe(res => {
      this.products = res;
    });
  }

  addItem(product: Product, qty: number) {
    if (!qty || qty <= 0) return;

    this.items.push({
      product,
      quantity: qty,
      price: product.unitPrice
    });
  }

  get total() {
    return this.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  }

  save() {
    const order = {
      supplierName: this.supplierName,
      items: this.items
    };

    this.poService.create(order).subscribe(() => {
      this.router.navigate(['/purchase-orders']);
    });
  }
}
