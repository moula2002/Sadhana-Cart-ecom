import { useState, useEffect } from "react";
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

export const useWishlist = () => {
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
        e.stopPropagation();
        const auth = getAuth();
        const user = auth.currentUser;
        
        if (!user) {
            toast.info("Please login to manage your wishlist");
            return;
        }

        const id = product.id;
        const isWishlisted = !!globalWishlist[id];
        const favRef = doc(db, "users", user.uid, "favorites", id);

        // Optimistic UI update
        globalWishlist[id] = !isWishlisted;
        notifyListeners();

        try {
            if (isWishlisted) {
                await deleteDoc(favRef);
                toast.success(`Removed from wishlist`, { position: "bottom-right", autoClose: 2000 });
            } else {
                const newFav = {
                    productId: id,
                    name: product.name || product.title || "Product",
                    price: product.offerprice || product.price || 0,
                    originalPrice: product.price || 0,
                    image: (Array.isArray(product.images) && product.images[0]) || product.image || "https://via.placeholder.com/150",
                    addedAt: new Date().toISOString()
                };
                await setDoc(favRef, newFav);
                toast.success(`Added to wishlist!`, { position: "bottom-right", autoClose: 2000 });
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
