import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { UserManagementService, UserDisplay, Assure, Reparateur } from '../../../../../services/user-management.service';
import { timeout, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { Router, NavigationEnd } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatSelectModule
  ],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit {
  displayedColumns: string[] = ['nom', 'prenom', 'email', 'telephone', 'role', 'statut', 'actions'];
  dataSource: MatTableDataSource<UserDisplay>;
  users: UserDisplay[] = [];
  roles: string[] = ['Assuré', 'Réparateur'];

  userFormGroup: FormGroup;
  isEditing = false;
  selectedUser: UserDisplay | null = null;
  isLoading = false;
  errorMessage = '';
  showForm = false;

  // Pagination custom
  pageSize: number = 10;
  currentPage: number = 0;
  filteredUsers: UserDisplay[] = [];
  pageSizeOptions: number[] = [5, 10, 25, 100];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private fb: FormBuilder,
    private userManagementService: UserManagementService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.dataSource = new MatTableDataSource<UserDisplay>([]);
    this.userFormGroup = this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', Validators.required],
      adresse: ['', Validators.required],
      role: ['', Validators.required],
      numeroPermis: [''],
      adressePostale: [''],
      password: ['', Validators.required],
      isvalids: [true] // Pour les réparateurs uniquement
    });
  }

  ngOnInit(): void {
    this.loadData();
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.loadData();
      }
    });
    setTimeout(() => {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    console.log('Début du chargement des utilisateurs');
    
    this.userManagementService.getAllUsers().pipe(
      timeout(10000), // Timeout de 10 secondes
      catchError(error => {
        console.error('Erreur avec timeout:', error);
        if (error.name === 'TimeoutError') {
          return of([]); // Retourner un tableau vide en cas de timeout
        }
        throw error;
      })
    ).subscribe({
      next: (users) => {
        console.log('Utilisateurs chargés avec succès:', users);
        this.users = users;
        this.dataSource.data = users;
        this.filteredUsers = users.slice();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erreur détaillée lors du chargement des utilisateurs:', error);
        this.errorMessage = `Erreur lors du chargement des utilisateurs: ${error.message}`;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = filterValue;
    this.filteredUsers = this.dataSource.filteredData;
    this.currentPage = 0;
  }

  onPageSizeChange(): void {
    this.currentPage = 0;
  }

  getPageNumbers(): number[] {
    const totalPages = Math.ceil(this.filteredUsers.length / this.pageSize);
    const pagesToShow = 5;
    let startPage: number, endPage: number;
    if (totalPages <= pagesToShow) {
      startPage = 1;
      endPage = totalPages;
    } else {
      const maxPagesBeforeCurrent = Math.floor(pagesToShow / 2);
      const maxPagesAfterCurrent = Math.ceil(pagesToShow / 2) - 1;
      if (this.currentPage + 1 <= maxPagesBeforeCurrent) {
        startPage = 1;
        endPage = pagesToShow;
      } else if (this.currentPage + 1 + maxPagesAfterCurrent >= totalPages) {
        startPage = totalPages - pagesToShow + 1;
        endPage = totalPages;
      } else {
        startPage = this.currentPage + 1 - maxPagesBeforeCurrent;
        endPage = this.currentPage + 1 + maxPagesAfterCurrent;
      }
    }
    return Array.from({length: endPage - startPage + 1}, (_, i) => startPage + i);
  }

  openUserForm(): void {
    this.isEditing = false;
    this.selectedUser = null;
    this.showForm = true;
    this.userFormGroup.reset();
    this.userFormGroup.patchValue({
      role: 'Assuré', // Valeur par défaut
      isvalids: true // Valeur par défaut pour les réparateurs
    });
  }

  editUser(user: UserDisplay): void {
    this.isEditing = true;
    this.selectedUser = user;
    this.showForm = true;
    this.userFormGroup.patchValue({
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      telephone: user.telephone,
      adresse: user.adresse,
      role: user.role,
      numeroPermis: user.numeroPermis || '',
      adressePostale: user.adressePostale || ''
    });
  }

  saveUser(): void {
    console.log('Début saveUser, formulaire valide:', this.userFormGroup.valid);
    console.log('Valeurs du formulaire:', this.userFormGroup.value);
    
    if (this.userFormGroup.valid) {
      const formValue = this.userFormGroup.value;
      
      if (this.isEditing && this.selectedUser) {
        // Mise à jour - pour l'instant, on recharge les données
        this.loadData();
        alert('Fonctionnalité de mise à jour à implémenter');
      } else {
        // Création
        console.log('Mode création, rôle:', formValue.role);
        
        if (formValue.role === 'Assuré') {
          const newAssure = {
            nom: formValue.nom,
            prenom: formValue.prenom,
            email: formValue.email,
            telephone: formValue.telephone,
            adresse: formValue.adresse,
            adressePostale: formValue.adressePostale,
            numeroPermis: formValue.numeroPermis,
            password: formValue.password,
            useridKeycloak: ''
          };
          console.log('Création assuré:', newAssure);
          
          this.userManagementService.createAssure(newAssure).subscribe({
            next: (response) => {
              console.log('Assuré créé avec succès:', response);
              this.loadData();
              this.closeUserForm();
            },
            error: (error) => {
              console.error('Erreur lors de la création de l\'assuré:', error);
              alert('Erreur lors de la création de l\'assuré: ' + error.message);
            }
          });
        } else {
          const newReparateur = {
            name: formValue.nom,
            prenom: formValue.prenom,
            email: formValue.email,
            telephone: formValue.telephone,
            adresse: formValue.adresse,
            password: formValue.password,
            isvalids: formValue.isvalids
          };
          console.log('Création réparateur:', newReparateur);
          
          this.userManagementService.createReparateur(newReparateur).subscribe({
            next: (response) => {
              console.log('Réparateur créé avec succès:', response);
              this.loadData();
              this.closeUserForm();
            },
            error: (error) => {
              console.error('Erreur lors de la création du réparateur:', error);
              alert('Erreur lors de la création du réparateur: ' + error.message);
            }
          });
        }
      }
    } else {
      console.log('Formulaire invalide, erreurs:', this.userFormGroup.errors);
      console.log('Erreurs par champ:');
      Object.keys(this.userFormGroup.controls).forEach(key => {
        const control = this.userFormGroup.get(key);
        if (control?.errors) {
          console.log(`${key}:`, control.errors);
        }
      });
    }
  }

  deleteUser(user: UserDisplay): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${user.nom} ${user.prenom} ?`)) {
      if (user.role === 'Assuré') {
        this.userManagementService.deleteAssure(user.id).subscribe({
          next: () => {
            this.loadData();
          },
          error: (error) => {
            console.error('Erreur lors de la suppression:', error);
            alert('Erreur lors de la suppression');
          }
        });
      } else {
        // Pour les réparateurs, on utilise l'index pour l'ID
        const reparateurId = user.id - 10000;
        this.userManagementService.deleteReparateur(reparateurId).subscribe({
          next: () => {
            this.loadData();
          },
          error: (error) => {
            console.error('Erreur lors de la suppression:', error);
            alert('Erreur lors de la suppression');
          }
        });
      }
    }
  }

  toggleActive(user: UserDisplay): void {
    if (user.role === 'Réparateur') {
      const reparateurId = user.id - 10000;
      this.userManagementService.toggleReparateurStatus(reparateurId, !user.actif).subscribe({
        next: () => {
          this.loadData();
        },
        error: (error) => {
          console.error('Erreur lors du changement de statut:', error);
          alert('Erreur lors du changement de statut');
        }
      });
    } else {
      alert('La gestion du statut des assurés n\'est pas encore implémentée');
    }
  }

  resetPassword(user: UserDisplay): void {
    alert(`Réinitialisation du mot de passe pour ${user.nom} ${user.prenom} - Fonctionnalité à implémenter`);
  }

  closeUserForm(): void {
    this.isEditing = false;
    this.selectedUser = null;
    this.showForm = false;
    this.userFormGroup.reset();
  }

  applyPagination(): void {
    // Placeholder pour la pagination custom
  }

  min(a: number, b: number): number {
    return Math.min(a, b);
  }
} 