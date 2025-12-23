import { SinistreService }  from '../../../services/sinistre.service';


export interface SinistreCreationData {
  vehiculeId: number;
  type: string;
  etatVehicule: string;
  contactAssistance: string;
  lienConstat?: string;
  conditionsAcceptees: boolean;
  assuranceName: string;
  description: string;
  lieu: string;
  images?: File[];
}

export interface SinistreCreationResult {
  success: boolean;
  sinistreResponse?: any;
  error?: string;
}

/**
 * Crée un sinistre et upload les photos en une seule opération
 */
export async function createSinistreWithImages(
  sinistreService: SinistreService,
  creationData: SinistreCreationData
): Promise<SinistreCreationResult> {
  try {
    console.log('🚀 Création du sinistre avec images...');

    // 1. Créer le sinistre (sans photos)
    const sinistreBody = {
      vehiculeId: creationData.vehiculeId,
      type: creationData.type,
      etatVehicule: creationData.etatVehicule,
      contactAssistance: creationData.contactAssistance,
      lienConstat: creationData.lienConstat,
      conditionsAcceptees: creationData.conditionsAcceptees,
      assuranceName: creationData.assuranceName,
      description: creationData.description,
      lieu: creationData.lieu,
    };

    console.log('📝 Création du sinistre:', sinistreBody);

    const createObservable = await sinistreService.addSinistrePost(sinistreBody);
    const sinistreResponse = await new Promise((resolve, reject) => {
      createObservable.subscribe({
        next: (response) => resolve(response),
        error: (error) => reject(error),
      });
    });

    console.log('✅ Sinistre créé:', sinistreResponse);

    // 2. Upload des images si présentes
    if (creationData.images && creationData.images.length > 0) {
      const sinistreId = (sinistreResponse as any).id;
      
      if (!sinistreId) {
        throw new Error('ID du sinistre non trouvé dans la réponse');
      }

      console.log(`📸 Upload de ${creationData.images.length} photo(s) pour sinistre ${sinistreId}...`);

      try {
        await sinistreService.uploadImages(sinistreId.toString(), creationData.images);
        console.log('✅ Photos uploadées avec succès');
      } catch (uploadError: any) {
        console.error('⚠️ Erreur upload photos (sinistre créé):', uploadError);
        // Le sinistre est créé, mais les photos ont échoué
        return {
          success: true,
          sinistreResponse,
          error: 'Sinistre créé mais erreur lors de l\'upload des photos',
        };
      }
    }

    return {
      success: true,
      sinistreResponse,
    };
  } catch (error: any) {
    console.error('❌ Erreur création sinistre:', error);
    return {
      success: false,
      error: error?.error?.message || error?.message || 'Erreur lors de la création du sinistre',
    };
  }
}