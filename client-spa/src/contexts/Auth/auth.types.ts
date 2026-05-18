export interface User {
  sub: string;
  email: string;
  name: string;
  roles: string[];
}

export interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
}
