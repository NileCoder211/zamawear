import { useState, useEffect } from "react";
import { ArrowRight, Play, Mail } from "lucide-react";

const heroSlides = [
  {
    src: "/hero3.png",
    alt: "Model wearing a beige wrap dress",
    title: ["Get your", "wardrobe", "online"],
    description: "Designed for women who love effortless elegance.",
  },
  {
    src: "/hero2.png",
    alt: "Model wearing a linen shirt dress",
    title: ["Effortless", "layers, every", "season"],
    description: "Soft linens and breathable fabrics made to move with you.",
  },
  {
    src: "/hero1.png",
    alt: "Model wearing a tailored blazer",
    title: ["Tailored to", "feel like", "second skin"],
    description: "Structured silhouettes with a relaxed, lived-in comfort.",
  },
];

function HeroSection() {
  const [index, setIndex] = useState(0);

  const goTo = (i) => setIndex((i + heroSlides.length) % heroSlides.length);
  const next = () => goTo(index + 1);

  // Autoplay
  useEffect(() => {
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [index]);

  const current = heroSlides[index];

  return (
    <section className="bg-[#EDEAE4] px-3 md:px-6 py-4 md:py-6">
      <div className="max-w-7xl mx-auto rounded-[2.5rem] border-2 border-[#1E1E1E] bg-[#F8F6F2] overflow-hidden">
        <div className="grid md:grid-cols-[30%_70%] gap-6 md:gap-10 px-6 md:px-12 pt-8 md:pt-10 pb-10">
          {/* Left — headline + caption */}
          <div className="flex flex-col justify-between order-2 md:order-1">
            <div key={index} className="animate-[fadeIn_0.5s_ease-in-out]">
              <h1
                className="text-5xl sm:text-6xl md:text-7xl leading-[0.95] text-[#1E1E1E]"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                <span className="font-bold relative inline-block">
                  {current.title[0]}
                  <span className="absolute left-0 -bottom-1 w-full h-2 bg-[#C9A55C]/70 -z-10" />
                </span>
                <br />
                <span className="font-bold">{current.title[1]}</span>
                <br />
                <span className="italic font-medium">{current.title[2]}</span>
              </h1>
              <p className="text-[#5c564c] max-w-xs mt-6 text-[15px]">
                {current.description}
              </p>
            </div>

            {/* Avatar + caption + carousel controls, bottom-left like the reference */}
            <div className="flex items-center gap-3 mt-10 md:mt-0">
              <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-[#C9A55C]/40 flex-shrink-0 bg-[#E7DED1]">
                <img src="/zamalogo.png" alt="" className="w-full h-full object-cover" />
              </div>
              <p className="text-xs text-[#5c564c] leading-snug max-w-[220px]">
                Real fabrics, real fit — styled by people who actually wear them.
              </p>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <div className="flex gap-1.5">
                {heroSlides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all ${
                      i === index ? "w-6 bg-[#1E1E1E]" : "w-1.5 bg-[#1E1E1E]/25"
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={next}
                aria-label="Next slide"
                className="w-9 h-9 rounded-full border border-[#1E1E1E] flex items-center justify-center text-[#1E1E1E] hover:bg-[#1E1E1E] hover:text-white transition-colors"
              >
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Right — photo carousel with stat blocks and floating pills */}
          <div className="order-1 md:order-2 relative">
            {/* Stat callouts, top-right like the reference — pulled in
                from the edge (right-6 top-8 instead of -right-2 top-2)
                so the text has breathing room from the card's border. */}
            <div className="hidden md:flex flex-col gap-6 absolute right-6 top-8 z-10 text-right">
              <div>
                <p
                  className="text-2xl italic text-[#1E1E1E]"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  +120
                </p>
                <p className="text-[10px] tracking-wide uppercase text-[#8a8375] leading-tight">
                  New styles
                  <br />
                  this season
                </p>
              </div>
              <div>
                <p
                  className="text-2xl italic text-[#1E1E1E]"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  98%
                </p>
                <p className="text-[10px] tracking-wide uppercase text-[#8a8375] leading-tight">
                  Loved on
                  <br />
                  first wear
                </p>
              </div>
            </div>

            <div className="relative h-[360px] sm:h-[440px] md:h-[520px] rounded-[2rem] overflow-hidden bg-[#E7DED1] md:mr-24">
              {heroSlides.map((slide, i) => (
                <img
                  key={slide.src}
                  src={slide.src}
                  alt={slide.alt}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
                    i === index ? "opacity-100" : "opacity-0"
                  }`}
                />
              ))}

              {/* Floating pills */}
              <div className="absolute left-4 bottom-16 sm:bottom-20 flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-full pl-2 pr-4 py-1.5 shadow-md text-xs text-[#1E1E1E]">
                <span className="w-6 h-6 rounded-full bg-[#C9A55C] flex items-center justify-center text-white flex-shrink-0">
                  <Play size={10} fill="currentColor" />
                </span>
                Styled in under 5 minutes
              </div>
              <div className="absolute left-4 bottom-4 flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-full pl-2 pr-4 py-1.5 shadow-md text-xs text-[#1E1E1E]">
                <span className="w-6 h-6 rounded-full bg-[#1E1E1E] flex items-center justify-center text-white flex-shrink-0">
                  <Mail size={10} />
                </span>
                Get 10% off your first order
              </div>
            </div>

            {/* Circular badge, bottom-right like the reference */}
            <div className="hidden md:flex absolute -right-2 bottom-4 w-20 h-20 rounded-full bg-[#1E1E1E] items-center justify-center">
              <span
                className="text-[9px] tracking-[0.2em] uppercase text-[#F8F6F2] text-center leading-tight"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                New
                <br />
                Season
              </span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}

export default HeroSection;