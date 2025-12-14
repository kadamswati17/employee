import { Component, OnInit } from '@angular/core';
import { ProductService } from 'src/app/services/product.service';
import { Product } from 'src/app/models/product.model';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit {

  products: Product[] = [];

  constructor(private productService: ProductService) { }

  ngOnInit(): void {
    this.productService.getAll().subscribe({
      next: res => this.products = res,
      error: err => console.error(err)
    });
  }

  imageSrc(img?: string) {
    return img ? `data:image/jpeg;base64,${img}` : '';
  }

  deleteProduct(id?: number) {
    if (!id) return;

    if (!confirm('Are you sure you want to delete this product?')) return;

    this.productService.delete(id).subscribe({
      next: () => {
        this.products = this.products.filter(p => p.id !== id);
        alert('Product deleted successfully');
      },
      error: (err) => {
        alert(err.error?.error || 'Delete failed');
      }
    });
  }

}
