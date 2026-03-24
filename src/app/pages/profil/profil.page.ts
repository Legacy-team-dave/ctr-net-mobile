import { Component } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personCircle, server, person, mail, shieldCheckmark, time, text
} from 'ionicons/icons';
import { ApiService } from '../../services/api.service';
import { User } from '../../models/interfaces';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-profil',
  templateUrl: './profil.page.html',
  styleUrls: ['./profil.page.scss'],
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonIcon,
  ],
})
export class ProfilPage {
  nomComplet = '';
  email = '';
  loginName = '';
  serverIP = '';
  profilRole = '';
  dernierAcces = '';
  avatarUrl = 'assets/img/default-avatar.jpg';

  constructor(private api: ApiService) {
    addIcons({ personCircle, server, person, mail, shieldCheckmark, time, text });
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
        this.profilRole = u.profil || '';
        this.dernierAcces = u.dernier_acces || '';

        if (u.avatar) {
          const baseUrl = await this.api.getServerBaseUrl();
          this.avatarUrl = `${baseUrl}/assets/uploads/avatars/${u.avatar}`;
        }
      }
    } catch {
      // Silencieux
    }
    this.serverIP = await this.api.getServerIP();
  }

  onAvatarError(event: Event) {
    (event.target as HTMLImageElement).src = 'assets/img/default-avatar.jpg';
  }
}
