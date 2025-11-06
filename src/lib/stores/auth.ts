// Svelte store for authentication state
import { writable } from 'svelte/store';

export interface AuthState {
	isAuthenticated: boolean;
	user: {
		id: string;
		email: string;
		name?: string;
	} | null;
}

const initialState: AuthState = {
	isAuthenticated: false,
	user: null
};

export const authStore = writable<AuthState>(initialState);

// Helper functions for future auth implementation
export const login = async (email: string, password: string) => {
	// TODO: Implement login
	console.log('Login not yet implemented', { email, password });
};

export const logout = () => {
	authStore.set(initialState);
};
