import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

@Injectable({ providedIn: 'root' })
export class CacheService {
  /** Clés Preferences gérées par l'application */
  private readonly APP_KEYS = ['server_ip', 'auth_token'];

  /** Clé pour stocker le timestamp de dernière purge */
  private readonly LAST_CLEANUP_KEY = 'last_cache_cleanup';

  /** Intervalle entre deux nettoyages automatiques (24h en ms) */
  private readonly CLEANUP_INTERVAL = 24 * 60 * 60 * 1000;

  /**
   * Exécute le nettoyage automatique au démarrage.
   * - Purge les clés Preferences orphelines (non gérées par l'app)
   * - Nettoie le cache HTTP Angular (si applicable)
   * - Limite la fréquence à 1 fois par 24h
   */
  async autoCleanup(): Promise<void> {
    if (!(await this.shouldCleanup())) return;

    await this.purgeOrphanKeys();
    await this.markCleanupDone();
  }

  /**
   * Nettoyage complet forcé (appelé lors du logout).
   * Supprime le token et toute donnée de session.
   */
  async clearSessionData(): Promise<void> {
    await Preferences.remove({ key: 'auth_token' });
  }

  /**
   * Purge totale : supprime TOUTES les données locales.
   * Utile pour un reset complet de l'app.
   */
  async clearAll(): Promise<void> {
    await Preferences.clear();
  }

  /**
   * Retourne des statistiques sur le stockage local.
   */
  async getStorageStats(): Promise<{ keys: string[]; count: number; orphanCount: number }> {
    const { keys } = await Preferences.keys();
    const managed = [...this.APP_KEYS, this.LAST_CLEANUP_KEY];
    const orphans = keys.filter(k => !managed.includes(k));
    return { keys, count: keys.length, orphanCount: orphans.length };
  }

  /**
   * Vérifie si un nettoyage est nécessaire (plus de 24h depuis le dernier).
   */
  private async shouldCleanup(): Promise<boolean> {
    const { value } = await Preferences.get({ key: this.LAST_CLEANUP_KEY });
    if (!value) return true;
    const last = parseInt(value, 10);
    return Date.now() - last > this.CLEANUP_INTERVAL;
  }

  /**
   * Supprime les clés Preferences non gérées par l'app (orphelines).
   */
  private async purgeOrphanKeys(): Promise<void> {
    const { keys } = await Preferences.keys();
    const managed = [...this.APP_KEYS, this.LAST_CLEANUP_KEY];
    for (const key of keys) {
      if (!managed.includes(key)) {
        await Preferences.remove({ key });
      }
    }
  }

  /**
   * Marque le nettoyage comme effectué.
   */
  private async markCleanupDone(): Promise<void> {
    await Preferences.set({
      key: this.LAST_CLEANUP_KEY,
      value: Date.now().toString(),
    });
  }
}
