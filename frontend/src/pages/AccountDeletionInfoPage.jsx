import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function AccountDeletionInfoPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#F8F6F2] px-5 py-16">
        <div className="mx-auto max-w-2xl">
          <div className="text-center mb-10">
            <img src="/zamalogo.png" alt="Zama Wear" className="mx-auto h-12 w-auto" />
            <p className="mt-2 text-xl tracking-[0.15em] text-[#1E1E1E] font-heading">
            ZAMA WEAR
          </p>
        </div>

        <div className="rounded-lg border border-[#B9A58E]/25 bg-white p-8 md:p-10">
          <h1 className="text-3xl text-[#1E1E1E] font-heading mb-2">
            Deleting your account
          </h1>
          <p className="text-sm text-[#1E1E1E]/60 mb-8">
            How to request deletion of your Zama Wear account and the data
            associated with it.
          </p>

          <section className="mb-8">
            <h2 className="text-lg text-[#1E1E1E] font-heading mb-3">
              Option 1: From within the app
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-sm text-[#1E1E1E]/80">
              <li>Log in to your Zama Wear account.</li>
              <li>Open your profile and go to <strong>Settings</strong>.</li>
              <li>
                Under <strong>Danger zone</strong>, select{" "}
                <strong>Delete my account</strong>.
              </li>
              <li>
                Confirm with your password (or by typing "DELETE" if you
                signed up with Google).
              </li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-lg text-[#1E1E1E] font-heading mb-3">
              Option 2: Without access to the app
            </h2>
            <p className="text-sm text-[#1E1E1E]/80">
              If you no longer have access to the app or your account, email{" "}
              <a
                href="mailto:support@zamawear.com"
                className="font-medium text-[#C9A55C] hover:underline"
              >
                support@zamawear.com
              </a>{" "}
              from the email address on your account and request deletion.
              We'll verify your identity and process the request within 7
              days.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg text-[#1E1E1E] font-heading mb-3">
              What happens after you request deletion
            </h2>
            <ul className="list-disc list-inside space-y-2 text-sm text-[#1E1E1E]/80">
              <li>You're logged out immediately.</li>
              <li>
                Your account enters a 30-day grace period. Logging back in
                during this window automatically cancels the deletion.
              </li>
              <li>
                Once the 30 days pass, your name, email, password, profile
                picture, cart, and wishlist are permanently erased and
                cannot be recovered.
              </li>
              <li>
                Past orders are kept, but disconnected from your identity —
                each order already stores its own snapshot of the item name,
                image, and price from purchase time, so this doesn't require
                any of your personal account data.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg text-[#1E1E1E] font-heading mb-3">
              Data retained and why
            </h2>
            <p className="text-sm text-[#1E1E1E]/80">
              We retain anonymized order records for accounting and legal
              recordkeeping purposes only. No data that identifies you
              personally — name, email, or contact details — is kept once
              deletion completes.
            </p>
          </section>
        </div>

        <p className="text-center text-xs text-[#1E1E1E]/50 mt-8">
          Questions? Contact{" "}
          <a href="mailto:support@zamawear.com" className="underline">
            support@zamawear.com
          </a>
          . Already have an account?{" "}
          <Link to="/login" className="underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
    <Footer />
    </>
  );
}