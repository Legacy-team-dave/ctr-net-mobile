import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonInput, IonIcon, IonSpinner, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { shieldCheckmark, person, lockClosed, logIn, settings, eye, eyeOff, alertCircle } from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [
    FormsModule, IonContent, IonInput, IonIcon, IonSpinner
  ],
})
export class LoginPage {
  login = '';
  password = '';
  showPassword = false;
  loading = false;
  errorMessage = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private toastCtrl: ToastController
  ) {
    addIcons({ shieldCheckmark, person, lockClosed, logIn, settings, eye, eyeOff, alertCircle });
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({ message, duration: 3000, color, position: 'top' });
    await toast.present();
  }

  goToConfig() {
    this.router.navigateByUrl('/config');
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  async onSubmit() {
    if (!this.login.trim() || !this.password) {
      this.errorMessage = 'Veuillez remplir tous les champs';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    try {
      await this.auth.login(this.login.trim(), this.password);
      this.login = '';
      this.password = '';
      this.errorMessage = '';
      this.router.navigateByUrl('/tabs/controle', { replaceUrl: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de connexion';
      this.errorMessage = msg;
      await this.showToast(msg, 'danger');
    } finally {
      this.loading = false;
    }
  }
}
