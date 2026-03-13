import React, { useEffect, useState, useCallback } from "react";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "../firebase";
import "./Banner.css";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const Banner = () => {

  const [banners,setBanners]=useState([]);
  const [index,setIndex]=useState(0);
  const [loading,setLoading]=useState(true);

  /* ==========================
     FETCH BANNERS
  ========================== */

  useEffect(()=>{

    const fetchBanners=async()=>{

      try{

        const q=query(
          collection(db,"posters"),
          where("status","==","active"),
          limit(5)
        );

        const snap=await getDocs(q);

        const list=snap.docs.map(doc=>({
          id:doc.id,
          image:doc.data().image
        }));

        setBanners(list);

        /* preload images */

        list.forEach((b)=>{

          const img=new Image();
          img.src=b.image;
          img.decoding="async";
          img.loading="eager";

        });

        setLoading(false);

      }

      catch(error){

        console.error("Error fetching banners:",error);
        setLoading(false);

      }

    };

    fetchBanners();

  },[]);

  /* ==========================
     AUTO SLIDE
  ========================== */

  useEffect(()=>{

    if(banners.length===0)return;

    const interval=setInterval(()=>{

      setIndex(prev=>(prev+1)%banners.length);

    },4000);

    return()=>clearInterval(interval);

  },[banners]);

  /* ==========================
     NEXT
  ========================== */

  const nextSlide=useCallback(()=>{

    if(banners.length===0)return;

    setIndex(prev=>(prev+1)%banners.length);

  },[banners.length]);

  /* ==========================
     PREV
  ========================== */

  const prevSlide=useCallback(()=>{

    if(banners.length===0)return;

    setIndex(prev=>(prev-1+banners.length)%banners.length);

  },[banners.length]);

  /* ==========================
     Visible slides
  ========================== */

  const getVisibleIndices=()=>{

    const len=banners.length;

    const prev=(index-1+len)%len;
    const curr=index;
    const next=(index+1)%len;

    return {prev,curr,next};

  };

  if(loading){

    return(
      <div className="banner-loader-compact"></div>
    );

  }

  if(banners.length<1){

    return(
      <div className="banner-empty">
        <div className="empty-icon">🎬</div>
        <h3>No banners available</h3>
      </div>
    );

  }

  const {prev,curr,next}=getVisibleIndices();

  return(

<section className="banner-wrapper">

{/* background */}

<div className="banner-bg">

<img
src={banners[curr]?.image}
alt="bg"
loading="eager"
fetchPriority="high"
decoding="async"
/>

<div className="overlay"></div>

</div>

{/* slides */}

<div className="slides-container">

{banners.map((b,i)=>{

let slideClass="banner-slide";

if(i===curr)slideClass+=" center";
else if(i===prev)slideClass+=" left";
else if(i===next)slideClass+=" right";
else slideClass+=" hidden";

return(

<div key={b.id} className={slideClass}>

<img
src={b.image}
alt="Banner"
loading={i===curr?"eager":"lazy"}
decoding="async"
/>

</div>

);

})}

</div>

{/* navigation */}

<div className="banner-nav">

<button onClick={prevSlide} className="nav-btn left">
<FaChevronLeft/>
</button>

<button onClick={nextSlide} className="nav-btn right">
<FaChevronRight/>
</button>

</div>

{/* dots */}

<div className="banner-dots">

{banners.map((_,i)=>(

<span
key={i}
className={index===i?"dot active":"dot"}
onClick={()=>setIndex(i)}
/>

))}

</div>

</section>

  );

};

export default Banner;