import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { CacheService } from './cache.service';
import { User } from '../models/interfaces';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser = new BehaviorSubject<User | null>(null);
  user$ = this.currentUser.asObservable();

  constructor(
    private api: ApiService,
    private cache: CacheService,
    private router: Router
  ) {}

  get user(): User | null {
    return this.currentUser.value;
  }

  get isLoggedIn(): boolean {
    return this.currentUser.value !== null;
  }

  async checkSession(): Promise<boolean> {
    const token = await this.api.getToken();
    const ip = await this.api.getServerIP();
    if (!token || !ip) return false;

    try {
      const res = await firstValueFrom(this.api.checkAuth());
      if (res.success && res.user) {
        this.currentUser.next(res.user);
        return true;
      }
    } catch {
      // Session invalide
    }
    await this.api.clearToken();
    this.currentUser.next(null);
    return false;
  }

  async login(login: string, password: string): Promise<void> {
    const res = await firstValueFrom(this.api.login(login, password));
    if (!res.success) {
      throw new Error(res.message || 'Identifiants incorrects');
    }
    if (res.token) {
      await this.api.setToken(res.token);
    }
    if (res.user) {
      this.currentUser.next({
        id_utilisateur: res.user.id,
        login: res.user.login,
        nom_complet: res.user.nom,
        profil: res.user.profil,
        email: '',
        avatar: '',
        dernier_acces: '',
        created_at: '',
      });
    }
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.api.logout());
    } catch {
      // Ignorer les erreurs de déconnexion
    }
    await this.cache.clearSessionData();
    this.currentUser.next(null);
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  async hasServerConfigured(): Promise<boolean> {
    const ip = await this.api.getServerIP();
    return !!ip;
  }
}
