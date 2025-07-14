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

export enum StatutAvancementSinistre {
  EN_ATTENTE_TRAITEMENT = 'EN_ATTENTE_TRAITEMENT',
  EN_ATTENTE_EXPERTISE = 'EN_ATTENTE_EXPERTISE',
  EN_ATTENTE_VALIDATION_ASSURANCE = 'EN_ATTENTE_VALIDATION_ASSURANCE',
  VEHICULE_EPAVE = 'VEHICULE_EPAVE',
  EN_COURS_REPARATION = 'EN_COURS_REPARATION',
  REPARATION_TERMINEE = 'REPARATION_TERMINEE',
  FACTURE = 'FACTURE'
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
  expert?: Expert;
  expertise?: Expertise;
  expertises?: any[];
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
  ville: string;
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
  documents?: {
    siret: boolean;
    assurance: boolean;
    certification: boolean;
  };
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
  statut: string;
  statutAvancement?: StatutAvancementSinistre;
  // Propriétés d'assurance ajoutées
  compagnieAssurance?: string;
  numeroContrat?: string;
  numeroSinistre?: string;
  dateDeclaration?: string;
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
    nomAssurence: string;
    
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

// Interface Expert
export interface Expert {
  id: number;
  nom: string;
  prenom: string;
  institution: string;
  assurance: string;
  specialite: string;
  numeroTelephone: string;
  email: string;
  adresse: string;
}

// Interface Expertise
export interface Expertise {
  id?: number;
  nomExpert?: string;
  prenomExpert?: string;
  institutionExpert?: string;
  dateExpertisePrevue: string;
  dateExpertiseEffective: string;
  montantChiffrageHT: number;
  montantChiffrageTTC: number;
  franchiseApplicable: number;
  rapportExpertise: string;
  observationsExpert: string;
  expertiseEffectuee: boolean;
  rapportTelecharge: boolean;
}

// Interface pour les mises à jour de mission
export interface MissionUpdate {
  devis?: number;
  factureFinale?: number;
  pretVehicule?: boolean;
  statut?: string;
  documentsAssurance?: string[];
  declareCommeEpave?: boolean;
  expert?: Expert;
  expertise?: Expertise;
  statutAvancement?: StatutAvancementSinistre;
}