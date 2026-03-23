import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonInput,
  IonIcon, IonCard, IonCardHeader, IonCardContent, IonCardTitle,
  IonItem, IonNote
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personCircle, save, server } from 'ionicons/icons';
import { LoadingController, ToastController } from '@ionic/angular/standalone';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/interfaces';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-profil',
  templateUrl: './profil.page.html',
  styleUrls: ['./profil.page.scss'],
  imports: [
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonInput,
    IonIcon, IonCard, IonCardHeader, IonCardContent, IonCardTitle,
    IonItem, IonNote,
  ],
})
export class ProfilPage {
  nomComplet = '';
  email = '';
  loginName = '';
  serverIP = '';
  oldPassword = '';
  newPassword = '';

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {
    addIcons({ personCircle, save, server });
  }

  async ionViewWillEnter() {
    await this.loadProfil();
  }

  private async loadProfil() {
    try {
      const res = await firstValueFrom(this.api.getProfil());
      if (res.success && res.user) {
        const u: User = res.user;
        this.nomComplet = u.nom_complet || '';
        this.email = u.email || '';
        this.loginName = u.login || '';
      }
    } catch {
      // Silencieux
    }
    this.serverIP = await this.api.getServerIP();
  }

  async onSave() {
    if (!this.nomComplet.trim() || !this.email.trim()) {
      this.showToast('Nom et email requis', 'warning');
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'Mise à jour du profil...' });
    await loading.present();

    try {
      const data: { nom_complet: string; email: string; old_password?: string; new_password?: string } = {
        nom_complet: this.nomComplet.trim(),
        email: this.email.trim(),
      };
      if (this.oldPassword && this.newPassword) {
        data.old_password = this.oldPassword;
        data.new_password = this.newPassword;
      }

      const res = await firstValueFrom(this.api.updateProfil(data));
      await loading.dismiss();
      if (res.success) {
        this.showToast('Profil mis à jour avec succès', 'success');
        this.oldPassword = '';
        this.newPassword = '';
      }
    } catch (err: unknown) {
      await loading.dismiss();
      const message = err instanceof Error ? err.message : 'Erreur';
      this.showToast(message, 'danger');
    }
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({ message, duration: 3000, color, position: 'top' });
    await toast.present();
  }
}
