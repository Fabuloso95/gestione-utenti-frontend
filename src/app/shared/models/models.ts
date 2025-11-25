export type Ruolo = 'ADMIN' | 'UTENTE';

export interface RuoloDTO
{
  id: number;
  nome: string;
}

export interface UtenteResponse
{
  id: number;
  nome: string;
  cognome: string;
  dataNascita: string;
  ruolo: Ruolo;
}

export interface AuthResponseDTO
{
  accessToken: string;
  refreshToken: string;
  codiceFiscale: string;
  ruolo: string;
}

export interface LoginRequest
{
  codiceFiscale: string;
  password: string;
}

export interface RegistrazioneRequest
{
  codiceFiscale: string;
  password: string;
  nome: string;
  cognome: string;
  dataNascita: string;
}

export interface UtenteUpdateRequest
{
  nome: string;
  cognome: string;
  dataNascita: string;
  ruolo: Ruolo;
}

export interface UtenteRequest
{
  nome: string;
  cognome: string;
  codiceFiscale: string;
  dataNascita: string;
  ruolo: Ruolo;
  password?: string;
}

export interface RefreshTokenRequestDTO
{
  refreshToken: string;
}

export interface ErrorResponse
{
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}
