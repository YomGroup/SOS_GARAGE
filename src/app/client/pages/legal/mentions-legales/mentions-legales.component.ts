import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mentions-legales',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mentions-legales.component.html',
  styleUrls: ['./mentions-legales.component.css']
})
export class MentionsLegalesComponent {
  lastUpdate: string = 'Février 2025';

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}