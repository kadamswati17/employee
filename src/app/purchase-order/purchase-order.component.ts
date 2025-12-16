import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import {
  PurchaseService,
  CartItem,
  PlacePurchaseOrderDto
} from '../services/purchase-order.service';

@Component({
  selector: 'app-purchase-order',
  templateUrl: './purchase-order.component.html',
  styleUrls: ['./purchase-order.component.css']
})
export class PurchaseOrderComponent implements OnInit {

  /* ================= DATA ================= */
  parents: any[] = [];        // suppliers
  products: any[] = [];       // products by supplier
  cartItems: CartItem[] = [];

  myOrders: PlacePurchaseOrderDto[] = [];
  selectedOrder: PlacePurchaseOrderDto | null = null;

  /* ================= FORM ================= */
  cartForm: FormGroup;

  /* ================= STATE ================= */
  selectedParentId: number | null = null;
  selectedProduct: any = null;
  productPrice = 0;
  totalAmount = 0;
  dateValue = '';
  showOrderForm = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private purchaseService: PurchaseService
  ) {
    this.cartForm = this.fb.group({
      productId: [null, Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]]
    });
  }

  /* ================= INIT ================= */
  ngOnInit(): void {
    this.loadSuppliers();
    this.loadOrders();
    this.dateValue = new Date().toISOString().substring(0, 10);
  }

  /* ================= SUPPLIERS ================= */
  loadSuppliers(): void {
    this.authService.getSuppliers().subscribe({
      next: res => {
        this.parents = res;
      },
      error: err => {
        console.error('Supplier load error', err);
      }
    });
  }

  onParentChange(event: any): void {
    const userId = Number(event.target.value);

    this.selectedParentId = userId;

    // 🔥 RESET EVERYTHING
    this.products = [];
    this.cartItems = [];
    this.selectedProduct = null;
    this.productPrice = 0;
    this.totalAmount = 0;

    this.cartForm.reset({ productId: null, quantity: 1 });

    if (!userId) return;

    // 🔥 LOAD PRODUCTS CREATED BY THIS USER
    this.purchaseService.getAllProductsByUserId(userId).subscribe({
      next: res => {
        this.products = res;
        console.log('Products for supplier', userId, res);
      },
      error: err => {
        console.error('Product load error', err);
        this.products = [];
      }
    });
  }

  /* ================= PRODUCTS ================= */
  onProductChange(event: any): void {
    const productId = Number(event.target.value);

    this.selectedProduct = this.products.find(p => p.id === productId) || null;
    this.productPrice = this.selectedProduct?.unitPrice || 0;
  }

  /* ================= CART ================= */
  addToCart(): void {
    if (!this.selectedProduct) return;

    const qty = this.cartForm.value.quantity;

    const item: CartItem = {
      productId: this.selectedProduct.id,
      productName: this.selectedProduct.name,
      price: this.selectedProduct.unitPrice,
      quantity: qty,
      productImg: this.selectedProduct.img
    };

    this.cartItems.push(item);
    this.totalAmount += item.price * item.quantity;

    // optional backend save
    this.purchaseService.saveCartItem(item).subscribe();
  }

  removeItem(index: number): void {
    const removed = this.cartItems.splice(index, 1)[0];
    this.totalAmount -= removed.price * removed.quantity;
  }

  /* ================= ORDER ================= */
  placeOrder(): void {
    if (!this.selectedParentId || this.cartItems.length === 0) return;

    const dto: PlacePurchaseOrderDto = {
      userId: this.selectedParentId,
      orderDescription: 'Purchase Order',
      address: 'Pune',
      email: 'test@gmail.com',
      mobile: '9999999999',
      pincode: '411001',
      cartItems: this.cartItems
    };

    this.purchaseService.placeOrder(dto).subscribe({
      next: () => {
        this.cartItems = [];
        this.totalAmount = 0;
        this.showOrderForm = false;
        this.loadOrders();
      },
      error: err => {
        console.error('Order failed', err);
      }
    });
  }

  /* ================= ORDERS ================= */
  loadOrders(): void {
    this.purchaseService.getPurchaseOrders().subscribe({
      next: res => {
        this.myOrders = res.reverse();
      },
      error: err => {
        console.error('Order load error', err);
      }
    });
  }

  changeOrderStatus(orderId: number, status: string): void {
    this.purchaseService.changeOrderStatus(orderId, status).subscribe({
      next: () => this.loadOrders(),
      error: err => console.error(err)
    });
  }

  getOrderDetailsById(orderId: number): void {
    this.purchaseService.getPurchaseOrderDetails(orderId).subscribe({
      next: res => this.selectedOrder = res,
      error: err => console.error(err)
    });
  }
}
