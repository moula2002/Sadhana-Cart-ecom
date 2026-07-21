import { db } from "../firebase";
import {
  doc,
  setDoc,
  getDocs,
  collection,
  query,
  orderBy,
  limit,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";

const STORAGE_KEY = "sc_recently_viewed";
const MAX_ITEMS = 10;

const getFirstImage = (p) => {
  if (!p) return "";
  if (typeof p.image === "string" && p.image) return p.image;
  if (Array.isArray(p.images) && p.images[0]) return p.images[0];
  if (p.imageUrl) return p.imageUrl;
  return "";
};

/**
 * Record a product as recently viewed
 */
export const recordRecentlyViewed = async (product, user) => {
  if (!product || (!product.id && !product.productid)) return;
  const pId = product.id || product.productid;

  const itemData = {
    productId: pId,
    name: product.name || product.title || "Product",
    price: Number(product.price || 0),
    offerprice: Number(product.offerprice || product.price || 0),
    image: getFirstImage(product),
    category: product.category || "",
    rating: product.rating?.rate || (typeof product.rating === "number" ? product.rating : null),
    viewedAt: Date.now(),
  };

  // 1. Update LocalStorage
  try {
    const local = localStorage.getItem(STORAGE_KEY);
    let list = local ? JSON.parse(local) : [];

    list = list.filter((item) => item.id !== pId && item.productId !== pId);
    list.unshift({ ...itemData, id: pId });

    if (list.length > MAX_ITEMS) {
      list = list.slice(0, MAX_ITEMS);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error("Error updating recently viewed localStorage:", e);
  }

  // 2. If user is logged in, update Firestore
  if (user && user.uid) {
    try {
      const docRef = doc(db, "users", user.uid, "recentlyViewed", pId);
      await setDoc(docRef, {
        ...itemData,
        viewedAt: serverTimestamp(),
      });

      // Maintain max 10 in Firestore
      const colRef = collection(db, "users", user.uid, "recentlyViewed");
      const q = query(colRef, orderBy("viewedAt", "desc"));
      const snap = await getDocs(q);

      if (snap.docs.length > MAX_ITEMS) {
        const excessDocs = snap.docs.slice(MAX_ITEMS);
        for (const excessDoc of excessDocs) {
          await deleteDoc(excessDoc.ref);
        }
      }
    } catch (e) {
      console.error("Error recording recently viewed in Firestore:", e);
    }
  }
};

/**
 * Fetch recently viewed products
 */
export const getRecentlyViewed = async (user) => {
  let items = [];

  if (user && user.uid) {
    try {
      const colRef = collection(db, "users", user.uid, "recentlyViewed");
      const q = query(colRef, orderBy("viewedAt", "desc"), limit(MAX_ITEMS));
      const snap = await getDocs(q);

      items = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
    } catch (e) {
      console.error("Error fetching recently viewed from Firestore:", e);
    }
  }

  if (items.length === 0) {
    try {
      const local = localStorage.getItem(STORAGE_KEY);
      if (local) {
        items = JSON.parse(local);
      }
    } catch (e) {
      console.error("Error reading recently viewed from localStorage:", e);
    }
  }

  return items;
};

/**
 * Sync guest localStorage to Firestore upon login
 */
export const syncLocalStorageToFirestore = async (user) => {
  if (!user || !user.uid) return;

  try {
    const local = localStorage.getItem(STORAGE_KEY);
    if (!local) return;

    const list = JSON.parse(local);
    if (!Array.isArray(list) || list.length === 0) return;

    for (const item of list) {
      const pId = item.id || item.productId;
      if (!pId) continue;

      const docRef = doc(db, "users", user.uid, "recentlyViewed", pId);
      await setDoc(
        docRef,
        {
          productId: pId,
          name: item.name || "Product",
          price: Number(item.price || 0),
          offerprice: Number(item.offerprice || item.price || 0),
          image: item.image || "",
          category: item.category || "",
          rating: item.rating || 4.2,
          viewedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
  } catch (e) {
    console.error("Error syncing local recently viewed to Firestore:", e);
  }
};
