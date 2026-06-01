export interface User {
  userId: number;
  email: string;
  password: string;
  createdAt: string;
  currency: string;
}

export type UserCreateDto = Pick<User, 'email' | 'password'>;

export type UserLoginDto = Pick<User, 'email' | 'password'>;

export interface UserLoginResponseDto {
  user: Omit<User, 'password'>;
  token: string;
  refreshToken: string;
}
