import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import AdminDashboard from './pages/admin/Dashboard';
import Products from './pages/admin/Products';
import ProductForm from './pages/admin/ProductForm';
import Categories from './pages/admin/Categories';
import Login from './pages/admin/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { InstallPrompt } from './components/InstallPrompt';

export default function App() {
    return (
        <Router>
            <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/admin/login" element={<Login />} />

                    <Route element={<ProtectedRoute />}>
                        <Route path="/admin" element={<AdminDashboard />} />
                        <Route path="/admin/products" element={<Products />} />
                        <Route path="/admin/products/new" element={<ProductForm />} />
                        <Route path="/admin/products/:id" element={<ProductForm />} />
                        <Route path="/admin/categories" element={<Categories />} />
                    </Route>

                </Routes>
                <InstallPrompt />
            </div>
        </Router>
    );
}
