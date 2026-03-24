import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonIcon, IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  search, checkmarkCircle, closeCircle, arrowBack, person,
  alertCircle, informationCircle, skull, time, personAdd,
  star, location, card, shieldCheckmark, thumbsUp, thumbsDown,
  pencil, people
} from 'ionicons/icons';
import { AlertController, LoadingController, ToastController } from '@ionic/angular/standalone';
import { ApiService } from '../../services/api.service';
import { Militaire, ControleData } from '../../models/interfaces';
import { firstValueFrom } from 'rxjs';
import { Geolocation } from '@capacitor/geolocation';

@Component({
  selector: 'app-controle',
  templateUrl: './controle.page.html',
  styleUrls: ['./controle.page.scss'],
  imports: [
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
    IonIcon, IonSpinner,
  ],
})
export class ControlePage {
  step: 'search' | 'controle' = 'search';
  searchQuery = '';
  searchResults: Militaire[] = [];
  searching = false;
  noResults = false;
  currentMilitaire: Militaire | null = null;
  statutVivant = false;
  statutDecede = false;
  newBeneficiaire = '';
  lienParente = '';
  observations = '';

  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private api: ApiService,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {
    addIcons({
      search, checkmarkCircle, closeCircle, arrowBack, person,
      alertCircle, informationCircle, skull, time, personAdd,
      star, location, card, shieldCheckmark, thumbsUp, thumbsDown,
      pencil, people
    });
  }

  // ── Recherche ──

  onSearchInput() {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    if (this.searchQuery.length < 2) {
      this.searchResults = [];
      this.noResults = false;
      return;
    }
    this.searchTimeout = setTimeout(() => this.doSearch(), 300);
  }

  private async doSearch() {
    this.searching = true;
    this.noResults = false;
    try {
      this.searchResults = await firstValueFrom(this.api.searchMilitaire(this.searchQuery));
      this.noResults = this.searchResults.length === 0;
    } catch (err: unknown) {
      this.searchResults = [];
      this.noResults = true;
      const message = err instanceof Error ? err.message : 'Erreur';
      this.showToast(message, 'danger');
    } finally {
      this.searching = false;
    }
  }

  selectMilitaire(mil: Militaire) {
    this.currentMilitaire = mil;
    this.step = 'controle';
    this.resetControle();
    if (mil.categorie === 'DCD_AV_BIO') {
      this.statutDecede = true;
    }
  }

  backToSearch() {
    this.step = 'search';
    this.currentMilitaire = null;
    this.searchQuery = '';
    this.searchResults = [];
  }

  private resetControle() {
    this.statutVivant = false;
    this.statutDecede = false;
    this.newBeneficiaire = '';
    this.lienParente = '';
    this.observations = '';
  }

  // ── Statut ──

  get isDcdAvBio(): boolean {
    return this.currentMilitaire?.categorie === 'DCD_AV_BIO';
  }

  get statutInfo(): string {
    if (this.isDcdAvBio) return 'Catégorie DCD_AV_BIO : toujours considéré comme décédé';
    if (this.currentMilitaire?.categorie === 'DCD_AP_BIO') {
      return 'Cochez "Vivant" pour contrôler le militaire ou "Décédé" pour enregistrer un bénéficiaire';
    }
    return 'Sélectionnez un statut';
  }

  onStatutChange(type: 'vivant' | 'decede', event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    if (type === 'vivant') {
      this.statutVivant = checked;
      if (checked) {
        this.statutDecede = false;
        // Vivant n'a pas besoin de lien/bénéficiaire : on réinitialise
        this.lienParente = '';
        this.newBeneficiaire = '';
        this.observations = '';
      }
    } else {
      this.statutDecede = checked;
      if (checked) this.statutVivant = false;
    }
  }

  // ── Badge ──

  getBadgeClass(mil: Militaire): string {
    if (mil.statut === '1' || mil.statut === 'Actif') return 'badge-actif';
    const cat = mil.categorie || '';
    if (cat === 'DCD_AV_BIO') return 'badge-decede-av-bio';
    if (cat === 'DCD_AP_BIO') return 'badge-dcd-ap-bio';
    if (cat === 'RETRAITES') return 'badge-retraite';
    if (cat === 'INTEGRES') return 'badge-integre';
    return 'badge-actif';
  }

  getBadgeIcon(mil: Militaire): string {
    if (mil.statut === '1' || mil.statut === 'Actif') return 'checkmark-circle';
    const cat = mil.categorie || '';
    if (cat === 'DCD_AV_BIO') return 'skull';
    if (cat === 'DCD_AP_BIO') return 'skull';
    if (cat === 'RETRAITES') return 'time';
    if (cat === 'INTEGRES') return 'person-add';
    return 'checkmark-circle';
  }

  getBadgeLabel(mil: Militaire): string {
    if (mil.statut === '1' || mil.statut === 'Actif') return 'ACTIF';
    const cat = mil.categorie || '';
    if (cat === 'DCD_AV_BIO') return 'DCD AV BIO';
    if (cat === 'DCD_AP_BIO') return 'DCD AP BIO';
    if (cat === 'RETRAITES') return 'RETRAITÉ';
    if (cat === 'INTEGRES') return 'INTÉGRÉ';
    return 'ACTIF';
  }

  // ── Lien de parenté ──

  // lienParente est directement bindé via [(ngModel)] sur le <select>

  // ── Validation ──

  async validerPresent() {
    const alert = await this.alertCtrl.create({
      header: 'Confirmer',
      message: 'Attribuer la mention "Présent" ?',
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'Confirmer',
          handler: () => this.enregistrerControle({
            matricule: this.currentMilitaire!.matricule,
            mention: 'Présent',
            lien: 'Militaire lui-même',
            statut_vivant: true,
            statut_decede: false,
          }),
        },
      ],
    });
    await alert.present();
  }

  async validerMention(mention: string) {
    if (!this.lienParente) {
      this.showToast('Sélectionnez un lien de parenté', 'warning');
      return;
    }

    const benef = this.currentMilitaire?.beneficiaire || '';
    if (!benef && !this.newBeneficiaire.trim()) {
      this.showToast('Veuillez renseigner un bénéficiaire', 'warning');
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Confirmer',
      message: `Attribuer la mention "${mention}" ?`,
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'Confirmer',
          handler: () => this.enregistrerControle({
            matricule: this.currentMilitaire!.matricule,
            mention,
            lien: this.lienParente,
            beneficiaire: this.currentMilitaire?.beneficiaire || '',
            new_beneficiaire: this.newBeneficiaire.trim(),
            observations: this.observations.trim(),
            statut_vivant: this.statutVivant,
            statut_decede: this.statutDecede,
          }),
        },
      ],
    });
    await alert.present();
  }

  private async enregistrerControle(data: ControleData & Record<string, unknown>) {
    const loading = await this.loadingCtrl.create({ message: 'Enregistrement du contrôle...' });
    await loading.present();

    try {
      const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 5000 });
      data['latitude'] = pos.coords.latitude;
      data['longitude'] = pos.coords.longitude;
    } catch {
      // GPS non disponible
    }

    try {
      const result = await firstValueFrom(this.api.validerControle(data));
      await loading.dismiss();
      if (result.success) {
        this.showToast(result.message || 'Contrôle enregistré', 'success');
        setTimeout(() => this.backToSearch(), 1500);
      }
    } catch (err: unknown) {
      await loading.dismiss();
      const message = err instanceof Error ? err.message : 'Erreur';
      this.showToast(message, 'danger');
    }
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'top',
    });
    await toast.present();
  }
}
