import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LayoutComponent } from './shared/layouts/layout.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LayoutComponent],
  template: `
      <router-outlet></router-outlet>
    
  `
})
export class AppComponent {
  title = 'SOS_GARAGE';
}
