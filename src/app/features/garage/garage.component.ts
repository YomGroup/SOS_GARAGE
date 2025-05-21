import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-garage',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="container mx-auto px-4 py-8">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: []
})
export class GarageComponent {
  constructor() {}
} 