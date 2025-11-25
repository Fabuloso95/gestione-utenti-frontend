import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  UtenteRequest,
  UtenteUpdateRequest,
  UtenteResponse,
} from '../../shared/models/models';

@Injectable({
  providedIn: 'root'
})
export class UtenteService
{
  private readonly BASE_URL = 'http://localhost:8080/api/v1';
  private readonly UTENTI_URL = `${this.BASE_URL}/utenti`;
  private readonly AUTH_URL = `${this.BASE_URL}/auth`;
  private http = inject(HttpClient);

  creaUtente(utente: UtenteRequest): Observable<UtenteResponse>
  {
    return this.http.post<UtenteResponse>(this.UTENTI_URL, utente);
  }

  ottieniUtente(id: number): Observable<UtenteResponse>
  {
    return this.http.get<UtenteResponse>(`${this.UTENTI_URL}/${id}`);
  }

  ottieniTuttiGliUtenti(): Observable<UtenteResponse[]>
  {
    return this.http.get<UtenteResponse[]>(this.UTENTI_URL);
  }

  aggiornaUtente(id: number, request: UtenteUpdateRequest): Observable<UtenteResponse>
  {
    return this.http.put<UtenteResponse>(`${this.UTENTI_URL}/${id}`, request);
  }

  cercaUtenti(query: string): Observable<UtenteResponse[]>
  {
    let params = new HttpParams().set('query', query);
    return this.http.get<UtenteResponse[]>(`${this.UTENTI_URL}/search`, { params });
  }

  eliminaUtente(id: number): Observable<void>
  {
    return this.http.delete<void>(`${this.UTENTI_URL}/${id}`);
  }
}
