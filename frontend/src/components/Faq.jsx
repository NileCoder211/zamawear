import { useState } from "react";
import { ChevronDown, Plus, Minus } from "lucide-react";

const FAQ_ITEMS = [
  {
    question: "What payment methods does Zamawear accept?",
    answer:
      "We accept M-Pesa via STK push for a fast, secure checkout. Just enter your phone number at checkout and confirm the payment prompt on your device.",
  },
  {
    question: "How long does delivery take?",
    answer:
      "Orders within Nairobi typically arrive within 1-2 business days. Deliveries to other parts of Kenya usually take 2-4 business days depending on your location.",
  },
  {
    question: "Do you deliver outside Kenya?",
    answer:
      "Right now we only deliver within Kenya. We're working on expanding to other East African countries soon, so stay tuned.",
  },
  {
    question: "What is 'Thrift Finds'?",
    answer:
      "Thrift Finds is our curated collection of quality second-hand clothing. Every piece is inspected and cleaned before listing, and we note any wear in the product description.",
  },
  {
    question: "Can I return or exchange an item?",
    answer:
      "Yes. Items can be returned or exchanged within 7 days of delivery, provided they're unworn, unwashed, and still have their tags. Thrift Finds items are final sale unless there's a defect not noted in the listing.",
  },
  {
    question: "How do I track my order?",
    answer:
      "Once your order ships, you'll get a confirmation with your order status. You can also check order status anytime from your account dashboard.",
  },
  {
    question: "Do I need an account to shop?",
    answer:
      "You can browse freely without an account, but you'll need to sign up to check out. Creating an account also lets you track orders, save addresses, and check out faster next time.",
  },
  {
    question: "Can I sign in with Google?",
    answer:
      "Yes, you can sign up or log in instantly using your Google account, no separate password needed.",
  },
  {
    question: "What if I forget my password?",
    answer:
      "Use the 'Forgot password' link on the login page. We'll send a reset code to your registered email so you can set a new password in minutes.",
  },
  {
    question: "How do I know what size to order?",
    answer:
      "Each product page includes a size guide with measurements for that specific item. Since fit can vary by style, we recommend checking the guide before ordering rather than relying on your usual size.",
  },
  {
    question: "How do I care for the body care products?",
    answer:
      "Storage and usage instructions are listed on each product page. In general, keep creams in a cool, dry place away from direct sunlight to preserve their quality.",
  },
  {
    question: "How can I contact customer support?",
    answer:
      "Reach out through the contact page or email our support team directly. We aim to respond to all queries within 24 hours.",
  },
  {
    question: "Can I delete my account?",
    answer:
      "Yes. Account deletion requests go through a 30-day grace period, during which you can still recover your account. After that, your personal data is anonymized.",
  },
];

function FAQItem({ item, isOpen, onToggle }) {
  return (
    <div
      style={{
        border: `1px solid ${isOpen ? "#C9A55C" : "#E7DED1"}`,
        borderRadius: "16px",
        marginBottom: "1rem",
        overflow: "hidden",
        transition: "border-color 0.3s ease",
        background: "#FFFFFF",
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          padding: "1.25rem 1.5rem",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "1.15rem",
            fontWeight: 500,
            color: "#1E1E1E",
          }}
        >
          {item.question}
        </span>
        <span
          style={{
            flexShrink: 0,
            width: "26px",
            height: "26px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid #C9A55C",
            color: "#C9A55C",
          }}
        >
          {isOpen ? <Minus size={13} /> : <Plus size={13} />}
        </span>
      </button>

      <div
        style={{
          maxHeight: isOpen ? "300px" : "0px",
          overflow: "hidden",
          transition: "max-height 0.35s ease",
        }}
      >
        <p
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: "0.92rem",
            lineHeight: 1.7,
            color: "#5c564c",
            padding: "0 1.5rem 1.5rem",
            margin: 0,
          }}
        >
          {item.answer}
        </p>
      </div>
    </div>
  );
}

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section
      style={{
        background: "#F8F6F2",
        padding: "4rem 1.5rem",
      }}
    >
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Poppins:wght@300;400;500&display=swap"
      />
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <p
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: "0.75rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "#B9A58E",
              marginBottom: "0.5rem",
            }}
          >
            Support
          </p>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "2.25rem",
              fontWeight: 600,
              color: "#1E1E1E",
              margin: 0,
            }}
          >
            Frequently asked questions
          </h2>
        </div>

        <div>
          {FAQ_ITEMS.map((item, index) => (
            <FAQItem
              key={index}
              item={item}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? -1 : index)}
            />
          ))}
        </div>

        <p
          style={{
            textAlign: "center",
            fontFamily: "'Poppins', sans-serif",
            fontSize: "0.85rem",
            color: "#8a8375",
            marginTop: "2.5rem",
          }}
        >
          Still have questions? Reach out to our support team and we'll get back to you within 24 hours.
        </p>
      </div>
    </section>
  );
}