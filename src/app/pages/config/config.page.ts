import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonInput, IonIcon, IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { shieldCheckmark, wifi, arrowForward, checkmarkCircle, closeCircle, informationCircleOutline } from 'ionicons/icons';
import { ApiService } from '../../services/api.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-config',
  templateUrl: './config.page.html',
  styleUrls: ['./config.page.scss'],
  imports: [
    FormsModule, IonContent, IonInput, IonIcon, IonSpinner
  ],
})
export class ConfigPage {
  serverIP = '';
  testing = false;
  connectionOk: boolean | null = null;
  connectionMessage = '';

  constructor(
    private api: ApiService,
    private router: Router
  ) {
    addIcons({ shieldCheckmark, wifi, arrowForward, checkmarkCircle, closeCircle, informationCircleOutline });
  }

  async ionViewWillEnter() {
    this.serverIP = await this.api.getServerIP();
  }

  async testConnection() {
    if (!this.serverIP.trim()) return;

    this.testing = true;
    this.connectionOk = null;
    await this.api.setServerIP(this.serverIP.trim());

    try {
      await firstValueFrom(this.api.testConnection());
      this.connectionOk = true;
      this.connectionMessage = 'Connexion réussie au serveur !';
    } catch (err: unknown) {
      this.connectionOk = false;
      this.connectionMessage = err instanceof Error ? err.message : 'Erreur de connexion';
    } finally {
      this.testing = false;
    }
  }

  async saveAndContinue() {
    await this.api.setServerIP(this.serverIP.trim());
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
