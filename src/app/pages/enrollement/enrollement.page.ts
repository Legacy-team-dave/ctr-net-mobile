import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonIcon, IonSpinner
} from '@ionic/angular/standalone';
import { LoadingController, ToastController } from '@ionic/angular/standalone';
import { Capacitor, registerPlugin } from '@capacitor/core';
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
type BarcodeDetectorSource = HTMLVideoElement | HTMLCanvasElement | HTMLImageElement | ImageBitmap;
type BarcodeDetectorInstance = {
  detect(source: BarcodeDetectorSource): Promise<DetectedBarcode[]>;
};
type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => BarcodeDetectorInstance;
type NativeScanBarcode = { rawValue?: string };

interface NativeBarcodeScannerPlugin {
  isSupported(): Promise<{ supported: boolean }>;
  scan(options?: { formats?: string[]; autoZoom?: boolean }): Promise<{ barcodes: NativeScanBarcode[] }>;
  isGoogleBarcodeScannerModuleAvailable?: () => Promise<{ available: boolean }>;
  installGoogleBarcodeScannerModule?: () => Promise<void>;
  openSettings?: () => Promise<void>;
}

const NativeBarcodeScanner = registerPlugin<NativeBarcodeScannerPlugin>('BarcodeScanner');

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
  @ViewChild('manualQrInput') manualQrInput?: ElementRef<HTMLInputElement>;
  @ViewChild('qrImageInput') qrImageInput?: ElementRef<HTMLInputElement>;

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
  nativeScannerBusy = false;
  readonly isCoppernicDevice = /coppernic|c-one|c-five|c-five\.0|tab/i.test((navigator.userAgent || '').toLowerCase());
  scannerMessage = 'Scannez le QR standard généré sur le PC (PNG 1024 / correction M) ou utilisez la saisie manuelle.';
  scannedPayload: QrControlePayload | null = null;
  qrRawPayload = '';
  qrResolvedPayload = '';
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

  get isNativeAndroid(): boolean {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
  }

  get barcodeSupported(): boolean {
    return !!this.getBarcodeDetectorCtor();
  }

  get canUseLiveScanner(): boolean {
    return !this.isNativeAndroid && this.barcodeSupported;
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
    if (this.isNativeAndroid) {
      await this.startNativeScanner();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      this.scannerMessage = 'Caméra non disponible sur cet appareil. Utilisez le scan QR par photo.';
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
      this.scannerMessage = this.canUseLiveScanner
        ? 'Scan en cours… alignez le QR code dans le cadre.'
        : 'Caméra ouverte. Si le scan auto ne démarre pas, reprenez le scan ou utilisez une photo du QR.';

      setTimeout(async () => {
        const video = this.scannerVideo?.nativeElement;
        if (!video || !this.stream) {
          return;
        }

        video.srcObject = this.stream;
        video.setAttribute('playsinline', 'true');
        await video.play();

        if (this.canUseLiveScanner) {
          void this.runScanLoop();
        }
      }, 120);
    } catch (error: unknown) {
      this.scannerActive = false;
      this.scannerMessage = 'Accès à la caméra refusé. Autorisez la caméra puis réessayez.';
      const message = error instanceof Error ? error.message : this.scannerMessage;
      await this.showToast(message, 'danger');
    }
  }

  private async startNativeScanner() {
    this.stopScanner();
    this.nativeScannerBusy = true;
    this.scannerMessage = 'Ouverture du scanner QR natif…';

    try {
      const { supported } = await NativeBarcodeScanner.isSupported();
      if (!supported) {
        throw new Error('Le scanner QR natif n’est pas disponible sur cet appareil. Utilisez la photo du QR ou la saisie manuelle.');
      }

      if (typeof NativeBarcodeScanner.isGoogleBarcodeScannerModuleAvailable === 'function') {
        const availability = await NativeBarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
        if (!availability.available && typeof NativeBarcodeScanner.installGoogleBarcodeScannerModule === 'function') {
          await NativeBarcodeScanner.installGoogleBarcodeScannerModule();
          this.scannerMessage = 'Le module QR Google est en cours d’installation. Relancez le scan dans quelques secondes.';
          await this.showToast(this.scannerMessage, 'warning');
          return;
        }
      }

      const { barcodes } = await NativeBarcodeScanner.scan({
        formats: ['QR_CODE'],
        autoZoom: true,
      });

      const qrValue = barcodes.find((item: NativeScanBarcode) => typeof item.rawValue === 'string' && item.rawValue.trim());
      if (!qrValue?.rawValue) {
        await this.showToast('Aucun QR détecté. Réessayez ou utilisez la photo / saisie manuelle.', 'warning');
        return;
      }

      await this.handleQrResult(qrValue.rawValue);
    } catch (error: unknown) {
      this.scannerMessage = 'Scan natif indisponible. Utilisez la photo du QR ou la saisie manuelle.';
      const message = error instanceof Error ? error.message : 'Impossible d’ouvrir le scanner QR natif.';
      await this.showToast(message, 'danger');
    } finally {
      this.nativeScannerBusy = false;
    }
  }

  openQrImagePicker() {
    this.qrImageInput?.nativeElement.click();
  }

  async onQrImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    try {
      const qrContent = await this.readQrFromFile(file);
      if (!qrContent) {
        throw new Error('QR code non détecté sur la photo. Réessayez avec une image plus nette.');
      }

      await this.handleQrResult(qrContent);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Lecture du QR code impossible.';
      await this.showToast(message, 'danger');
    } finally {
      input.value = '';
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
    this.scannerMessage = 'Mode Coppernic actif : scannez le QR avec le lecteur intégré.';
    this.focusManualQrInput();
  }

  async onManualQrEnter(event: Event) {
    event.preventDefault();
    await this.applyManualQr();
  }

  async applyManualQr() {
    if (!this.manualQr.trim()) {
      await this.showToast('Scannez un QR code pour continuer.', 'warning');
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
    this.qrRawPayload = '';
    this.qrResolvedPayload = '';
    this.currentMilitaire = null;
    this.photoData = '';
    this.empreinteGaucheData = '';
    this.empreinteDroiteData = '';
    this.observations = '';
    this.scannerMessage = this.isCoppernicDevice
      ? 'Mode Coppernic prêt : scannez le QR depuis la tablette.'
      : 'Scannez le QR standard généré sur le PC (PNG 1024 / correction M) ou utilisez la saisie manuelle.';

    if (this.isCoppernicDevice) {
      this.focusManualQrInput();
    }
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

      if (!this.isQrEligible(payload)) {
        throw new Error('QR refusé : seuls les militaires contrôlés vivants peuvent être enrôlés.');
      }

      this.manualQr = raw;
      this.qrRawPayload = raw;
      this.scannedPayload = payload;
      this.qrResolvedPayload = JSON.stringify(payload, null, 2);
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
      const enrichedPayload = await this.resolveQrPayloadFromServer(payload);
      if (!this.isQrEligible(enrichedPayload)) {
        throw new Error('QR refusé : seuls les militaires contrôlés vivants peuvent être enrôlés.');
      }

      const exact = await this.resolveMilitaireFromServer(enrichedPayload.matricule);

      this.scannedPayload = enrichedPayload;
      this.qrResolvedPayload = JSON.stringify(enrichedPayload, null, 2);
      this.currentMilitaire = exact || this.createFallbackMilitaire(enrichedPayload);
      this.currentStep = 'scan';

      if (!exact) {
        await this.showToast('Infos serveur indisponibles : poursuite avec les données du QR code.', 'warning');
      } else {
        await this.showToast('Informations récupérées depuis CTR.NET-FARDC. Cliquez sur Suivant pour la photo.', 'success');
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('QR refusé')) {
        this.currentMilitaire = null;
        this.currentStep = 'scan';
        throw error;
      }

      this.currentMilitaire = this.createFallbackMilitaire(payload);
      this.currentStep = 'scan';
      await this.showToast('Mode hors ligne actif : les données du QR sont utilisées localement.', 'warning');
    } finally {
      this.searchInProgress = false;
    }
  }

  private isQrEligible(payload: QrControlePayload | null): boolean {
    if (!payload) {
      return false;
    }

    return !payload.type_controle || payload.type_controle === 'Militaire';
  }

  private async resolveQrPayloadFromServer(payload: QrControlePayload): Promise<QrControlePayload> {
    try {
      const serverPayload = await firstValueFrom(this.api.lookupQrData({
        controle_id: payload.controle_id,
        matricule: payload.matricule,
      }));

      return serverPayload
        ? { ...payload, ...serverPayload, raw_value: payload.raw_value }
        : payload;
    } catch {
      return payload;
    }
  }

  private async resolveMilitaireFromServer(matricule: string): Promise<Militaire | null> {
    try {
      const exact = await firstValueFrom(this.api.getMilitaireByMatricule(matricule));
      if (exact?.matricule) {
        return exact;
      }
    } catch {
      // Fallback vers la recherche tolérante ci-dessous
    }

    const results = await firstValueFrom(this.api.searchMilitaire(matricule));
    return results.find((item: Militaire) => item.matricule === matricule) || results[0] || null;
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

    const cleaned = trimmed.replace(/^(CTR\.NET|ENROL\.NET)\s*[:|-]?\s*/i, '').trim();

    try {
      const parsed = JSON.parse(cleaned) as Partial<QrControlePayload> & Record<string, unknown>;
      if (parsed && typeof parsed === 'object') {
        return {
          source: parsed.source ? String(parsed.source) : (parsed['s'] ? String(parsed['s']) : undefined),
          payload_version: parsed.payload_version !== undefined ? Number(parsed.payload_version) : (parsed['v'] !== undefined ? Number(parsed['v']) : undefined),
          controle_id: parsed.controle_id !== undefined ? Number(parsed.controle_id) : (parsed['id'] !== undefined ? Number(parsed['id']) : undefined),
          matricule: String(parsed.matricule || parsed['m'] || '').trim(),
          noms: parsed.noms ? String(parsed.noms) : (parsed['n'] ? String(parsed['n']) : undefined),
          grade: parsed.grade ? String(parsed.grade) : (parsed['g'] ? String(parsed['g']) : undefined),
          mention: parsed.mention ? String(parsed.mention) : (parsed['mn'] ? String(parsed['mn']) : undefined),
          date_controle: parsed.date_controle ? String(parsed.date_controle) : (parsed['d'] ? String(parsed['d']) : undefined),
          unite: parsed.unite ? String(parsed.unite) : (parsed['u'] ? String(parsed['u']) : undefined),
          garnison: parsed.garnison ? String(parsed.garnison) : (parsed['ga'] ? String(parsed['ga']) : undefined),
          province: parsed.province ? String(parsed.province) : (parsed['p'] ? String(parsed['p']) : undefined),
          categorie: parsed.categorie ? String(parsed.categorie) : (parsed['c'] ? String(parsed['c']) : undefined),
          type_controle: parsed.type_controle ? String(parsed.type_controle) : (parsed['tc'] ? String(parsed['tc']) : undefined),
          lien_parente: parsed.lien_parente ? String(parsed.lien_parente) : (parsed['lp'] ? String(parsed['lp']) : undefined),
          nom_beneficiaire: parsed.nom_beneficiaire ? String(parsed.nom_beneficiaire) : (parsed['b'] ? String(parsed['b']) : undefined),
          new_beneficiaire: parsed.new_beneficiaire ? String(parsed.new_beneficiaire) : (parsed['nb'] ? String(parsed['nb']) : undefined),
          observations: parsed.observations ? String(parsed.observations) : (parsed['o'] ? String(parsed['o']) : undefined),
          raw_value: trimmed,
        };
      }
    } catch {
      // Compatibilité avec les anciens QR textuels
    }

    const legacyPayload = this.parseLegacyQrText(cleaned);
    if (legacyPayload.matricule) {
      return {
        ...legacyPayload,
        matricule: String(legacyPayload.matricule || '').trim(),
        raw_value: trimmed,
      };
    }

    const firstToken = cleaned
      .split(/[\n|;,]/)[0]
      ?.replace(/^matricule\s*[:=-]?\s*/i, '')
      .trim() || cleaned;

    return {
      matricule: firstToken,
      raw_value: trimmed,
    };
  }

  private parseLegacyQrText(raw: string): Partial<QrControlePayload> {
    const extract = (label: string): string | undefined => {
      const match = raw.match(new RegExp(`(?:^|\\n)\\s*${label}\\s*[:=-]\\s*(.+)`, 'i'));
      return match?.[1]?.trim() || undefined;
    };

    return {
      matricule: extract('matricule'),
      noms: extract('noms'),
      grade: extract('grade'),
      unite: extract('unité|unite'),
      garnison: extract('garnison'),
      province: extract('province'),
      categorie: extract('catégorie|categorie'),
      date_controle: extract('date contrôle|date controle'),
      mention: extract('mention'),
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
      this.scannerMessage = 'Scan automatique indisponible. Réessayez ou utilisez une photo du QR.';
    }

    this.scanTimer = setTimeout(() => void this.runScanLoop(), 650);
  }

  private getBarcodeDetectorCtor(): BarcodeDetectorCtor | undefined {
    return (window as Window & { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
  }

  private async readQrFromFile(file: File): Promise<string | null> {
    const BarcodeDetectorClass = this.getBarcodeDetectorCtor();
    if (!BarcodeDetectorClass) {
      throw new Error('Le scan automatique n’est pas disponible sur cet appareil. Réessayez avec un appareil compatible ou une photo plus nette du QR.');
    }

    const image = await this.loadImageElement(file);
    const detector = new BarcodeDetectorClass({ formats: ['qr_code'] });

    const directResults = await detector.detect(image);
    let qrValue = directResults.find(item => typeof item.rawValue === 'string' && item.rawValue.trim());
    if (qrValue?.rawValue) {
      return qrValue.rawValue.trim();
    }

    const normalizedCanvas = this.buildNormalizedQrCanvas(image);
    const normalizedResults = await detector.detect(normalizedCanvas);
    qrValue = normalizedResults.find(item => typeof item.rawValue === 'string' && item.rawValue.trim());

    return qrValue?.rawValue?.trim() || null;
  }

  private buildNormalizedQrCanvas(image: HTMLImageElement): HTMLCanvasElement {
    const targetMaxSide = 1024;
    const sourceWidth = Math.max(1, image.naturalWidth || image.width);
    const sourceHeight = Math.max(1, image.naturalHeight || image.height);
    const scale = targetMaxSide / Math.max(sourceWidth, sourceHeight);
    const targetWidth = Math.max(1, Math.round(sourceWidth * scale));
    const targetHeight = Math.max(1, Math.round(sourceHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Impossible de normaliser l’image du QR code.');
    }

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

    return canvas;
  }

  private loadImageElement(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const image = new Image();

      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image);
      };

      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Image du QR code invalide.'));
      };

      image.src = url;
    });
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
