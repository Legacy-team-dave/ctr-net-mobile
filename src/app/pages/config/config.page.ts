import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonInput, IonIcon, IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { shieldCheckmark, wifi, arrowForward, checkmarkCircle, closeCircle, informationCircleOutline, searchOutline } from 'ionicons/icons';
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
  detecting = false;
  detectionError = '';
  connectionOk: boolean | null = null;
  connectionMessage = '';

  constructor(
    private api: ApiService,
    private router: Router
  ) {
    addIcons({ shieldCheckmark, wifi, arrowForward, checkmarkCircle, closeCircle, informationCircleOutline, searchOutline });
  }

  async ionViewWillEnter() {
    this.detecting = false;
    this.detectionError = '';
    this.connectionOk = null;
    this.serverIP = await this.api.getServerIP();
  }

  async testConnection() {
    const ip = this.serverIP.trim();
    if (!ip) return;

    if (!this.isValidIPv4(ip)) {
      this.connectionOk = false;
      this.connectionMessage = 'Adresse IPv4 invalide. Exemple: 10.71.62.9';
      return;
    }

    this.testing = true;
    this.connectionOk = null;
    await this.api.setServerIP(ip);

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
    const ip = this.serverIP.trim();
    if (!ip || !this.isValidIPv4(ip)) {
      this.connectionOk = false;
      this.connectionMessage = 'Veuillez renseigner une adresse IPv4 valide avant de continuer.';
      return;
    }

    await this.api.setServerIP(ip);
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  private isValidIPv4(value: string): boolean {
    const parts = value.split('.');
    if (parts.length !== 4) return false;

    return parts.every(part => {
      if (!/^\d+$/.test(part)) return false;
      const num = Number(part);
      return num >= 0 && num <= 255;
    });
  }
}
