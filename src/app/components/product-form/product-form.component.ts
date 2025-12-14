import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Product } from 'src/app/models/product.model';
import { ProductService } from 'src/app/services/product.service';
// import { ProductService } from '../../../services/product.service';
// import { Product } from '../../../models/product.model';

@Component({
  selector: 'app-product-form',
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.css']
})
export class ProductFormComponent {

  product: Product = {
    name: '',
    unitPrice: 0,
    description: '',
    img: ''
  };

  previewImage: string | null = null;
  loggedInUser: any = JSON.parse(localStorage.getItem('user')!);

  constructor(
    private productService: ProductService,
    private router: Router
  ) { }

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      this.product.img = base64.split(',')[1];
      this.previewImage = base64;
    };
    reader.readAsDataURL(file);
  }

  save() {
    this.productService
      .create(this.product, this.loggedInUser.id)
      .subscribe(() => {
        this.router.navigate(['/products']);
      });
  }

}
