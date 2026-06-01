import { computed, Injectable, signal } from '@angular/core';
import { User, UserCreateDto, UserLoginDto, UserLoginResponseDto } from '../../../lib/types/user';
import * as auth from '../../../lib/api/auth';

export interface AuthState {
  user: Omit<User, 'password'>;
  token: string;
  refreshToken: string;
}

@Injectable({ providedIn: 'root' })
export class AuthStore {
  state = signal<AuthState | null>(null);
  isLoggedIn = computed(() => this.state() !== null);

  constructor() {
    const stored = localStorage.getItem('auth_state');
    if (stored) {
      try {
        this.state.set(JSON.parse(stored) as UserLoginResponseDto);
      } catch {
        this.deleteSavedState();
      }
    }
  }

  async signup(dto: UserCreateDto) {
    const responseDto = await auth.signup(dto);
    this.setState(responseDto);
  }

  async login(dto: UserLoginDto) {
    const responseDto = await auth.login(dto);
    this.setState(responseDto);
  }

  logout() {
    this.deleteSavedState();
    this.state.set(null);
  }

  getJwtToken = () => this.state()?.token;
  getRefreshToken = () => this.state()?.refreshToken;

  saveJwtToken(newToken: string) {
    const currentState = this.state();
    if (!currentState) return;

    this.setState({ ...currentState, token: newToken });
  }

  saveRefreshToken(newToken: string) {
    const currentState = this.state();
    if (!currentState) return;

    this.setState({ ...currentState, refreshToken: newToken });
  }

  private setState(newState: AuthState) {
    localStorage.setItem('auth_state', JSON.stringify(newState));
    this.state.set(newState);
  }

  deleteSavedState = () => localStorage.removeItem('auth_state');
}
