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
  products: any[] = [];       // products
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

  /* ================= PAGINATION ================= */
  currentPage = 1;
  pageSize = 9;
  totalPages = 0;
  paginatedOrders: PlacePurchaseOrderDto[] = [];

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
    this.loadAllProducts();
    this.loadOrders();
    this.dateValue = new Date().toISOString().substring(0, 10);
  }

  /* ================= SUPPLIERS ================= */
  loadSuppliers(): void {
    this.authService.getSuppliers().subscribe({
      next: res => {
        this.parents = res; // already ROLE_PARTY_NAME only
      },
      error: err => console.error(err)
    });
  }

  onParentChange(event: any): void {
    const userId = Number(event.target.value);
    this.selectedParentId = userId;

    // reset cart & totals
    this.cartItems = [];
    this.totalAmount = 0;
    this.selectedProduct = null;
    this.productPrice = 0;

    this.cartForm.reset({ productId: null, quantity: 1 });
  }

  /* ================= PRODUCTS ================= */
  onProductChange(event: any): void {
    const productId = Number(event.target.value);
    this.selectedProduct = this.products.find(p => p.id === productId) || null;
    this.productPrice = this.selectedProduct?.unitPrice || 0;
  }

  addToCart(): void {
    if (!this.selectedProduct) return;

    const qty = this.cartForm.value.quantity;

    const existingItem = this.cartItems.find(
      item => item.productId === this.selectedProduct.id
    );

    if (existingItem) {
      existingItem.quantity += qty;
      this.totalAmount += existingItem.price * qty;
    } else {
      const item: CartItem = {
        productId: this.selectedProduct.id,
        productName: this.selectedProduct.name,
        price: this.productPrice,
        quantity: qty,
        productImg: this.selectedProduct.img
      };

      this.cartItems.push(item);
      this.totalAmount += item.price * item.quantity;

      this.purchaseService.saveCartItem(item).subscribe();
    }

    this.cartForm.patchValue({ quantity: 1 });
  }

  removeItem(index: number): void {
    const removed = this.cartItems.splice(index, 1)[0];
    this.totalAmount -= removed.price * removed.quantity;
  }

  /* ================= PLACE ORDER ================= */
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
        this.setupPagination();
      },
      error: err => {
        console.error('Order load error', err);
      }
    });
  }

  getOrderDetailsById(orderId: number): void {
    this.purchaseService.getPurchaseOrderDetails(orderId).subscribe({
      next: res => {
        this.selectedOrder = res;
      },
      error: err => console.error(err)
    });
  }

  calculateGrandTotal(items: CartItem[] | undefined): number {
    if (!items) return 0;
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  /* ================= CART EDIT ================= */
  editItem(item: CartItem): void {
    item.isEditing = true;
    item.tempQty = item.quantity;
    item.tempPrice = item.price;
  }

  saveItem(item: CartItem): void {
    if (
      !item.tempQty || item.tempQty < 1 ||
      item.tempPrice == null || item.tempPrice < 0
    ) return;

    this.totalAmount -= item.price * item.quantity;
    item.quantity = item.tempQty;
    item.price = item.tempPrice;
    this.totalAmount += item.price * item.quantity;

    item.isEditing = false;
  }

  /* ================= PRODUCTS ================= */
  loadAllProducts(): void {
    this.purchaseService.getAllProducts().subscribe({
      next: res => {
        this.products = res;
      },
      error: err => {
        console.error('Product load error', err);
        this.products = [];
      }
    });
  }

  /* ================= PAGINATION ================= */
  setupPagination(): void {
    this.totalPages = Math.ceil(this.myOrders.length / this.pageSize);
    this.setPage(1);
  }

  setPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;

    this.currentPage = page;
    const start = (page - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.paginatedOrders = this.myOrders.slice(start, end);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.setPage(this.currentPage + 1);
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.setPage(this.currentPage - 1);
    }
  }

  parentOpen = false;
  productOpen = false;

  selectedParent: any = null;

  /* SUPPLIER DROPDOWN */
  toggleParentDropdown() {
    this.parentOpen = !this.parentOpen;
    this.productOpen = false;
  }

  selectParent(p: any) {
    this.selectedParent = p;
    this.selectedParentId = p.id;
    this.parentOpen = false;

    this.cartItems = [];
    this.totalAmount = 0;
  }

  /* PRODUCT DROPDOWN */
  toggleProductDropdown() {
    this.productOpen = !this.productOpen;
    this.parentOpen = false;
  }

  selectProduct(pr: any) {
    this.selectedProduct = pr;
    this.productPrice = pr.unitPrice || 0;
    this.productOpen = false;
  }

}
