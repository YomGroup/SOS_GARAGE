import { Component, OnInit } from '@angular/core';
import { inject } from '@angular/core';
import { VehicleService } from '../../services/vehicle.service';
import { RouterLink } from '@angular/router';
import { SinistreService } from '../../services/sinistre.service';
import { AuthService } from '../../services/auth.service';
import { AssureService } from '../../services/assure.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [RouterLink, CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  private vehiculeService = inject(VehicleService);
  private sinistreService = inject(SinistreService);
  private authService = inject(AuthService);
  private assureService = inject(AssureService);
  userid: string | null = null;
  assureId: number = 0;
  sinistreDataLimited: any = [];


  vehiclesCount: number = 0;
  sinistreData: any;
  sinistreCount: number = 0;
  ngOnInit(): void {
    this.userid = this.authService.getToken()?.['sub'] ?? null;

    if (this.userid) {
      this.assureService.getAssurerID(this.userid).subscribe({
        next: (data: any) => {
          this.assureId = data.id; // adapte selon ta réponse
          this.loadVehicules(this.assureId);
          this.loadSinistre(); // tu peux aussi appeler ici
        },
        error: (err) => {
          console.error('Erreur lors de la récupération de l’assure  ID :', err);
        }
      });
    }
  }
  loadVehicules(assureId: number): void {
    this.vehiculeService.getVehiculesDataById(assureId).subscribe({
      next: (data: any) => {
        console.log('Véhicules reçus :', data);

        this.vehiclesCount = data.length;
        console.log('Véhicules reçus :', data);
      },
      error: (err) => {
        console.error('Erreur lors de l’appel API véhicules :', err);
      }
    });
  }


  private loadSinistre(): void {
    this.sinistreService.getsinistreGet(this.assureId).subscribe({
      next: (data: any) => {
        if (Array.isArray(data)) {
          this.sinistreData = data;
          this.sinistreDataLimited = this.sinistreData.slice(0, 3);
          this.sinistreCount = data.length;
        } else if (data) {
          this.sinistreData = [data];
          this.sinistreDataLimited = this.sinistreData.slice(0, 3);
          this.sinistreCount = 1;
        } else {
          this.sinistreData = [];
          this.sinistreDataLimited = [];
          this.sinistreCount = 0;
        }
      },
      error: (err) => {
        console.error('Erreur lors du chargement des données utilisateur', err);
      }
    });

  }


}
