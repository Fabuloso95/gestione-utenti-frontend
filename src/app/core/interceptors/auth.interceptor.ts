import { Injectable, Injector } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
  HTTP_INTERCEPTORS,
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, switchMap, finalize } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import { AuthResponseDTO } from '../../shared/models/models';

const EXCLUDED_URLS =
[
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/refresh',
  '/api/v1/auth/logout'
];

@Injectable()
export class AuthInterceptor implements HttpInterceptor
{
  private authService: AuthService;
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<AuthResponseDTO | null> = new BehaviorSubject<AuthResponseDTO | null>(null);

  constructor(private injector: Injector)
  {
    this.authService = this.injector.get(AuthService);
  }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>>
  {
    const accessToken = this.authService.getAccessToken();

    if (accessToken && !this.isExcludedUrl(request.url))
    {
      request = this.addToken(request, accessToken);
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) =>
      {
        if (error.status === 401 && !this.isExcludedUrl(request.url) && this.authService.getRefreshToken())
        {
          return this.handle401Error(request, next);
        }
        return throwError(() => error);
      })
    );
  }

  private addToken(request: HttpRequest<unknown>, token: string): HttpRequest<unknown>
  {
    return request.clone({
      setHeaders:
      {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  private isExcludedUrl(url: string): boolean
  {
    return EXCLUDED_URLS.some(excludedUrl => url.includes(excludedUrl));
  }

  private handle401Error(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>>
  {
    if (!this.isRefreshing)
    {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      const refreshToken = this.authService.getRefreshToken()!;

      console.log('401 ricevuto. Avvio del refresh token...');

      return this.authService.refreshToken(refreshToken).pipe(
        switchMap((authResponse: AuthResponseDTO) =>
        {
          this.refreshTokenSubject.next(authResponse);
          console.log('Refresh token riuscito. Ritrasmetto la richiesta originale.');
          return next.handle(this.addToken(request, authResponse.accessToken));
        }),
        catchError(refreshError =>
        {
          console.error('Refresh Token Fallito. Richiesta scartata.');
          return throwError(() => refreshError);
        }),
        finalize(() =>
        {
          this.isRefreshing = false;
        })
      );
    }
    else
    {
      console.log('401 ricevuto. In attesa del completamento del refresh...');
      return this.refreshTokenSubject.pipe(
        filter(authResponse => authResponse !== null),
        switchMap(authResponse =>
        {
          return next.handle(this.addToken(request, authResponse!.accessToken));
        })
      );
    }
  }
}

export const AuthInterceptorProvider =
{
  provide: HTTP_INTERCEPTORS,
  useClass: AuthInterceptor,
  multi: true,
};
