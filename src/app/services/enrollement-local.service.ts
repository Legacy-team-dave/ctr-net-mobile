import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { EnrollementPayload, LocalEnrollementRecord } from '../models/interfaces';

interface SyncReport {
  synced: number;
  pending: number;
  errors: string[];
}

@Injectable({ providedIn: 'root' })
export class EnrollementLocalService {
  private readonly DB_NAME = 'ctr_net_enrollement_mobile_db';
  private readonly STORE_NAME = 'enrollements_vivants';
  private readonly DB_VERSION = 1;
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor(private api: ApiService) {}

  async save(payload: EnrollementPayload): Promise<LocalEnrollementRecord> {
    const localId = payload.local_id || this.generateLocalId();
    const record: LocalEnrollementRecord = {
      localId,
      payload: {
        ...payload,
        local_id: localId,
      },
      syncStatus: 'pending',
      createdAt: payload.enrolled_at || new Date().toISOString(),
    };

    const db = await this.openDb();
    await this.putRecord(db, record);
    return record;
  }

  async listAll(): Promise<LocalEnrollementRecord[]> {
    const db = await this.openDb();
    const records = await this.getAllRecords(db);
    return records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async syncPending(): Promise<SyncReport> {
    const db = await this.openDb();
    const records = await this.getAllRecords(db);
    const pendingRecords = records.filter(record => record.syncStatus !== 'synced');

    let synced = 0;
    const errors: string[] = [];

    for (const record of pendingRecords) {
      try {
        const response = await firstValueFrom(this.api.enrollMilitaireVivant(record.payload));

        if (response.success) {
          synced += 1;
          await this.putRecord(db, {
            ...record,
            syncStatus: 'synced',
            syncedAt: new Date().toISOString(),
            remoteId: response.data?.enrollement_id,
            lastError: undefined,
          });
        } else {
          const message = response.message || 'Synchronisation refusée par le serveur.';
          errors.push(`${record.payload.matricule}: ${message}`);
          await this.putRecord(db, {
            ...record,
            syncStatus: 'pending',
            lastError: message,
          });
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Erreur de synchronisation inconnue';
        errors.push(`${record.payload.matricule}: ${message}`);
        await this.putRecord(db, {
          ...record,
          syncStatus: 'pending',
          lastError: message,
        });
      }
    }

    const updatedRecords = await this.getAllRecords(db);
    const pending = updatedRecords.filter(record => record.syncStatus !== 'synced').length;

    return { synced, pending, errors };
  }

  private generateLocalId(): string {
    return `enr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  private async openDb(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }

    if (typeof indexedDB === 'undefined') {
      throw new Error('Le stockage local IndexedDB est indisponible sur cette tablette.');
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'localId' });
          store.createIndex('syncStatus', 'syncStatus', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Impossible d’ouvrir la base locale.'));
    });

    return this.dbPromise;
  }

  private putRecord(db: IDBDatabase, record: LocalEnrollementRecord): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_NAME, 'readwrite');
      const store = tx.objectStore(this.STORE_NAME);
      store.put(record);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Impossible d’enregistrer l’enrôlement localement.'));
    });
  }

  private getAllRecords(db: IDBDatabase): Promise<LocalEnrollementRecord[]> {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_NAME, 'readonly');
      const store = tx.objectStore(this.STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve((request.result || []) as LocalEnrollementRecord[]);
      request.onerror = () => reject(request.error || new Error('Lecture du stockage local impossible.'));
    });
  }
}
