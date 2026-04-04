declare module '@angular/core' {
  export interface OnInit {
    ngOnInit(): void;
  }

  export interface OnDestroy {
    ngOnDestroy(): void;
  }

  export class ElementRef<T = any> {
    nativeElement: T;
    constructor(nativeElement: T);
  }

  export function Component(metadata: any): any;
  export function Injectable(metadata?: any): any;
  export function ViewChild(selector: any, options?: any): any;
  export function inject<T = any>(token: any): T;
}

declare module '@angular/forms' {
  export const FormsModule: any;
}

declare module '@angular/router' {
  export type Routes = any[];
  export type CanActivateFn = (...args: any[]) => any;

  export class Router {
    navigate(commands: any[], extras?: any): Promise<boolean>;
    navigateByUrl(url: string, extras?: any): Promise<boolean>;
  }

  export function provideRouter(...args: any[]): any;
}

declare module '@angular/common' {
  export const CommonModule: any;
}

declare module '@angular/common/http' {
  export class HttpHeaders {
    constructor(headers?: any);
  }

  export class HttpErrorResponse extends Error {
    status: number;
    error: any;
  }

  export class HttpClient {
    get<T = any>(url: string, options?: any): any;
    post<T = any>(url: string, body?: any, options?: any): any;
  }
}

declare module '@ionic/angular' {
  export class LoadingController {
    create(options?: any): Promise<any>;
  }

  export class ToastController {
    create(options?: any): Promise<any>;
  }

  export class AlertController {
    create(options?: any): Promise<any>;
  }
}

declare module '@ionic/angular/standalone' {
  export const IonApp: any;
  export const IonRouterOutlet: any;
  export const IonHeader: any;
  export const IonToolbar: any;
  export const IonTitle: any;
  export const IonContent: any;
  export const IonButton: any;
  export const IonIcon: any;
  export const IonSpinner: any;
  export const IonTabBar: any;
  export const IonTabButton: any;
  export const IonLabel: any;

  export class LoadingController {
    create(options?: any): Promise<any>;
  }

  export class ToastController {
    create(options?: any): Promise<any>;
  }

  export class AlertController {
    create(options?: any): Promise<any>;
  }
}

declare module '@capacitor/core' {
  export const Capacitor: {
    isNativePlatform(): boolean;
    getPlatform(): string;
  };

  export function registerPlugin<T = any>(name: string): T;
}

declare module '@capacitor/preferences' {
  export const Preferences: any;
}

declare module '@capacitor/geolocation' {
  export const Geolocation: any;
}

declare module '@capacitor/network' {
  export const Network: any;
}

declare module 'rxjs' {
  export class Observable<T = any> {}

  export class BehaviorSubject<T = any> {
    value: T;
    constructor(value: T);
    next(value: T): void;
    asObservable(): Observable<T>;
  }

  export function firstValueFrom<T = any>(source: any): Promise<T>;
  export function from(input: any): any;
  export function throwError(factory: any): any;
  export function of<T = any>(...values: T[]): any;
}

declare module 'rxjs/operators' {
  export function catchError(...args: any[]): any;
  export function map(...args: any[]): any;
  export function switchMap(...args: any[]): any;
  export function timeout(...args: any[]): any;
}
