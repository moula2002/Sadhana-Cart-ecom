import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";

let globalRatings = {};
let listeners = [];
let isInitialized = false;

const notifyListeners = () => {
  listeners.forEach(listener => listener({ ...globalRatings }));
};

const initGlobalRatings = () => {
    if (isInitialized) return;
    isInitialized = true;
    
    const ratingRef = collection(db, "rating");
    onSnapshot(ratingRef, (snapshot) => {
        const tempRatings = {};
        
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            const pid = data.productid || data.productId; 
            if (!pid) return;
            
            const ratingValue = Number(data.rating);
            if (isNaN(ratingValue)) return;

            if (!tempRatings[pid]) {
                tempRatings[pid] = { total: 0, count: 0 };
            }
            tempRatings[pid].total += ratingValue;
            tempRatings[pid].count += 1;
        });

        // Compute averages
        const finalRatings = {};
        for (const pid in tempRatings) {
            const avg = tempRatings[pid].total / tempRatings[pid].count;
            finalRatings[pid] = {
                average: avg % 1 === 0 ? avg.toFixed(1) : (Math.round(avg * 10) / 10).toFixed(1),
                count: tempRatings[pid].count
            };
        }
        
        globalRatings = finalRatings;
        notifyListeners();
    }, (error) => {
        console.error("Error fetching ratings:", error);
    });
};

export const useRatings = () => {
    const [ratings, setRatings] = useState(globalRatings);

    useEffect(() => {
        initGlobalRatings();
        listeners.push(setRatings);
        setRatings({ ...globalRatings });
        
        return () => {
            listeners = listeners.filter(l => l !== setRatings);
        };
    }, []);

    return ratings;
};
