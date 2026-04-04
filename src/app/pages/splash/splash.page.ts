import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';

@Component({
  selector: 'app-splash',
  template: `
    <ion-content [scrollY]="false">
      <div class="splash-screen" [class.fade-out]="fadeOut">
        <div class="splash-content" [class.visible]="show">
          <img src="assets/img/logo-fardc.png" alt="CTR.NET" class="splash-logo" />
          <h1>CTR.NET</h1>
          <p>Application mobile de contrôle</p>
          <div class="splash-spinner"></div>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .splash-screen {
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.7) 100%),
        url('/assets/img/fardc2.jpg') no-repeat center center;
      background-size: cover;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      text-align: center;
      z-index: 9999;
      transition: opacity 0.5s ease-out;
    }
    .splash-screen.fade-out {
      opacity: 0;
    }
    .splash-content {
      max-width: 80%;
      padding: 20px;
      opacity: 0;
      transform: translateY(30px);
      transition: opacity 0.8s ease-out, transform 0.8s ease-out;
    }
    .splash-content.visible {
      opacity: 1;
      transform: translateY(0);
    }
    .splash-logo {
      width: 120px;
      height: 120px;
      margin-bottom: 20px;
      border: 2px solid white;
      border-radius: 50%;
      padding: 10px;
      background: rgba(255,255,255,0.2);
      box-shadow: 0 0 10px rgba(0,0,0,0.3);
      animation: pulse 2s infinite ease-in-out;
      object-fit: contain;
    }
    h1 {
      font-size: 2.2rem;
      font-weight: 700;
      margin: 0 0 10px;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
      letter-spacing: 0.3px;
      font-family: 'Barlow', sans-serif;
    }
    p {
      font-size: 1rem;
      opacity: 0.9;
      margin-bottom: 30px;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
      font-family: 'Barlow', sans-serif;
    }
    .splash-spinner {
      width: 50px;
      height: 50px;
      border: 4px solid rgba(255,255,255,0.3);
      border-top-color: #ffc107;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 20px auto;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.05); opacity: 0.9; }
    }
    @media (min-width: 768px) {
      .splash-logo {
        width: 160px;
        height: 160px;
      }
      h1 { font-size: 2.8rem; }
      p { font-size: 1.2rem; }
    }
  `],
  imports: [IonContent],
})
export class SplashPage implements OnInit {
  show = false;
  fadeOut = false;

  constructor(private router: Router) {}

  ngOnInit() {
    setTimeout(() => this.show = true, 100);
    setTimeout(() => {
      this.fadeOut = true;
      setTimeout(() => this.router.navigateByUrl('/login', { replaceUrl: true }), 500);
    }, 5000);
  }
}
