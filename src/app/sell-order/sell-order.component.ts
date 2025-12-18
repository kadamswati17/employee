import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CartItem, PlaceSellOrderDto, SellService } from '../services/sell-order.service';


@Component({
  selector: 'app-sell-order',
  templateUrl: './sell-order.component.html',
  styleUrls: ['./sell-order.component.css']
})
export class SellOrderComponent implements OnInit {

  customers: any[] = [];
  products: any[] = [];
  cartItems: CartItem[] = [];

  myOrders: PlaceSellOrderDto[] = [];
  selectedOrder: PlaceSellOrderDto | null = null;

  cartForm: FormGroup;

  selectedCustomerId: number | null = null;
  selectedProduct: any = null;
  productPrice = 0;
  totalAmount = 0;
  dateValue = '';
  showOrderForm = false;

  currentPage = 1;
  pageSize = 9;
  totalPages = 0;
  paginatedOrders: PlaceSellOrderDto[] = [];

  constructor(
    private fb: FormBuilder,
    private sellService: SellService
  ) {
    this.cartForm = this.fb.group({
      productId: [null, Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.loadCustomers();
    this.loadAllProducts();
    this.loadOrders();
    this.dateValue = new Date().toISOString().substring(0, 10);
  }

  loadCustomers() {
    this.sellService.getCustomers().subscribe(res => this.customers = res);
  }

  onCustomerChange(e: any) {
    this.selectedCustomerId = +e.target.value;
    this.cartItems = [];
    this.totalAmount = 0;
  }

  onProductChange(e: any) {
    const id = +e.target.value;
    this.selectedProduct = this.products.find(p => p.id === id);
    this.productPrice = this.selectedProduct?.unitPrice || 0;
  }

  addToCart() {
    const qty = this.cartForm.value.quantity;
    const item: CartItem = {
      productId: this.selectedProduct.id,
      productName: this.selectedProduct.name,
      price: this.productPrice,
      quantity: qty
    };
    this.cartItems.push(item);
    this.totalAmount += item.price * item.quantity;
  }

  editItem(it: CartItem) {
    it.isEditing = true;
    it.tempQty = it.quantity;
    it.tempPrice = it.price;
  }

  saveItem(it: CartItem) {
    this.totalAmount -= it.price * it.quantity;
    it.quantity = it.tempQty!;
    it.price = it.tempPrice!;
    this.totalAmount += it.price * it.quantity;
    it.isEditing = false;
  }

  removeItem(i: number) {
    const r = this.cartItems.splice(i, 1)[0];
    this.totalAmount -= r.price * r.quantity;
  }

  placeOrder() {
    const dto: PlaceSellOrderDto = {
      userId: this.selectedCustomerId!,
      cartItems: this.cartItems,
      orderDescription: 'Sell Order'
    };
    this.sellService.placeOrder(dto).subscribe(() => {
      this.showOrderForm = false;
      this.loadOrders();
    });
  }

  loadOrders() {
    this.sellService.getSellOrders().subscribe(res => {
      this.myOrders = res.reverse();
      this.totalPages = Math.ceil(this.myOrders.length / this.pageSize);
      this.setPage(1);
    });
  }

  setPage(p: number) {
    this.currentPage = p;
    const s = (p - 1) * this.pageSize;
    this.paginatedOrders = this.myOrders.slice(s, s + this.pageSize);
  }

  nextPage() { this.setPage(this.currentPage + 1); }
  prevPage() { this.setPage(this.currentPage - 1); }

  getOrderDetailsById(id: number) {
    this.sellService.getSellOrderDetails(id).subscribe(res => this.selectedOrder = res);
  }

  loadAllProducts() {
    this.sellService.getAllProducts().subscribe(res => this.products = res);
  }

  calculateGrandTotal(items: CartItem[] | undefined): number {
    if (!items || items.length === 0) {
      return 0;
    }
    return items.reduce(
      (sum, item) => sum + (item.price * item.quantity),
      0
    );
  }

}
