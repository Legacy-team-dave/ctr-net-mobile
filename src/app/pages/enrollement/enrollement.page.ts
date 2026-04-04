import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonIcon, IonSpinner
} from '@ionic/angular/standalone';
import { LoadingController, ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  qrCode, camera, fingerPrint, sync, shieldCheckmark,
  checkmarkCircle, alertCircle, refresh, search, images,
  cloudUpload, wifi, arrowForward, arrowBack, save
} from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../services/api.service';
import {
  EnrollementPayload,
  LocalEnrollementRecord,
  Militaire,
  QrControlePayload,
} from '../../models/interfaces';
import { EnrollementLocalService } from '../../services/enrollement-local.service';

type EnrollementStep = 'scan' | 'photo' | 'fingerprints' | 'review';
type ScanTarget = 'photo' | 'left' | 'right';

type DetectedBarcode = { rawValue?: string };
type BarcodeDetectorInstance = {
  detect(source: HTMLVideoElement): Promise<DetectedBarcode[]>;
};
type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => BarcodeDetectorInstance;

@Component({
  selector: 'app-enrollement',
  templateUrl: './enrollement.page.html',
  styleUrls: ['./enrollement.page.scss'],
  imports: [
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
    IonIcon, IonSpinner,
  ],
})
export class EnrollementPage implements OnDestroy {
  @ViewChild('scannerVideo') scannerVideo?: ElementRef<HTMLVideoElement>;
  @ViewChild('manualQrInput') manualQrInput?: ElementRef<HTMLTextAreaElement>;

  readonly steps: EnrollementStep[] = ['scan', 'photo', 'fingerprints', 'review'];
  readonly stepLabels: Record<EnrollementStep, string> = {
    scan: 'QR code',
    photo: 'Photo',
    fingerprints: 'Empreintes',
    review: 'Validation',
  };

  currentStep: EnrollementStep = 'scan';
  manualQr = '';
  searchInProgress = false;
  scannerActive = false;
  readonly isCoppernicDevice = /coppernic|c-one|c-five|c-five\.0|tab/i.test((navigator.userAgent || '').toLowerCase());
  scannerMessage = 'Visez le QR code généré depuis le PC.';
  scannedPayload: QrControlePayload | null = null;
  currentMilitaire: Militaire | null = null;

  photoData = '';
  empreinteGaucheData = '';
  empreinteDroiteData = '';
  observations = '';

  syncing = false;
  pendingEnrollements: LocalEnrollementRecord[] = [];

  private stream: MediaStream | null = null;
  private scanTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private api: ApiService,
    private enrollementStorage: EnrollementLocalService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {
    addIcons({
      qrCode, camera, fingerPrint, sync, shieldCheckmark,
      checkmarkCircle, alertCircle, refresh, search, images,
      cloudUpload, wifi, arrowForward, arrowBack, save
    });
  }

  async ionViewWillEnter() {
    await this.loadPendingEnrollements();
    this.focusManualQrInput();

    if (this.isCoppernicDevice) {
      this.activateCoppernicMode();
    }
  }

  ionViewDidLeave() {
    this.stopScanner();
  }

  ngOnDestroy(): void {
    this.stopScanner();
  }

  get pendingCount(): number {
    return this.pendingEnrollements.filter(item => item.syncStatus !== 'synced').length;
  }

  get barcodeSupported(): boolean {
    return !!this.getBarcodeDetectorCtor();
  }

  isCurrentStep(step: EnrollementStep): boolean {
    return this.currentStep === step;
  }

  isStepCompleted(step: EnrollementStep): boolean {
    return this.steps.indexOf(step) < this.steps.indexOf(this.currentStep);
  }

  async nextStep() {
    if (this.currentStep === 'scan' && !this.currentMilitaire) {
      await this.showToast('Scannez d’abord le QR code et chargez les informations.', 'warning');
      return;
    }

    if (this.currentStep === 'photo' && !this.photoData) {
      await this.showToast('Capturez d’abord la photo du militaire.', 'warning');
      return;
    }

    if (this.currentStep === 'fingerprints' && !this.empreinteGaucheData && !this.empreinteDroiteData) {
      await this.showToast('Capturez au moins une empreinte avant de continuer.', 'warning');
      return;
    }

    const index = this.steps.indexOf(this.currentStep);
    if (index < this.steps.length - 1) {
      this.currentStep = this.steps[index + 1];
    }
  }

  previousStep() {
    const index = this.steps.indexOf(this.currentStep);
    if (index > 0) {
      this.currentStep = this.steps[index - 1];
    }
  }

  async startScanner() {
    if (!navigator.mediaDevices?.getUserMedia) {
      this.scannerMessage = 'Caméra non disponible sur cet appareil. Utilisez le collage manuel du QR.';
      await this.showToast(this.scannerMessage, 'warning');
      return;
    }

    try {
      this.stopScanner();
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });

      this.scannerActive = true;
      this.scannerMessage = this.barcodeSupported
        ? 'Scan en cours… alignez le QR code dans le cadre.'
        : 'Caméra ouverte. Si le scan auto ne démarre pas, collez le contenu du QR manuellement.';

      setTimeout(async () => {
        const video = this.scannerVideo?.nativeElement;
        if (!video || !this.stream) {
          return;
        }

        video.srcObject = this.stream;
        video.setAttribute('playsinline', 'true');
        await video.play();

        if (this.barcodeSupported) {
          void this.runScanLoop();
        }
      }, 120);
    } catch (error: unknown) {
      this.scannerActive = false;
      this.scannerMessage = 'Accès à la caméra refusé. Utilisez le collage manuel du QR.';
      const message = error instanceof Error ? error.message : this.scannerMessage;
      await this.showToast(message, 'danger');
    }
  }

  stopScanner() {
    if (this.scanTimer) {
      clearTimeout(this.scanTimer);
      this.scanTimer = null;
    }

    if (this.stream) {
      for (const track of this.stream.getTracks()) {
        track.stop();
      }
      this.stream = null;
    }

    const video = this.scannerVideo?.nativeElement;
    if (video) {
      video.pause();
      video.srcObject = null;
    }

    this.scannerActive = false;
  }

  activateCoppernicMode() {
    this.stopScanner();
    this.scannerMessage = 'Mode Coppernic actif : utilisez le scanner intégré ou collez le QR, puis validez.';
    this.focusManualQrInput();
  }

  async onManualQrEnter(event: Event) {
    event.preventDefault();
    await this.applyManualQr();
  }

  async applyManualQr() {
    if (!this.manualQr.trim()) {
      await this.showToast('Collez le contenu du QR code ou saisissez le matricule.', 'warning');
      this.focusManualQrInput();
      return;
    }

    await this.handleQrResult(this.manualQr);
  }

  async onCaptureSelected(event: Event, target: ScanTarget) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    const dataUrl = await this.readFileAsDataUrl(file);

    if (target === 'photo') {
      this.photoData = dataUrl;
    } else if (target === 'left') {
      this.empreinteGaucheData = dataUrl;
    } else {
      this.empreinteDroiteData = dataUrl;
    }
  }

  async saveEnrollement(syncNow: boolean) {
    if (!this.currentMilitaire?.matricule) {
      await this.showToast('Aucun militaire sélectionné.', 'warning');
      return;
    }

    if (!this.photoData) {
      await this.showToast('La photo du militaire est obligatoire.', 'warning');
      return;
    }

    if (!this.empreinteGaucheData && !this.empreinteDroiteData) {
      await this.showToast('Capturez au moins une empreinte avant d’enregistrer.', 'warning');
      return;
    }

    const payload: EnrollementPayload = {
      matricule: this.currentMilitaire.matricule,
      noms: this.currentMilitaire.noms,
      grade: this.currentMilitaire.grade,
      unite: this.currentMilitaire.unite,
      garnison: this.currentMilitaire.garnison,
      province: this.currentMilitaire.province,
      qr_payload: this.scannedPayload,
      photo_data: this.photoData,
      empreinte_gauche_data: this.empreinteGaucheData || undefined,
      empreinte_droite_data: this.empreinteDroiteData || undefined,
      observations: this.observations.trim(),
      enrolled_at: new Date().toISOString(),
      device_label: navigator.userAgent,
    };

    const loading = await this.loadingCtrl.create({
      message: syncNow
        ? 'Enregistrement local puis synchronisation…'
        : 'Sauvegarde locale pour synchronisation différée…',
    });
    await loading.present();

    try {
      await this.enrollementStorage.save(payload);

      if (syncNow) {
        const report = await this.enrollementStorage.syncPending();
        await this.loadPendingEnrollements();
        await loading.dismiss();

        if (report.synced > 0) {
          await this.showToast('Enrôlement enregistré et synchronisé avec succès.', 'success');
        } else {
          await this.showToast('Le dossier est resté sur la tablette pour synchronisation ultérieure.', 'warning');
        }
      } else {
        await this.loadPendingEnrollements();
        await loading.dismiss();
        await this.showToast('Enrôlement conservé sur la tablette pour la fin de journée.', 'success');
      }

      this.startNewEnrollement();
    } catch (error: unknown) {
      await loading.dismiss();
      const message = error instanceof Error ? error.message : 'Impossible d’enregistrer cet enrôlement.';
      await this.showToast(message, 'danger');
    }
  }

  async synchroniserLocal() {
    const loading = await this.loadingCtrl.create({ message: 'Synchronisation des enrôlements en attente…' });
    await loading.present();
    this.syncing = true;

    try {
      const report = await this.enrollementStorage.syncPending();
      await this.loadPendingEnrollements();
      await loading.dismiss();

      if (report.synced > 0) {
        await this.showToast(`${report.synced} enrôlement(s) synchronisé(s).`, 'success');
      } else if (report.pending > 0) {
        await this.showToast('Serveur indisponible : les dossiers restent en attente.', 'warning');
      } else {
        await this.showToast('Tout est déjà synchronisé.', 'success');
      }
    } catch (error: unknown) {
      await loading.dismiss();
      const message = error instanceof Error ? error.message : 'Synchronisation impossible';
      await this.showToast(message, 'danger');
    } finally {
      this.syncing = false;
    }
  }

  startNewEnrollement() {
    this.stopScanner();
    this.currentStep = 'scan';
    this.manualQr = '';
    this.scannedPayload = null;
    this.currentMilitaire = null;
    this.photoData = '';
    this.empreinteGaucheData = '';
    this.empreinteDroiteData = '';
    this.observations = '';
    this.scannerMessage = this.isCoppernicDevice
      ? 'Mode Coppernic prêt : scannez le QR depuis la tablette.'
      : 'Visez le QR code généré depuis le PC.';
    this.focusManualQrInput();
  }

  formatDate(value: string): string {
    if (!value) {
      return '—';
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString('fr-FR');
  }

  private async handleQrResult(raw: string) {
    try {
      const payload = this.parseQrPayload(raw);
      if (!payload.matricule) {
        throw new Error('Le matricule est introuvable dans le QR code.');
      }

      this.manualQr = raw;
      this.scannedPayload = payload;
      this.stopScanner();
      await this.loadMilitaire(payload);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'QR code invalide';
      await this.showToast(message, 'danger');
    }
  }

  private async loadMilitaire(payload: QrControlePayload) {
    this.searchInProgress = true;

    try {
      const results = await firstValueFrom(this.api.searchMilitaire(payload.matricule));
      const exact = results.find((item: Militaire) => item.matricule === payload.matricule) || results[0] || null;

      this.currentMilitaire = exact || this.createFallbackMilitaire(payload);
      this.currentStep = 'scan';

      if (!exact) {
        await this.showToast('Infos serveur indisponibles : poursuite avec les données du QR code.', 'warning');
      } else {
        await this.showToast('Informations récupérées. Cliquez sur Suivant pour la photo.', 'success');
      }
    } catch {
      this.currentMilitaire = this.createFallbackMilitaire(payload);
      this.currentStep = 'scan';
      await this.showToast('Mode hors ligne actif : les données du QR sont utilisées localement.', 'warning');
    } finally {
      this.searchInProgress = false;
    }
  }

  private createFallbackMilitaire(payload: QrControlePayload): Militaire {
    return {
      matricule: payload.matricule,
      noms: payload.noms || 'Militaire identifié par QR code',
      grade: payload.grade || 'N/A',
      unite: payload.unite || 'N/A',
      garnison: payload.garnison || 'N/A',
      province: payload.province || 'N/A',
      statut: '1',
      categorie: payload.categorie || 'ACTIF',
      beneficiaire: '',
    };
  }

  private parseQrPayload(raw: string): QrControlePayload {
    const trimmed = raw.trim();
    if (!trimmed) {
      throw new Error('Le contenu du QR code est vide.');
    }

    try {
      const parsed = JSON.parse(trimmed) as Partial<QrControlePayload>;
      if (parsed && typeof parsed === 'object') {
        return {
          matricule: String(parsed.matricule || '').trim(),
          noms: parsed.noms ? String(parsed.noms) : undefined,
          grade: parsed.grade ? String(parsed.grade) : undefined,
          mention: parsed.mention ? String(parsed.mention) : undefined,
          date_controle: parsed.date_controle ? String(parsed.date_controle) : undefined,
          unite: parsed.unite ? String(parsed.unite) : undefined,
          garnison: parsed.garnison ? String(parsed.garnison) : undefined,
          province: parsed.province ? String(parsed.province) : undefined,
          categorie: parsed.categorie ? String(parsed.categorie) : undefined,
          raw_value: trimmed,
        };
      }
    } catch {
      // Fallback plus bas
    }

    const cleaned = trimmed.replace(/^CTR\.NET\s*[:|-]?\s*/i, '');
    const firstToken = cleaned.split(/[\n|;,]/)[0]?.trim() || cleaned;

    return {
      matricule: firstToken,
      raw_value: trimmed,
    };
  }

  private async runScanLoop() {
    const BarcodeDetectorClass = this.getBarcodeDetectorCtor();
    const video = this.scannerVideo?.nativeElement;

    if (!this.scannerActive || !BarcodeDetectorClass || !video) {
      return;
    }

    try {
      const detector = new BarcodeDetectorClass({ formats: ['qr_code'] });
      const results = await detector.detect(video);
      const qrValue = results.find(item => typeof item.rawValue === 'string' && item.rawValue.trim());

      if (qrValue?.rawValue) {
        await this.handleQrResult(qrValue.rawValue);
        return;
      }
    } catch {
      this.scannerMessage = 'Scan automatique indisponible. Collez le contenu du QR ci-dessous.';
    }

    this.scanTimer = setTimeout(() => void this.runScanLoop(), 650);
  }

  private getBarcodeDetectorCtor(): BarcodeDetectorCtor | undefined {
    return (window as Window & { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const base64 = String(reader.result || '');
        const image = new Image();

        image.onload = () => {
          const maxWidth = 1280;
          const ratio = image.width > maxWidth ? maxWidth / image.width : 1;
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(image.width * ratio));
          canvas.height = Math.max(1, Math.round(image.height * ratio));

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(base64);
            return;
          }

          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        };

        image.onerror = () => resolve(base64);
        image.src = base64;
      };

      reader.onerror = () => reject(new Error('Lecture du fichier impossible.'));
      reader.readAsDataURL(file);
    });
  }

  private async loadPendingEnrollements() {
    this.pendingEnrollements = await this.enrollementStorage.listAll();
  }

  private focusManualQrInput() {
    setTimeout(() => {
      this.manualQrInput?.nativeElement.focus();
    }, 180);
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3200,
      color,
      position: 'top',
    });
    await toast.present();
  }
}
