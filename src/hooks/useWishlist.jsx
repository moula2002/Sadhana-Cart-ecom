import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, doc, setDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { toast } from "react-toastify";

// Global cache for wishlist state so all components sync instantly
let globalWishlist = {};
let listeners = [];

const notifyListeners = () => {
  listeners.forEach(listener => listener({ ...globalWishlist }));
};

let isInitialized = false;
let dbUnsubscribe = null;

const initGlobalWishlist = () => {
    if (isInitialized) return;
    isInitialized = true;
    const auth = getAuth();
    
    onAuthStateChanged(auth, (user) => {
        if (user) {
            const favRef = collection(db, "users", user.uid, "favorites");
            dbUnsubscribe = onSnapshot(favRef, (snapshot) => {
                const newWishlist = {};
                snapshot.docs.forEach(doc => {
                    newWishlist[doc.id] = true;
                });
                globalWishlist = newWishlist;
                notifyListeners();
            });
        } else {
            if (dbUnsubscribe) dbUnsubscribe();
            globalWishlist = {};
            notifyListeners();
        }
    });
};

const ToastContent = ({ title, img, action }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '4px 0' }}>
    {img && (
      <div style={{
        width: '48px', height: '48px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0,
        boxShadow: '0 4px 10px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9'
      }}>
        <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    )}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '15px' }}>{action}</span>
      <span style={{ 
        fontSize: '13px', color: '#64748b', 
        display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.4'
      }}>
        {title}
      </span>
    </div>
  </div>
);

export const useWishlist = () => {
    const navigate = useNavigate();
    const [wishlisted, setWishlisted] = useState(globalWishlist);

    useEffect(() => {
        initGlobalWishlist();
        listeners.push(setWishlisted);
        // Ensure the component has the latest state when mounted
        setWishlisted({ ...globalWishlist }); 
        
        return () => {
            listeners = listeners.filter(l => l !== setWishlisted);
        };
    }, []);

    const toggleWishlist = async (e, product) => {
        if (e && e.stopPropagation) e.stopPropagation();
        const auth = getAuth();
        const user = auth.currentUser;
        
        if (!user) {
            toast.info("Please login to manage your wishlist");
            navigate('/login');
            return;
        }

        const id = product.id;
        const isWishlisted = !!globalWishlist[id];
        const favRef = doc(db, "users", user.uid, "favorites", id);

        // Optimistic UI update
        globalWishlist[id] = !isWishlisted;
        notifyListeners();

        try {
            const productName = product.name || product.title || "Product";
            const image = (Array.isArray(product.images) && product.images[0]) || product.image || "https://via.placeholder.com/150";
            
            if (isWishlisted) {
                await deleteDoc(favRef);
                toast.success(<ToastContent title={productName} img={image} action="Removed from Wishlist" />, { hideProgressBar: true });
            } else {
                const newFav = {
                    productId: id,
                    name: productName,
                    price: product.offerprice || product.price || 0,
                    originalPrice: product.price || 0,
                    image: image,
                    addedAt: new Date().toISOString()
                };
                await setDoc(favRef, newFav);
                toast.success(<ToastContent title={productName} img={image} action="Added to Wishlist!" />, { hideProgressBar: true });
            }
        } catch (error) {
            console.error("Wishlist toggle error", error);
            // Revert on failure
            globalWishlist[id] = isWishlisted;
            notifyListeners();
            toast.error("Failed to update wishlist");
        }
    };

    return { wishlisted, toggleWishlist };
};
