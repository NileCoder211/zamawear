import Navbar from "../components/Navbar";
import Footer from "../components/Footer";


export default function PrivacyPolicy() {
  return (
    <>
    <Navbar />
    <div className="max-w-3xl mx-auto px-5 py-12 text-gray-800 pt-25">
      
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-10">
        Last updated: September 24, 2026
      </p>

      <Section title="1. Introduction">
        <p>
          Welcome to Zamawear. We are committed to protecting your personal
          information and your right to privacy. This Privacy Policy
          explains how we collect, use, disclose, and safeguard your
          information when you visit our website, order through WhatsApp,
          or make a purchase.
        </p>
      </Section>

      <Section title="2. Information We Collect">
        <p>We collect information that you provide directly to us, including:</p>
        <List
          items={[
            <>
              <strong>Personal Information:</strong> Name, email address,
              phone number, and delivery address.
            </>,
            <>
              <strong>Account Information:</strong> If you sign in with
              Google, we receive your name and email address from your
              Google account to create and manage your Zamawear account.
            </>,
            <>
              <strong>Order Information:</strong> Items purchased, selected
              sizes and colors, and order history.
            </>,
            <>
              <strong>Payment Information:</strong> Payments are processed
              securely through M-Pesa. We do not store your M-Pesa PIN or
              full payment card details.
            </>,
            <>
              <strong>Communication Data:</strong> Messages you send us via
              WhatsApp, our website, or customer support, including
              delivery details you provide to complete an order.
            </>,
          ]}
        />
      </Section>

      <Section title="3. How We Use Your Information">
        <List
          items={[
            "Process and fulfil your orders, including orders placed through WhatsApp.",
            "Provide delivery updates and order confirmations.",
            "Confirm and process M-Pesa payments.",
            "Provide customer support.",
            "Improve our website and services.",
            "Detect and prevent fraud.",
          ]}
        />
      </Section>

      <Section title="4. Information Sharing">
        <p>We do not sell or rent your personal information. We may share information only with:</p>
        <List
          items={[
            <>
              <strong>WhatsApp/Meta</strong>, to send you order confirmations
              and updates through WhatsApp.
            </>,
            <>
              <strong>Safaricom (M-Pesa)</strong>, to process payments
              securely.
            </>,
            <>
              <strong>Google</strong>, to authenticate your login if you
              sign in with Google.
            </>,
            "Delivery partners, for order fulfilment.",
            "Service providers supporting our operations.",
            "Authorities, when legally required.",
          ]}
        />
      </Section>

      <Section title="5. Data Security">
        <p>
          We apply appropriate technical and organisational measures to
          safeguard your data. However, no online system is completely
          secure, and absolute security cannot be guaranteed.
        </p>
      </Section>

      <Section title="6. Your Rights">
        <p>You have the following rights regarding your personal data:</p>
        <List
          items={[
            "Access the personal information we hold about you.",
            "Request corrections to inaccurate data.",
            "Request deletion of your data.",
            "Withdraw consent where applicable.",
          ]}
        />
      </Section>

      <Section title="7. Cookies">
        <p>
          We use cookies to keep you signed in, remember your preferences,
          and understand how our website is used. You can manage cookies
          through your browser settings at any time.
        </p>
      </Section>

      <Section title="8. Changes to This Policy">
        <p>
          We may update this Privacy Policy periodically. Any changes will
          be reflected on this page with an updated revision date. We
          encourage you to review this page regularly.
        </p>
      </Section>

      <Section title="Questions About Your Data?">
        <p>
          If you have questions about this policy or how we handle your
          information, contact us through WhatsApp or our customer support
          channel on the Zamawear website.
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