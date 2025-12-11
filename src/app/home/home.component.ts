import { Component, OnInit, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { VehicleService } from '../../services/vehicle.service';
import { SinistreService } from '../../services/sinistre.service';
import { AuthService } from '../../services/auth.service';
import { AssureService } from '../../services/assure.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {

  // Regroupe les statuts techniques en 3 familles
getMainStatus(statut: string): 'nonTraite' | 'enCours' | 'termine' {
  if (!statut) return 'nonTraite';

  if (statut === 'NON_TRAITEE') {
    return 'nonTraite';
  }

  if ([
    'EN_ATTENTE_TRAITEMENT',
    'EN_ATTENTE_EXPERTISE',
    'EN_COURS_REPARATION',
    'EN_ATTENTE_RDV',
    'EN_ATTENTE_VALIDATION_ASSURANCE'
  ].includes(statut)) {
    return 'enCours';
  }

  if (statut === 'REPARATION_TERMINEE') {
    return 'termine';
  }

  return 'nonTraite';
}

// Texte lisible pour le statut
formatStatut(statut: string): string {
  if (!statut) return 'Statut inconnu';

  const mapping: { [key: string]: string } = {
    'NON_TRAITEE': 'Non traitée',
    'EN_ATTENTE_TRAITEMENT': 'En attente de traitement',
    'EN_ATTENTE_EXPERTISE': "En attente d'expertise",
    'EN_COURS_REPARATION': 'En cours de réparation',
    'EN_ATTENTE_RDV': 'En attente de rendez-vous',
    'EN_ATTENTE_VALIDATION_ASSURANCE': 'En attente de validation assurance',
    'REPARATION_TERMINEE': 'Réparation terminée'
  };

  return mapping[statut] ?? statut.replace(/_/g, ' ').toLowerCase();
}

// Texte lisible pour l’état véhicule
formatEtat(etat?: string | null): string {
  if (!etat) return 'Inconnu';

  const normalized = etat.toUpperCase();
  if (normalized === 'ROULANT') return 'Roulant';
  if (normalized === 'NON_ROULANT') return 'Non roulant';

  return etat;
}


  private sinistreService = inject(SinistreService);
  private authService = inject(AuthService);
  private assureService = inject(AssureService);
  private router = inject(Router);   // ✅ injection du Router

  userid: string | null = null;
  assureId: number = 0;

  vehiclesCount = 0;
  sinistreCount = 0;
  sinistreEnCoursCount = 0;

  latestVehiclesWithClaims: any[] = [];
  recentVehicles: any[] = [];
  recentSinistres: any[] = [];

  vehicules: any[] = [];
  vehiculesDataLimited: any[] = [];
  sinistreOpenStates: { [id: number]: boolean } = {};

  ngOnInit(): void {
    this.userid = this.authService.getToken()?.['sub'] ?? null;

    if (this.userid) {
      this.assureService.getAssurerID(this.userid).subscribe({
        next: (data: any) => {
          this.assureId = data.id;
          this.loadDashboard();
        },
        error: err => console.error('Erreur assure ID', err)
      });
    }
  }

  loadDashboard() {
    this.sinistreService.getDashboard(this.assureId).subscribe({
      next: (data) => {
        this.vehiclesCount = data.vehiclesCount;
        this.sinistreCount = data.sinistreCount;
        this.sinistreEnCoursCount = data.sinistreEnCoursCount;

        this.latestVehiclesWithClaims = data.latestVehiclesWithClaims ?? [];
        this.recentVehicles = data.recentVehicles ?? [];
        this.recentSinistres = data.recentSinistres ?? [];

        this.vehicules = data.recentVehicles ?? [];
        this.vehiculesDataLimited = (data.latestVehiclesWithClaims ?? []).slice(0, 5);
      },
      error: (err) => console.error('Erreur dashboard', err)
    });
  }

  toggleSinistreList(vehicleId: number) {
    this.sinistreOpenStates[vehicleId] = !this.sinistreOpenStates[vehicleId];
  }

  getTimeSince(dateArr: number[]): string {
    const date = new Date(
      dateArr[0], dateArr[1] - 1, dateArr[2],
      dateArr[3], dateArr[4], dateArr[5]
    );

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMin / 60);

    if (diffMin < 1) return 'À l’instant';
    if (diffMin < 60) return `Il y a ${diffMin} min`;
    if (diffHrs < 24) return `Il y a ${diffHrs} h`;

    return date.toLocaleDateString();
  }

  // ✅ méthode appelée dans le (click)
  goToSinistreDetail(sinistreId: number) {
    this.router.navigate(
      ['/clientDashboard/sinistre'],
      { queryParams: { sinistreId } }
    );
  }
}
