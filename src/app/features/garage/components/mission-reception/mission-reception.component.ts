import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface Mission {
  id: number;
  titre: string;
  client: string;
  vehicule: string;
  date: string;
  description: string;
  photos: string[];
  documents: { nom: string; url: string }[];
  statut: string;
}

@Component({
  selector: 'app-mission-reception',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mission-reception.component.html',
  styleUrls: ['./mission-reception.component.css']
})
export class MissionReceptionComponent implements OnInit {
  missions: Mission[] = [
    {
      id: 1,
      titre: 'Mission 001',
      client: 'Jean Dupont',
      vehicule: 'Peugeot 208',
      date: '2024-06-01',
      description: 'Remplacement pare-brise',
      photos: ['https://via.placeholder.com/120', 'https://via.placeholder.com/120'],
      documents: [
        { nom: 'Constat.pdf', url: '#' },
        { nom: 'Carte grise.pdf', url: '#' }
      ],
      statut: 'EN_ATTENTE'
    },
    {
      id: 2,
      titre: 'Mission 002',
      client: 'Marie Martin',
      vehicule: 'Renault Clio',
      date: '2024-06-02',
      description: "Changement d'embrayage",
      photos: ['https://via.placeholder.com/120'],
      documents: [
        { nom: 'Constat.pdf', url: '#' }
      ],
      statut: 'EN_COURS'
    }
  ];
  filteredMissions: Mission[] = [];
  filtreStatut: string = '';
  searchText: string = '';
  isCardView: boolean = true;
  panelOuvert: boolean = false;
  missionSelectionnee: Mission | null = null;

  ngOnInit(): void {
    this.filteredMissions = this.missions;
    console.log('missions:', this.missions);
    console.log('filteredMissions:', this.filteredMissions);
  }

  onStatutChange() {
    this.applyFilter();
  }

  onSearchChange(event: any) {
    this.searchText = event.target.value.toLowerCase();
    this.applyFilter();
  }

  applyFilter() {
    this.filteredMissions = this.missions.filter(m => {
      const matchStatut = this.filtreStatut ? m.statut === this.filtreStatut : true;
      const matchSearch = this.searchText ? (
        m.titre.toLowerCase().includes(this.searchText) ||
        m.client.toLowerCase().includes(this.searchText) ||
        m.vehicule.toLowerCase().includes(this.searchText)
      ) : true;
      return matchStatut && matchSearch;
    });
  }

  ouvrirDetails(mission: Mission) {
    this.missionSelectionnee = mission;
    this.panelOuvert = true;
  }

  fermerPanel() {
    this.panelOuvert = false;
    this.missionSelectionnee = null;
  }

  accepterMission(mission: Mission) {
    // TODO: Appeler le service pour accepter la mission
    alert('Mission acceptée : ' + mission.titre);
    this.fermerPanel();
  }
} 