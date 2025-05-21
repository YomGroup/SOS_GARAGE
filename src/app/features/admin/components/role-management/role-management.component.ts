import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';

interface Role {
  id: number;
  nom: string;
  description: string;
  permissions: {
    gestionDossiers: boolean;
    validationGarages: boolean;
    gestionEpaves: boolean;
    gestionRoles: boolean;
  };
}

@Component({
  selector: 'app-role-management',
  templateUrl: './role-management.component.html',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule
  ]
})
export class RoleManagementComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['nom', 'description', 'permissions', 'actions'];
  dataSource: MatTableDataSource<Role>;
  roleForm: FormGroup;
  isEditing = false;
  selectedRole: Role | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private fb: FormBuilder) {
    this.dataSource = new MatTableDataSource();
    this.roleForm = this.fb.group({
      nom: ['', Validators.required],
      description: ['', Validators.required],
      permissions: this.fb.group({
        gestionDossiers: [false],
        validationGarages: [false],
        gestionEpaves: [false],
        gestionRoles: [false]
      })
    });
  }

  ngOnInit(): void {
    this.loadRoles();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadRoles(): void {
    // Données de test
    const roles: Role[] = [
      {
        id: 1,
        nom: 'Administrateur',
        description: 'Accès complet à toutes les fonctionnalités',
        permissions: {
          gestionDossiers: true,
          validationGarages: true,
          gestionEpaves: true,
          gestionRoles: true
        }
      },
      {
        id: 2,
        nom: 'Gestionnaire',
        description: 'Gestion des dossiers et validation des garages',
        permissions: {
          gestionDossiers: true,
          validationGarages: true,
          gestionEpaves: false,
          gestionRoles: false
        }
      }
    ];
    this.dataSource.data = roles;
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  createRole(): void {
    this.isEditing = false;
    this.selectedRole = null;
    this.roleForm.reset();
  }

  editRole(role: Role): void {
    this.isEditing = true;
    this.selectedRole = role;
    this.roleForm.patchValue({
      nom: role.nom,
      description: role.description,
      permissions: role.permissions
    });
  }

  saveRole(): void {
    if (this.roleForm.valid) {
      const roleData = this.roleForm.value;
      if (this.isEditing && this.selectedRole) {
        // TODO: Mettre à jour le rôle existant
        console.log('Mise à jour du rôle:', { ...this.selectedRole, ...roleData });
      } else {
        // TODO: Créer un nouveau rôle
        console.log('Création du rôle:', roleData);
      }
      this.roleForm.reset();
      this.isEditing = false;
      this.selectedRole = null;
    }
  }

  deleteRole(role: Role): void {
    // TODO: Implémenter la suppression du rôle
    console.log('Suppression du rôle:', role);
  }
} 