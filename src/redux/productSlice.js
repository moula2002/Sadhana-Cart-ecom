// // src/redux/productSlice.js
// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import { db } from "../firebase";
// import { collection, getDocs } from "firebase/firestore";

// // 🔹 Async thunk to fetch products from Firebase
// export const fetchProducts = createAsyncThunk("products/fetch", async () => {
//   const snapshot = await getDocs(collection(db, "products"));
//   const fetchedProducts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

//   // ⚡ Limit to 20 products
//   const limitedProducts = fetchedProducts.slice(0, 20);

//   // Minimal version for localStorage caching
//   const minimalProducts = limitedProducts.map((p) => ({
//     id: p.id,
//     name: p.name,
//     price: p.price,
//     image: p.image || p.images?.[0],
//     category: p.category,
//     color: p.color,
//   }));

//   localStorage.setItem("products", JSON.stringify(minimalProducts));

//   // Return limitedProducts for Redux state
//   return limitedProducts;
// });

// const productSlice = createSlice({
//   name: "products",
//   initialState: {
//     items: [],
//     loading: false,
//     error: null,
//   },
//   reducers: {
//     // Optional: clear products from state and localStorage
//     clearProducts: (state) => {
//       state.items = [];
//       localStorage.removeItem("products");
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       .addCase(fetchProducts.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchProducts.fulfilled, (state, action) => {
//         state.loading = false;
//         state.items = action.payload;
//       })
//       .addCase(fetchProducts.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.error.message;
//       });
//   },
// });

// export const { clearProducts } = productSlice.actions;
// export default productSlice.reducer;
