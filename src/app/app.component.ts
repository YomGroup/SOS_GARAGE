import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LayoutComponent } from './shared/layouts/layout.component';
import { HeaderComponent } from './header/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LayoutComponent, HeaderComponent],
  template: `
     
      <router-outlet></router-outlet>
  `
})
export class AppComponent {
  title = 'SOS_GARAGE';
}
