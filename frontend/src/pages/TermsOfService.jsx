import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function TermsOfService() {
  return (
    <>
      <Navbar />
      <div className="max-w-3xl mx-auto px-5 py-12 text-gray-800 pt-25">
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-10">
          Last updated: September 24, 2026
        </p>

      <Section title="1. Acceptance of Terms">
        <p>
          By accessing and using the Zamawear website or ordering through
          WhatsApp, you accept and agree to be bound by these Terms of
          Service. If you do not agree to these terms, please do not use
          our website or services.
        </p>
      </Section>

      <Section title="2. Products and Services">
        <p>
          We strive to display our products as accurately as possible.
          However, we cannot guarantee that your device's display will
          accurately reflect actual product colours. All products are
          subject to availability, and we reserve the right to discontinue
          any product at any time.
        </p>
        <List
          items={[
            "Product images are for illustration purposes and may vary slightly from actual items.",
            "Sizing may vary slightly between styles; please refer to our size guide where available.",
            "Prices are subject to change without prior notice.",
          ]}
        />
      </Section>

      <Section title="3. Orders and Payment">
        <List
          items={[
            "All prices are displayed in Kenyan Shillings (KES).",
            "Payment must be made in full via M-Pesa before an order is processed.",
            "Orders are subject to product availability and payment verification.",
          ]}
        />
      </Section>

      <Section title="4. Delivery">
        <List
          items={[
            "Delivery fees are calculated based on your location.",
            "You are responsible for ensuring accurate delivery information.",
            "Someone must be present to receive the delivery.",
            "Please inspect items upon delivery and report any damage immediately.",
          ]}
        />
      </Section>

      <Section title="5. Returns and Refunds">
        <List
          items={[
            "Returns must be initiated within 7 days of delivery.",
            "Items must be unworn, unwashed, and in original packaging with tags attached.",
            "Custom or made-to-order items cannot be returned.",
            "Refunds will be processed within 7–10 business days.",
          ]}
        />
        <p>
          See our full{" "}
          <a href="/returns-exchanges" className="text-green-600 underline">
            Returns &amp; Exchanges policy
          </a>{" "}
          for details.
        </p>
      </Section>

      <Section title="6. User Accounts">
        <List
          items={[
            "Maintain the confidentiality of your account credentials.",
            "Be responsible for all activities under your account.",
            "Provide accurate and complete information.",
            "Notify us immediately of any unauthorised use.",
          ]}
        />
      </Section>

      <Section title="7. Intellectual Property">
        <p>
          All content on this website — including text, graphics, logos,
          images, and software — is the property of Zamawear and is
          protected by copyright and other intellectual property laws. You
          may not reproduce, distribute, or use any content without prior
          written permission.
        </p>
      </Section>

      <Section title="8. Limitation of Liability">
        <p>
          To the fullest extent permitted by law, Zamawear shall not be
          liable for any indirect, incidental, special, consequential, or
          punitive damages arising out of your use of our website or
          products.
        </p>
      </Section>

      <Section title="9. Governing Law">
        <p>
          These Terms of Service shall be governed by and construed in
          accordance with the laws of Kenya. Any disputes arising from
          these terms shall be subject to the exclusive jurisdiction of the
          courts of Kenya.
        </p>
      </Section>

      <Section title="10. Changes to Terms">
        <p>
          We reserve the right to modify these Terms of Service at any
          time. Changes will be effective immediately upon posting to the
          website. Your continued use of the website after any changes
          constitutes your acceptance of the updated terms.
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