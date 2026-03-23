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

  // ── Base URL ──

  async getBaseUrl(): Promise<string> {
    const ip = await this.getServerIP();
    if (!ip) return '';
    return `http://${ip}/ctr.net-fardc/api`;
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
