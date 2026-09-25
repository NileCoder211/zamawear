import Navbar from "../components/Navbar";
import Footer from "../components/Footer";


export default function ReturnsExchanges() {
  return (
    <>
      <Navbar />
      <div className="max-w-3xl mx-auto px-5 py-12 text-gray-800 pt-25">
        <h1 className="text-3xl font-bold mb-2">Returns &amp; Exchanges</h1>
        <p className="text-gray-500 mb-10">
          We want you to love what you ordered. Here's our policy if you need
          to make a change.
      </p>

      <Section title="Return Policy">
        <p>
          We offer a 7-day return policy on most items. If you're not
          completely satisfied with your purchase, you may return it
          within 7 days of delivery.
        </p>
        <List
          items={[
            "Items must be unworn and unwashed, in original packaging",
            "Original tags and labels must be attached",
            "Proof of purchase (order number) required",
            "Refunds processed within 7–10 business days",
          ]}
        />
      </Section>

      <Section title="Eligible for Returns">
        <List
          items={[
            "Standard clothing items in original condition",
            "Items damaged during shipping (report within 48 hours)",
            "Items significantly different from product description",
            "Wrong items delivered",
            "Defective products (manufacturing defects)",
          ]}
        />
      </Section>

      <Section title="Not Eligible for Returns">
        <List
          items={[
            "Custom-made or personalized items",
            "Items marked as \"Final Sale\" or clearance",
            "Items showing signs of wear, washing, or damage",
            "Underwear and swimwear (hygiene reasons)",
            "Opened body care products (hygiene reasons)",
          ]}
        />
      </Section>

      <Section title="How to Request a Return or Exchange">
        <ol className="space-y-4">
          <Step number="01" title="Contact Us">
            Message us on WhatsApp at +254 745 653 399.
          </Step>
          <Step number="02" title="Provide Details">
            Include your order number, the item(s) you wish to return, and
            the reason.
          </Step>
          <Step number="03" title="Get Approval">
            We'll review your request and confirm whether it's eligible.
          </Step>
          <Step number="04" title="Schedule Pickup">
            We'll arrange collection or provide drop-off instructions.
          </Step>
          <Step number="05" title="Inspection">
            Items are inspected upon receipt to confirm eligibility.
          </Step>
          <Step number="06" title="Refund / Exchange">
            Processed within 7–10 business days once inspection is
            complete.
          </Step>
        </ol>
      </Section>

      <Section title="Refund Information">
        <p>Refunds are processed to the original payment method.</p>
        <List
          items={[
            "M-Pesa: refunds typically processed within 3–5 business days, sent to the phone number used at checkout.",
          ]}
        />
      </Section>

      <Section title="Need Help?">
        <p>
          Message us on WhatsApp at{" "}
          <a
            href="https://wa.me/254745653399"
            className="text-green-600 underline"
          >
            +254 745 653 399
          </a>
          .
        </p>
      </Section>
    </div>
    <Footer />
    </>
  );
}

function Section({ title, children }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-3">{title}</h2>
      <div className="space-y-3 leading-relaxed">{children}</div>
    </section>
  );
}

function List({ items }) {
  return (
    <ul className="list-disc pl-6 space-y-1">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

function Step({ number, title, children }) {
  return (
    <li className="flex gap-4">
      <span className="font-mono text-sm text-gray-400 pt-1">{number}</span>
      <div>
        <p className="font-semibold">{title}</p>
        <p>{children}</p>
      </div>
    </li>
  );
}