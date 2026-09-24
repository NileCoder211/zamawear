import { useRef, useState } from "react";

/**
 * OrderButton — React + Tailwind
 * -------------------------------------------------------------
 * An animated order-confirmation button: on click it locks, plays
 * an 8s "delivery" sequence (package loads onto a truck, truck
 * drives left → right and off-screen), then reveals a success
 * state and fires onConfirmed().
 *
 * Usage:
 *   <OrderButton onConfirmed={() => placeOrder()} />
 *
 * Drop this file into any React + Tailwind project. Colors use the
 * ZENARA brand tokens (ink #1E1E1E, gold #C9A55C, ivory #F8F6F2) —
 * swap the hex values below to match your own palette.
 * -------------------------------------------------------------
 */
export function OrderButton({ onConfirmed, label = "Complete Order" }) {
  const [status, setStatus] = useState("idle"); // idle | animating | done
  const timeoutRef = useRef(null);

  function handleClick() {
    if (status !== "idle") return;
    setStatus("animating");
    timeoutRef.current = setTimeout(() => {
      setStatus("done");
      onConfirmed?.();
    }, 8000);
  }

  return (
    <>
      <style>{`
        .order-btn { position: relative; overflow: hidden; isolation: isolate; }
        .order-btn__road { position:absolute; inset:0; display:flex; align-items:center; opacity:0; pointer-events:none; }
        .order-btn__road span { flex:0 0 auto; width:18px; height:3px; margin-right:14px; background:rgba(248,246,242,.35); border-radius:2px; }
        .order-btn.is-animating .order-btn__road { animation: road-fade 8s ease forwards; }
        .order-btn.is-animating .order-btn__label { animation: label-fade 8s ease forwards; }
        .order-btn__package {
          position:absolute; top:50%; left:18%; width:28px; height:24px;
          transform:translate(-50%,-50%) scale(0);
          background:linear-gradient(180deg,#e3b04b 0%,#c9a55c 100%);
          border-radius:3px; box-shadow:inset 0 0 0 2px rgba(30,30,30,.15); z-index:2;
        }
        .order-btn.is-animating .order-btn__package { animation: load-package 8s ease forwards; }
        .order-btn__truck { position:absolute; top:50%; left:-30%; transform:translate(0,-50%); width:64px; height:34px; z-index:3; opacity:0; }
        .order-btn.is-animating .order-btn__truck { animation: truck-drive 8s ease forwards; }
        .order-btn__check { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; gap:8px; opacity:0; color:#F8F6F2; z-index:4; }
        .order-btn.is-animating .order-btn__check { animation: check-in 8s ease forwards; }

        @keyframes label-fade { 0%{opacity:1} 8%{opacity:0} 92%{opacity:0} 100%{opacity:0} }
        @keyframes road-fade { 0%{opacity:0} 10%{opacity:1} 78%{opacity:1} 92%{opacity:0} 100%{opacity:0} }
        @keyframes load-package {
          0%{ transform:translate(-50%,-50%) scale(0); opacity:0 }
          8%{ transform:translate(-50%,-50%) scale(1); opacity:1 }
          28%{ transform:translate(-50%,-50%) scale(1); opacity:1 }
          40%{ left:44%; transform:translate(-50%,-50%) scale(.9); opacity:1 }
          60%{ left:64%; transform:translate(-50%,-50%) scale(.9); opacity:1 }
          75%{ left:100%; transform:translate(-50%,-50%) scale(.8); opacity:1 }
          85%{ opacity:0 } 100%{ opacity:0 }
        }
        @keyframes truck-drive {
          0%{ left:-30%; opacity:0 }
          6%{ opacity:1 }
          10%,30%{ left:calc(46% - 32px); opacity:1 }
          40%{ left:calc(66% - 32px); opacity:1 }
          60%{ left:calc(86% - 32px); opacity:1 }
          75%{ left:calc(100% + 40px); opacity:1 }
          85%,100%{ left:calc(100% + 40px); opacity:0 }
        }
        @keyframes check-in {
          0%,80%{ opacity:0; transform:scale(.8) }
          88%{ opacity:1; transform:scale(1.05) }
          100%{ opacity:1; transform:scale(1) }
        }
        @media (prefers-reduced-motion: reduce) {
          .order-btn.is-animating .order-btn__truck,
          .order-btn.is-animating .order-btn__package,
          .order-btn.is-animating .order-btn__road,
          .order-btn.is-animating .order-btn__label,
          .order-btn.is-animating .order-btn__check { animation: none !important; }
          .order-btn.is-animating .order-btn__label { opacity: 0; }
          .order-btn.is-animating .order-btn__check { opacity: 1; }
        }
      `}</style>

      <button
        type="button"
        onClick={handleClick}
        disabled={status !== "idle"}
        className={`order-btn w-full max-w-sm h-16 rounded-full bg-[#1E1E1E] text-[#F8F6F2] relative select-none
          ${status === "idle" ? "hover:bg-[#2a2a2a] cursor-pointer" : "cursor-default"}
          ${status === "animating" ? "is-animating" : ""}
          ${status === "done" ? "bg-[#C9A55C] text-[#1E1E1E]" : ""}
          transition-colors duration-300`}
      >
        <span className="order-btn__label absolute inset-0 flex items-center justify-center text-[15px] tracking-[0.25em] uppercase">
          {label}
        </span>

        <span className="order-btn__road" aria-hidden="true">
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} />
          ))}
        </span>

        <span className="order-btn__package" aria-hidden="true" />

        <span className="order-btn__truck" aria-hidden="true">
          <svg viewBox="0 0 64 34" width="64" height="34" fill="none">
            <rect x="0" y="8" width="34" height="18" rx="2" fill="#E7DED1" />
            <path d="M34 14h14l10 8v4H34V14Z" fill="#C9455A" />
            <rect x="41" y="17" width="8" height="7" rx="1" fill="#F8F6F2" opacity="0.6" />
            <circle cx="14" cy="28" r="4.5" fill="#1E1E1E" stroke="#F8F6F2" strokeWidth="1.5" />
            <circle cx="48" cy="28" r="4.5" fill="#1E1E1E" stroke="#F8F6F2" strokeWidth="1.5" />
          </svg>
        </span>

        <span className="order-btn__check absolute inset-0 flex items-center justify-center text-[15px] tracking-[0.25em] uppercase">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7.5 12.5l3 3 6-6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Order Confirmed
        </span>
      </button>
    </>
  );
}

/* ------------------------------------------------------------- */
/* Demo wrapper so this file previews on its own.                 */
/* Delete this and keep just OrderButton for real use.            */
/* ------------------------------------------------------------- */
export default function OrderButtonDemo() {
  const [confirmed, setConfirmed] = useState(false);
  return (
    <div className="min-h-screen bg-[#F8F6F2] flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="font-serif text-3xl text-[#1E1E1E]" style={{ fontFamily: "Georgia, serif" }}>
        Confirm Your Order
      </h1>
      <OrderButton onConfirmed={() => setConfirmed(true)} />
      <p className="text-xs text-[#1E1E1E]/50 text-center max-w-xs">
        {confirmed
          ? "Order confirmed — this is where you'd call your API / redirect."
          : "Tap the button and watch the full 8s delivery sequence."}
      </p>
    </div>
  );
}