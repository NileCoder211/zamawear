import {useState} from "react";

function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  }

  return (
    <section className="max-w-2xl mx-auto text-center px-5 py-14 md:py-16">
      <h2 className="text-2xl text-[#1E1E1E] mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
        Be the First to Know
      </h2>
      <p className="text-[#1E1E1E]/60 text-sm mb-6">Sign up for new arrivals, exclusive offers and more.</p>
      {submitted ? (
        <p className="text-[#C9A55C] text-sm tracking-[0.25em] uppercase">Thank you for subscribing</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 justify-center">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            className="bg-[#F8F6F2] border border-[#B9A58E]/40 px-5 py-3 text-sm flex-1 sm:w-72 focus:outline-none focus:border-[#C9A55C]"
          />
          <button type="submit" className="bg-[#1E1E1E] text-[#F8F6F2] px-8 py-3 text-[13px] tracking-[0.25em] uppercase hover:bg-[#C9A55C] hover:text-[#1E1E1E] transition-colors">
            Subscribe
          </button>
        </form>
      )}
    </section>
  );
}

export default Newsletter;