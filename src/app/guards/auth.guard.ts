import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn) return true;

  const valid = await auth.checkSession();
  if (valid) return true;

  const hasServer = await auth.hasServerConfigured();
  if (!hasServer) {
    router.navigateByUrl('/config', { replaceUrl: true });
  } else {
    router.navigateByUrl('/login', { replaceUrl: true });
  }
  return false;
};

export const noAuthGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn) {
    router.navigateByUrl('/tabs/enrollement', { replaceUrl: true });
    return false;
  }

  const valid = await auth.checkSession();
  if (valid) {
    router.navigateByUrl('/tabs/enrollement', { replaceUrl: true });
    return false;
  }
  return true;
};
