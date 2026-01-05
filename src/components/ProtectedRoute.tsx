import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function ProtectedRoute() {
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);

    useEffect(() => {
        checkUser();
    }, []);

    async function checkUser() {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            setAuthenticated(!!session);
        } catch (error) {
            setAuthenticated(false);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
            </div>
        );
    }

    return authenticated ? <Outlet /> : <Navigate to="/admin/login" replace />;
}
