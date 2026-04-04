declare module '@angular/core' {
  export interface OnInit {
    ngOnInit(): void;
  }

  export function Component(metadata: any): any;
}

declare module '@angular/router' {
  export class Router {
    navigateByUrl(url: string, extras?: any): Promise<boolean>;
  }
}

declare module '@ionic/angular/standalone' {
  export const IonContent: any;
}
