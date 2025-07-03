// Interfaces minimales pour les sous-objets
export interface Avantage {
  // À compléter selon vos besoins
  nom?: string;
  description?: string;
}

export interface Message {
  // À compléter selon vos besoins
  id?: number;
  contenu?: string;
  date?: string;
}

export interface Reparation {
  // À compléter selon vos besoins
  id?: number;
  description?: string;
  cout?: number;
}

export interface Vehicule {
  // À compléter selon vos besoins
  id?: number;
  marque?: string;
  modele?: string;
}

export enum TypeSinistre {
  VOL = 'VOL',
  ACCIDENT = 'ACCIDENT',
  INCENDIE = 'INCENDIE',
  // Ajoutez d'autres types si besoin
}

export interface DocumentsSinistre {
  // À compléter selon vos besoins
  id?: number;
  url?: string;
  type?: string;
}

export interface Notification {
  // À compléter selon vos besoins
  id?: number;
  message?: string;
  date?: string;
}

// Interface Mission
export interface Mission {
  id?: number;
  statut: string;
  dateCreation: string; // LocalDate -> string (ISO)
  photosVehicule: string[];
  constatAccident: string;
  documentsAssurance: string[];
  cessionCreance: string;
  ordreReparation: string;
  devis: number;
  factureFinale: number;
  pretVehicule: boolean;
  vehiculeRemplace: string;
  avantages: Avantage[];
  sinistre: Sinistre;
  reparateur: Reparateur;
  messages: Message[];
  reparation: Reparation;
  declareCommeEpave: boolean;
  epaveValideeParAdmin: boolean;
  dateDeclarationEpave: string; // LocalDate -> string (ISO)
  commissionStatut: string;
  assureName: string;
}

// Interface Reparateur
export interface Reparateur {
  id?: number;
  createdAt?: string;
  updatedAt?: string;
  name: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  statut?: string;
  isvalids?: string;
  isValids?: string;
  codePostal: string;
  Ville: string;
  commission: number;
  siret: string;
  nomDuGarage: string;
  servicePropose: string[];
  missions: Mission[];
  anneeExperience: number;
  nombreVehiculeReparee: number;
  nombreEmployes: number;
  logo: string;
  useridKeycloak: string;
  imagesReparations: string[];

}

// Interface Sinistre
export interface Sinistre {
  id?: number;
  vehicule: Vehicule;
  type: TypeSinistre;
  contactAssistance: string;
  lienConstat: string;
  conditionsAcceptees: boolean;
  documents: DocumentsSinistre[];
  notifications: Notification[];
  imgUrl: string[];
  mission: Mission;
  isvalid: boolean;
  Statut: string;
} 

// Interface Vehicule
export interface Vehicule {
    id?: number;
    createdAt?: string;
    updatedAt?: string;
    immatriculation?: string;
    marque?: string;
    modele?: string;
    cylindree?: string;
    dateMiseEnCirculation: string;
    carteGrise: string;
    contratAssurance: string;
    imgUrl: string[];
    sinistres: Sinistre[];
  }

  // Interface Assure
  export interface Assure {
    id?: number;
    createdAt?: string;
    updatedAt?: string;
    name?: string;
    prenom?: string;
    email: string;
    telephone: string;
    adresse: string;
    password: string;
    useridKeycloak: string;
    numeroPermis: string;
    vehicules: Vehicule[];
    messages: Message[];
  }