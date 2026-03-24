import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, from } from 'rxjs';
import { catchError, switchMap, timeout } from 'rxjs/operators';
import { Preferences } from '@capacitor/preferences';
import { Militaire, LoginResponse, ApiResponse, User, ControleData } from '../models/interfaces';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly STORAGE_KEY_IP = 'server_ip';
  private readonly STORAGE_KEY_TOKEN = 'auth_token';
  private readonly REQUEST_TIMEOUT = 15000;

  constructor(private http: HttpClient) {}

  // ── Storage ──

  async setServerIP(ip: string): Promise<void> {
    ip = ip.trim().replace(/\/+$/, '');
    if (!ip.startsWith('http')) {
      ip = ip.replace(/^https?:\/\//, '');
    }
    await Preferences.set({ key: this.STORAGE_KEY_IP, value: ip });
  }

  async getServerIP(): Promise<string> {
    const { value } = await Preferences.get({ key: this.STORAGE_KEY_IP });
    return value || '';
  }

  async setToken(token: string): Promise<void> {
    await Preferences.set({ key: this.STORAGE_KEY_TOKEN, value: token });
  }

  async getToken(): Promise<string> {
    const { value } = await Preferences.get({ key: this.STORAGE_KEY_TOKEN });
    return value || '';
  }

  async clearToken(): Promise<void> {
    await Preferences.remove({ key: this.STORAGE_KEY_TOKEN });
  }

  // ── Auto-détection serveur ──

  async detectServer(): Promise<string> {
    // 1. Essayer l'IP sauvegardée
    const saved = await this.getServerIP();
    if (saved) {
      try {
        await this.pingServer(saved);
        return saved;
      } catch { /* IP sauvegardée plus disponible */ }
    }

    // 2. Détecter le sous-réseau et scanner
    const subnets = await this.detectSubnets();
    const found = await this.scanSubnets(subnets);
    if (found) {
      await this.setServerIP(found);
      return found;
    }

    throw new Error('Serveur CTR.NET introuvable sur le réseau local');
  }

  private async pingServer(ip: string): Promise<void> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    try {
      await fetch(`http://${ip}/ctr.net-fardc/api/auth.php?action=check`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
    } finally {
      clearTimeout(timer);
    }
  }

  private async detectSubnets(): Promise<string[]> {
    try {
      const localIP = await this.getLocalIP();
      const subnet = localIP.split('.').slice(0, 3).join('.');
      return [subnet];
    } catch {
      // Sous-réseaux courants (WiFi, hotspot Windows, hotspot Android)
      return ['192.168.1', '192.168.0', '192.168.137', '192.168.43', '10.0.0'];
    }
  }

  private getLocalIP(): Promise<string> {
    return new Promise((resolve, reject) => {
      const pc = new RTCPeerConnection({ iceServers: [] });
      pc.createDataChannel('');
      let found = false;

      pc.onicecandidate = (e) => {
        if (found || !e.candidate) return;
        const match = e.candidate.candidate.match(/(\d+\.\d+\.\d+\.\d+)/);
        if (match && match[1] !== '0.0.0.0' && !match[1].startsWith('127.')) {
          found = true;
          pc.close();
          resolve(match[1]);
        }
      };

      pc.createOffer().then(o => pc.setLocalDescription(o)).catch(reject);
      setTimeout(() => { if (!found) { pc.close(); reject(new Error('Timeout')); } }, 3000);
    });
  }

  private async scanSubnets(subnets: string[]): Promise<string | null> {
    const priority = [1, 2, 100, 10, 50, 200, 150, 5, 20, 254];

    for (const subnet of subnets) {
      // Essayer les IPs prioritaires en parallèle
      const results = await Promise.allSettled(
        priority.map(n => this.pingServer(`${subnet}.${n}`).then(() => `${subnet}.${n}`))
      );
      const found = results.find(r => r.status === 'fulfilled') as PromiseFulfilledResult<string> | undefined;
      if (found) return found.value;
    }

    // Scan complet du premier sous-réseau
    if (subnets.length > 0) {
      const subnet = subnets[0];
      const remaining = Array.from({ length: 254 }, (_, i) => i + 1)
        .filter(n => !priority.includes(n));

      for (let i = 0; i < remaining.length; i += 25) {
        const batch = remaining.slice(i, i + 25);
        const results = await Promise.allSettled(
          batch.map(n => this.pingServer(`${subnet}.${n}`).then(() => `${subnet}.${n}`))
        );
        const found = results.find(r => r.status === 'fulfilled') as PromiseFulfilledResult<string> | undefined;
        if (found) return found.value;
      }
    }

    return null;
  }

  // ── Base URL ──

  async getBaseUrl(): Promise<string> {
    const ip = await this.getServerIP();
    if (!ip) return '';
    return `http://${ip}/ctr.net-fardc/api`;
  }

  async getServerBaseUrl(): Promise<string> {
    const ip = await this.getServerIP();
    if (!ip) return '';
    return `http://${ip}/ctr.net-fardc`;
  }

  // ── Headers ──

  private async getHeaders(): Promise<HttpHeaders> {
    const token = await this.getToken();
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  // ── Generic request ──

  private request<T>(method: string, endpoint: string, body?: unknown): Observable<T> {
    return from(Promise.all([this.getBaseUrl(), this.getHeaders()])).pipe(
      switchMap(([baseUrl, headers]) => {
        if (!baseUrl) {
          return throwError(() => new Error('Adresse serveur non configurée'));
        }
        const url = `${baseUrl}${endpoint}`;
        const options = { headers };

        switch (method) {
          case 'POST':
            return this.http.post<T>(url, body, options);
          default:
            return this.http.get<T>(url, options);
        }
      }),
      timeout(this.REQUEST_TIMEOUT),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse | Error): Observable<never> {
    let message = 'Erreur inconnue';

    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        message = 'Impossible de joindre le serveur. Vérifiez la connexion Wi-Fi et l\'adresse IP.';
      } else if (error.status === 401) {
        message = 'Session expirée. Veuillez vous reconnecter.';
      } else if (error.status === 403) {
        message = error.error?.message || 'Accès refusé';
      } else {
        message = error.error?.message || `Erreur serveur (${error.status})`;
      }
    } else if (error.name === 'TimeoutError') {
      message = 'Délai de connexion dépassé. Vérifiez l\'IP serveur et le réseau Wi-Fi.';
    } else {
      message = error.message;
    }

    return throwError(() => new Error(message));
  }

  // ── Auth ──

  testConnection(): Observable<boolean> {
    return from(this.getBaseUrl()).pipe(
      switchMap(baseUrl => {
        if (!baseUrl) return throwError(() => new Error('IP non configurée'));
        return this.http.get<ApiResponse>(`${baseUrl}/auth.php?action=check`, {
          headers: new HttpHeaders({ 'Accept': 'application/json' }),
        });
      }),
      timeout(8000),
      switchMap(() => from([true])),
      catchError(err => {
        if (err.name === 'TimeoutError') {
          return throwError(() => new Error('Délai dépassé'));
        }
        if (err instanceof HttpErrorResponse && err.status > 0) {
          return from([true]);
        }
        return throwError(() => new Error('Serveur injoignable'));
      })
    );
  }

  login(login: string, password: string): Observable<LoginResponse> {
    return this.request<LoginResponse>('POST', '/auth.php?action=login', { login, password });
  }

  logout(): Observable<ApiResponse> {
    return this.request<ApiResponse>('POST', '/auth.php?action=logout');
  }

  checkAuth(): Observable<ApiResponse<User>> {
    return this.request<ApiResponse<User>>('GET', '/auth.php?action=check');
  }

  // ── Contrôles ──

  searchMilitaire(query: string): Observable<Militaire[]> {
    return this.request<Militaire[]>('GET', `/controles.php?action=search&q=${encodeURIComponent(query)}`);
  }

  validerControle(data: ControleData): Observable<ApiResponse> {
    return this.request<ApiResponse>('POST', '/controles.php?action=valider', data);
  }

  getHistorique(limit = 20, offset = 0): Observable<ApiResponse> {
    return this.request<ApiResponse>('GET', `/controles.php?action=historique&limit=${limit}&offset=${offset}`);
  }

  // ── Profil ──

  getProfil(): Observable<ApiResponse<User>> {
    return this.request<ApiResponse<User>>('GET', '/profil.php?action=get');
  }

  updateProfil(data: { nom_complet: string; email: string; old_password?: string; new_password?: string }): Observable<ApiResponse> {
    return this.request<ApiResponse>('POST', '/profil.php?action=update', data);
  }
}
