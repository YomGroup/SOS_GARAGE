import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LayoutComponent } from './shared/layouts/layout.component';
import { HeaderComponent } from './header/header.component';
import { KeycloakService } from 'keycloak-angular';
import { AuthService } from '../services/auth.service';
import { RoleRedirectService } from './core/services/role-redirect.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LayoutComponent, HeaderComponent],
  template: `
    <router-outlet></router-outlet>
  `
})
export class AppComponent implements OnInit {

  title = 'SOS_GARAGE';


  private authService = inject(AuthService);
  private roleRedirectService = inject(RoleRedirectService);

  async ngOnInit() {
    await this.authService.init();

    const username = this.authService.getUsername();
    const roles = this.authService.getRoles();

    console.log('👤 Username:', username);
    console.log('��️ Roles:', roles);

    // Redirige l'utilisateur vers son dashboard selon son rôle après connexion
    await this.roleRedirectService.handleLoginRedirect();
  }
}
