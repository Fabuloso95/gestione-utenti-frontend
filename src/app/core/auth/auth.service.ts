import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import {
  AuthResponseDTO,
  LoginRequest,
  RegistrazioneRequest,
  UtenteResponse,
  RefreshTokenRequestDTO,
  Ruolo
} from '../../shared/models/models';

const API_BASE_URL = '/api/v1/auth';
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_ROLE_KEY = 'userRole';

@Injectable({
  providedIn: 'root',
})
export class AuthService
{
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  private userRoleSubject = new BehaviorSubject<Ruolo | null>(this.getStoredUserRole());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  public userRole$ = this.userRoleSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  )
  {
    this.checkTokenValidity();
  }

  login(credentials: LoginRequest): Observable<AuthResponseDTO>
  {
    return this.http.post<AuthResponseDTO>(`${API_BASE_URL}/login`, credentials).pipe(
      tap((response) =>
      {
        this.handleSuccessfulAuth(response);
      }),
      catchError((error: HttpErrorResponse) =>
      {
        console.error('Login fallito:', error);
        return throwError(() => error);
      })
    );
  }

  register(user: RegistrazioneRequest): Observable<UtenteResponse>
  {
    return this.http.post<UtenteResponse>(`${API_BASE_URL}/register`, user).pipe(
      catchError((error: HttpErrorResponse) =>
      {
        console.error('Registrazione fallita:', error);
        return throwError(() => error);
      })
    );
  }

  logout(): Observable<any>
  {
    const refreshToken = this.getRefreshToken();
    this.clearAuthData();
    this.router.navigate(['/login']);

    if (refreshToken)
    {
      const request: RefreshTokenRequestDTO = { refreshToken };
      return this.http.post(`${API_BASE_URL}/logout`, request).pipe(
        catchError((error) =>
        {
          console.error('Errore durante il logout lato server, ma logout locale eseguito.', error);
          return of(null);
        })
      );
    }
    return of(null);
  }

  getCurrentUserDetails(): Observable<UtenteResponse>
  {
    return this.http.get<UtenteResponse>(`${API_BASE_URL}/me`).pipe(
      catchError(error =>
      {
        console.error("Errore nel recupero dettagli utente:", error);
        return throwError(() => error);
      })
    );
  }

  private handleSuccessfulAuth(response: AuthResponseDTO): void
  {
    this.storeTokens(response.accessToken, response.refreshToken);
    this.storeUserRole(response.ruolo as Ruolo);
    this.isAuthenticatedSubject.next(true);
    this.userRoleSubject.next(response.ruolo as Ruolo);

    const payload = this.decodeJwtToken(response.accessToken);
    if (payload?.exp)
    {
      this.scheduleTokenRefresh(payload.exp * 1000);
    }
  }

  refreshToken(refreshToken: string): Observable<AuthResponseDTO>
  {
    const request: RefreshTokenRequestDTO = { refreshToken: refreshToken };

    return this.http.post<AuthResponseDTO>(`${API_BASE_URL}/refresh`, request).pipe(
      tap(response => this.handleSuccessfulAuth(response)),
      catchError(error =>
      {
        console.error('Refresh Token fallito. Eseguo logout.');
        this.clearAuthData();
        this.router.navigate(['/login']);
        return throwError(() => error);
      })
    );
  }

  /**
   * Verifica la validità del token di accesso all'avvio dell'applicazione.
   * Se scaduto ma c'è un refresh token, tenta il refresh (QUI era il problema: mancava .subscribe()).
   */
  private checkTokenValidity(): void
  {
    const token = this.getAccessToken();
    const refreshToken = this.getRefreshToken();

    if (token)
    {
      const payload = this.decodeJwtToken(token);
      if (payload?.exp)
      {
        const expirationTime = payload.exp * 1000;

        // Se il token è scaduto e abbiamo un refresh token
        if (Date.now() >= expirationTime && refreshToken)
        {
          // **CORREZIONE**: Sottoscriviamo l'Observable per avviare il refresh
          this.refreshToken(refreshToken).subscribe({
            next: () => console.log('Token aggiornato all\'avvio.'),
            error: () => {
              // Se il refresh fallisce, forziamo il logout
              this.logout();
            }
          });
        }
        else if (Date.now() < expirationTime)
        {
          // Se il token è ancora valido, pianifichiamo il prossimo refresh
          this.scheduleTokenRefresh(expirationTime);
        }
        else if (Date.now() >= expirationTime && !refreshToken)
        {
          // Token scaduto ma nessun refresh token: logout locale
          this.clearAuthData();
        }
      }
    } else {
      // Nessun token, assicuriamo che lo stato sia pulito
      this.clearAuthData();
    }
  }

  private hasValidToken(): boolean
  {
    const token = this.getAccessToken();
    if (!token) return false;

    const payload = this.decodeJwtToken(token);
    return payload?.exp ? Date.now() < (payload.exp * 1000) : false;
  }

  private scheduleTokenRefresh(expirationTime: number): void
  {
    const refreshTime = expirationTime - Date.now() - 300000; // 5 minuti prima della scadenza

    if (refreshTime > 0)
    {
      console.log(`Pianificazione refresh token tra ${Math.floor(refreshTime / 60000)} minuti.`);

      setTimeout(() =>
      {
        const refreshToken = this.getRefreshToken();
        if (refreshToken) {
          this.refreshToken(refreshToken).subscribe({
            error: () => this.logout() // Se fallisce il refresh pianificato, esegui il logout
          });
        } else {
          this.logout();
        }
      }, refreshTime);
    }
  }

  private decodeJwtToken(token: string): any
  {
    try
    {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    }
    catch (error)
    {
      console.error("Errore decodifica JWT", error);
      return null;
    }
  }

  getAccessToken(): string | null
  {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null
  {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  getStoredUserRole(): Ruolo | null
  {
    return localStorage.getItem(USER_ROLE_KEY) as Ruolo | null;
  }

  get isUserAdmin(): boolean
  {
    return this.getStoredUserRole() === 'ADMIN';
  }

  get isLoggedIn(): boolean
  {
    return this.isAuthenticatedSubject.value;
  }

  storeTokens(accessToken: string, refreshToken: string): void
  {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  storeUserRole(role: Ruolo): void
  {
    localStorage.setItem(USER_ROLE_KEY, role);
  }

  clearAuthData(): void
  {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_ROLE_KEY);
    this.isAuthenticatedSubject.next(false);
    this.userRoleSubject.next(null);
  }

  public isAuth(): boolean
  {
    return this.isLoggedIn;
  }

  public hasRole(requiredRoles: Ruolo[]): boolean
  {
    const userRole = this.getStoredUserRole();
    return userRole ? requiredRoles.includes(userRole) : false;
  }
}
