import { useEffect } from 'react'
import {Navigate, Routes, Route} from "react-router-dom"
import './App.css'
import {useUserStore} from "./stores/useUserStore"
import { Toaster } from "react-hot-toast";

import HomePage from "./pages/HomePage";
import AdminPage from './pages/AdminPage';
import ProductDetailPage from './pages/ProductDetailPage';
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import CategoryPage from "./pages/CategoryPage";
import CartPage from "./pages/CartPage";
import UserProfilePage from "./pages/UserProfilePage";
import CheckoutPage from "./pages/CheckoutPage";
import MpesaPendingPage from "./pages/MpesaPendingPage";
import WishlistPage from "./pages/WishlistPage";
import MpesaSuccessPage from './pages/MpesaSuccessPage';
import MpesaCancelPage from './pages/MpesaCancelPage';
import PurchaseSuccessPage from './pages/PurchaseSuccessPage';
import PurchaseCancelPage from './pages/PurchaseCancelPage';
import SearchResultsPage from "./pages/SearchResultsPage";

import ProductCard from './components/ProductCard';
import VideoCard from "./components/VideoCard";
import CreateProductForm from "./components/CreateProductForm";




function App() {

  const {user, checkAuth, checkingAuth} = useUserStore()
  useEffect(() =>{
    checkAuth();
  }, [checkAuth])



  return (
    <>
    {/* Was imported but never rendered — every toast.error()/toast.success()
        call anywhere in the app was silently doing nothing without this. */}
    <Toaster position="top-center" />
    <Routes>
      <Route path="/" element={< HomePage/>} />
      <Route path="/cart" element={< CartPage  />} />

      <Route path="/login" 
      element={ !user ? < LoginPage/> : <Navigate to="/" />} />

    <Route path="/signup"
       element={!user ? <SignupPage /> : <Navigate to="/" />}
     />

     
     <Route path="secret-dashboard"
     element={user?.role === "admin" ? <AdminPage /> : <Navigate to="/login" />} />

      <Route
            path="/user-profile"
            element={<UserProfilePage />}
          />



      <Route path="/create-product" element={< CreateProductForm/>} />
      <Route path="/products" element={< ProductCard />} />
      <Route path="/products/:id" element={< ProductDetailPage/>} />
      <Route path="/category/:slug" element={< CategoryPage />} />
      <Route path="/videos" element={< VideoCard  />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/mpesa-pending/:checkoutRequestId" element={<MpesaPendingPage />} />
      <Route path="/wishlist" element={<WishlistPage />} />
      <Route path="/purchase-success" element={<MpesaSuccessPage />} />
      <Route path="/mpesa-cancel" element={<MpesaCancelPage />} />
      
      <Route path="/purchase-success" element={<PurchaseSuccessPage />} />
      <Route path="/mpesa-cancel" element={<PurchaseCancelPage />} />

      <Route path="/search" element={<SearchResultsPage />} />
    </Routes>
   </>
  )
}

export default App