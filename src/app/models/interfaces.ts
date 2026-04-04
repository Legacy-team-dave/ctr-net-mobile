export interface Militaire {
  matricule: string;
  noms: string;
  grade: string;
  unite: string;
  garnison: string;
  province: string;
  statut: string;
  categorie: string;
  beneficiaire: string;
  age?: number;
  deja_controle?: boolean;
}

export interface User {
  id_utilisateur: number;
  login: string;
  nom_complet: string;
  email: string;
  avatar: string;
  profil: string;
  dernier_acces: string;
  created_at: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: {
    id: number;
    nom: string;
    login: string;
    profil: string;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  user?: User;
}

export interface ControleData {
  matricule: string;
  mention: string;
  lien: string;
  beneficiaire?: string;
  new_beneficiaire?: string;
  observations?: string;
  statut_vivant?: boolean;
  statut_decede?: boolean;
}

export interface QrControlePayload {
  matricule: string;
  noms?: string;
  grade?: string;
  mention?: string;
  date_controle?: string;
  unite?: string;
  garnison?: string;
  province?: string;
  categorie?: string;
  raw_value?: string;
}

export interface EnrollementPayload {
  local_id?: string;
  matricule: string;
  noms: string;
  grade?: string;
  unite?: string;
  garnison?: string;
  province?: string;
  qr_payload?: QrControlePayload | null;
  photo_data?: string;
  empreinte_gauche_data?: string;
  empreinte_droite_data?: string;
  observations?: string;
  enrolled_at?: string;
  device_label?: string;
}

export interface LocalEnrollementRecord {
  localId: string;
  payload: EnrollementPayload;
  syncStatus: 'pending' | 'synced';
  createdAt: string;
  syncedAt?: string;
  remoteId?: number;
  lastError?: string;
}
