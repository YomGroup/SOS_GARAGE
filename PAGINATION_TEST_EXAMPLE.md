# Exemple de test pour la pagination des dossiers

## Test de base

### 1. Test du service DossiersService

```typescript
describe('DossiersService', () => {
  let service: DossiersService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DossiersService]
    });
    service = TestBed.inject(DossiersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should load dossiers with pagination', () => {
    const mockResponse = {
      content: [
        { id: 1, type: 'Accident', statut: 'en_cours' },
        { id: 2, type: 'Vol', statut: 'termine' }
      ],
      page: 0,
      size: 10,
      totalElements: 2,
      totalPages: 1,
      empty: false
    };

    service.getDossiers(0, 10).subscribe(response => {
      expect(response.content.length).toBe(2);
      expect(response.totalElements).toBe(2);
      expect(response.page).toBe(0);
      expect(response.size).toBe(10);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/sinistre/find_by_page?page=0&size=10`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should load all dossiers without pagination', () => {
    const mockDossiers = [
      { id: 1, type: 'Accident' },
      { id: 2, type: 'Vol' }
    ];

    service.getDossiersSimple().subscribe(dossiers => {
      expect(dossiers.length).toBe(2);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/sinistre`);
    expect(req.request.method).toBe('GET');
    req.flush(mockDossiers);
  });
});
```

### 2. Test du composant DossierManagementComponent

```typescript
describe('DossierManagementComponent', () => {
  let component: DossierManagementComponent;
  let fixture: ComponentFixture<DossierManagementComponent>;
  let dossiersService: jasmine.SpyObj<DossiersService>;

  beforeEach(async () => {
    const dossiersServiceSpy = jasmine.createSpyObj('DossiersService', ['getDossiers', 'getDossiersSimple']);

    await TestBed.configureTestingModule({
      imports: [
        DossierManagementComponent,
        HttpClientTestingModule,
        MatDialogModule
      ],
      providers: [
        { provide: DossiersService, useValue: dossiersServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DossierManagementComponent);
    component = fixture.componentInstance;
    dossiersService = TestBed.inject(DossiersService) as jasmine.SpyObj<DossiersService>;
  });

  it('should load data with server pagination', () => {
    component.useServerPagination = true;
    
    const mockResponse = {
      content: [{ id: 1, type: 'Accident' }],
      page: 0,
      size: 10,
      totalElements: 1,
      totalPages: 1,
      empty: false
    };

    dossiersService.getDossiers.and.returnValue(of(mockResponse));

    component.loadData();

    expect(dossiersService.getDossiers).toHaveBeenCalledWith(0, 10);
    expect(component.totalDossiersFromServer).toBe(1);
  });

  it('should load data with client pagination', () => {
    component.useServerPagination = false;
    
    const mockDossiers = [{ id: 1, type: 'Accident' }];
    dossiersService.getDossiersSimple.and.returnValue(of(mockDossiers));

    component.loadData();

    expect(dossiersService.getDossiersSimple).toHaveBeenCalled();
    expect(component.totalDossiers).toBe(1);
  });

  it('should handle page change with server pagination', () => {
    component.useServerPagination = true;
    spyOn(component, 'loadData');

    const pageEvent = { pageIndex: 1, pageSize: 10 } as PageEvent;
    component.onPageChange(pageEvent);

    expect(component.pageIndex).toBe(1);
    expect(component.pageSize).toBe(10);
    expect(component.loadData).toHaveBeenCalled();
  });
});
```

## Test d'intégration

### 1. Test de bout en bout

```typescript
describe('Pagination Integration Test', () => {
  let component: DossierManagementComponent;
  let fixture: ComponentFixture<DossierManagementComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DossierManagementComponent,
        HttpClientTestingModule,
        MatDialogModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DossierManagementComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should work end-to-end with server pagination', async () => {
    // Activer la pagination côté serveur
    component.useServerPagination = true;
    
    // Simuler le chargement initial
    component.ngOnInit();
    
    // Attendre que la requête soit faite
    const req = httpMock.expectOne(`${environment.apiUrl}/sinistre/find_by_page?page=0&size=10`);
    expect(req.request.method).toBe('GET');
    
    // Répondre avec des données mockées
    const mockResponse = {
      content: [
        { id: 1, type: 'Accident', statut: 'en_cours' },
        { id: 2, type: 'Vol', statut: 'termine' }
      ],
      page: 0,
      size: 10,
      totalElements: 2,
      totalPages: 1,
      empty: false
    };
    
    req.flush(mockResponse);
    
    // Vérifier que les données sont correctement traitées
    expect(component.totalDossiersFromServer).toBe(2);
    expect(component.dataSource.data.length).toBe(2);
  });
});
```

## Test manuel

### 1. Vérification dans le navigateur

1. **Ouvrir l'application** et naviguer vers la section de gestion des dossiers
2. **Vérifier la pagination** : 
   - Les contrôles de pagination doivent être visibles
   - Changer de page doit recharger les données
   - Le nombre total d'éléments doit être affiché correctement
3. **Tester les filtres** :
   - Appliquer des filtres et vérifier que la pagination se remet à la première page
   - Vérifier que les résultats filtrés sont paginés correctement
4. **Tester le changement de taille de page** :
   - Modifier la taille de page et vérifier que les données se rechargent

### 2. Vérification des performances

1. **Mesurer le temps de chargement** :
   - Comparer le temps de chargement avec et sans pagination
   - Vérifier que les grandes listes se chargent plus rapidement
2. **Vérifier la mémoire** :
   - Surveiller l'utilisation mémoire avec de grandes listes
   - S'assurer que la pagination réduit l'utilisation mémoire

## Commandes de test

```bash
# Exécuter tous les tests
npm test

# Exécuter les tests du service dossiers
npm test -- --include="**/dossiers.service.spec.ts"

# Exécuter les tests du composant dossier-management
npm test -- --include="**/dossier-management.component.spec.ts"

# Exécuter les tests en mode watch
npm test -- --watch

# Générer un rapport de couverture
npm test -- --coverage
```

## Points de vérification

- [ ] Le service DossiersService charge correctement les données paginées
- [ ] Le composant DossierManagementComponent utilise la bonne méthode selon le flag useServerPagination
- [ ] Les changements de page rechargent les données côté serveur
- [ ] Les filtres fonctionnent avec la pagination côté serveur
- [ ] La compatibilité avec l'ancien comportement est maintenue
- [ ] Les statistiques affichent les bonnes valeurs
- [ ] Les performances sont améliorées avec de grandes listes



