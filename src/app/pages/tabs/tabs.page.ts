import { Component } from '@angular/core';
import {
  IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { clipboardOutline, personOutline, logOutOutline } from 'ionicons/icons';
import { AlertController } from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
})
export class TabsPage {
  constructor(
    private auth: AuthService,
    private alertCtrl: AlertController
  ) {
    addIcons({ clipboardOutline, personOutline, logOutOutline });
  }

  async logout() {
    const alert = await this.alertCtrl.create({
      header: 'Confirmation de déconnexion',
      message: 'Êtes-vous sûr de vouloir vous déconnecter ?',
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'Oui, déconnecter',
          handler: () => this.auth.logout(),
        },
      ],
    });
    await alert.present();
  }
}
