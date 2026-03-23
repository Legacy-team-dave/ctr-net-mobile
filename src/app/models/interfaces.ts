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
  beneficiaire?: string;
  lien_parente?: string;
  observations?: string;
}
