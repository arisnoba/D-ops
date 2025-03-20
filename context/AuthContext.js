import { createContext, useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const router = useRouter();

	useEffect(() => {
		// 현재 로그인한 사용자 정보 확인
		const getUser = async () => {
			// Supabase v1 방식으로 세션 및 사용자 가져오기
			const user = supabase.auth.user();
			setUser(user);
			setLoading(false);
		};

		getUser();

		// 사용자 인증 상태 변경 구독
		const authListener = supabase.auth.onAuthStateChange((event, session) => {
			setUser(session?.user || null);
			setLoading(false);
		});

		return () => {
			authListener?.unsubscribe?.();
		};
	}, []);

	// 로그인 함수
	const login = async (email, password) => {
		try {
			const { error, user } = await supabase.auth.signIn({
				email,
				password,
			});

			if (error) throw error;

			router.push('/');
			return { success: true };
		} catch (error) {
			return {
				success: false,
				error: error.message,
			};
		}
	};

	// 로그아웃 함수
	const logout = async () => {
		try {
			const { error } = await supabase.auth.signOut();
			if (error) throw error;

			router.push('/login');
		} catch (error) {
			console.error('Error logging out:', error.message);
		}
	};

	const value = {
		user,
		loading,
		login,
		logout,
		isAuthenticated: !!user,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
