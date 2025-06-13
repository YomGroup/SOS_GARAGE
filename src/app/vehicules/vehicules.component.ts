import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface Vehicle {
  id: number;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  type: string;
  energy: string;
  mileage: number;
  status: string;
  power: number;
  gearbox: string;
  purchaseDate: Date;
  purchasePrice: number;
  vin?: string;
  imageUrl?: string;
  insuranceCompany?: string;
  insuranceNumber?: string;
  insuranceExpiry?: Date;
  lastTechnicalCheck?: Date;
  nextTechnicalCheck?: Date;
  technicalCheckResult?: string;
}

@Component({
  selector: 'app-vehicules',
  imports: [FormsModule, CommonModule],
  templateUrl: './vehicules.component.html',
  styleUrl: './vehicules.component.css'
})
export class VehiculesComponent {

}
