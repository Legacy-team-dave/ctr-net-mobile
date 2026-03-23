import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonButton, IonInput, IonIcon, IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { shieldCheckmark, person, lockClosed, logIn, settings, eye, eyeOff } from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [
    FormsModule, IonContent, IonButton, IonInput, IonIcon, IonSpinner
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
    private router: Router
  ) {
    addIcons({ shieldCheckmark, person, lockClosed, logIn, settings, eye, eyeOff });
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
      this.router.navigateByUrl('/tabs/controle', { replaceUrl: true });
    } catch (err: unknown) {
      this.errorMessage = err instanceof Error ? err.message : 'Erreur de connexion';
    } finally {
      this.loading = false;
    }
  }
}
