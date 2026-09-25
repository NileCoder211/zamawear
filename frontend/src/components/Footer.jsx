import { FaFacebook,FaInstagram,FaTiktok,FaWhatsapp,} from "react-icons/fa";
import { Link } from "react-router-dom";


function Footer() {
  return (
    <>
    <footer className="bg-[#E7DED1]/60 text-black">
      <div className="max-w-7xl mx-auto px-5 md:px-10 py-14 grid sm:grid-cols-2 md:grid-cols-4 gap-10">
        <div>
          <div className=" flex text-2xl tracking-[0.15em] mb-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          <img src="/zamalogo.png" alt="Zama Wear" className="h-9 w-9" />ZAMAWEAR</div>
          <p className="text-black text-sm max-w-xs">
            We create timeless pieces with premium quality fabrics and attention to detail to make you feel confident every day.
          </p>
        </div>
        <div>
          <h4 className="text-[11px] tracking-[0.25em] uppercase text-black mb-4">Shop</h4>
          <ul className="space-y-2 text-sm text-black">
            <li>Dresses</li><li>Two-Piece Sets</li><li>Baby Collection</li><li>New Arrivals</li>
          </ul>
        </div>
        <div>
          <h4 className="text-[11px] tracking-[0.25em] uppercase text-black mb-4">Help</h4>
          <ul className="space-y-2 text-sm text-black">
            <li>Track My Order</li>
            <li>FAQ</li>
            <li>Contact Us</li>
          </ul>
        </div>
        <div>
          <h4 className="text-[11px] tracking-[0.25em] uppercase text-black mb-4">Stay Connected</h4>
          <p className="text-sm text-black mb-3">Email: zamawear@gmail.com</p>
          <p className="text-sm text-black mb-3">Number: +254745653399</p>
           <div className="flex gap-4">
  {/* Facebook */}
  <a
  href="https://facebook.com/your-page"
  target="_blank"
  rel="noopener noreferrer"
  className="group h-8 w-8 border border-gray-300 rounded flex items-center justify-center hover:bg-blue-600 hover:border-blue-600 transition-colors"
>
  <FaFacebook size={22} className="text-gray-700 group-hover:text-white transition-colors" />
</a>

  {/* TikTok */}
  <a
    href="https://tiktok.com/@your-account"
    target="_blank"
    rel="noopener noreferrer"
    className="group h-8 w-8 border border-gray-300 rounded flex items-center justify-center hover:bg-black hover:border-black transition-colors"
  >
    <FaTiktok size={20} className="text-gray-700 group-hover:text-white transition-colors" />
  </a>

  {/* Instagram */}
  <a
    href="https://instagram.com/your-account"
    target="_blank"
    rel="noopener noreferrer"
    className="group h-8 w-8 border border-gray-300 rounded flex items-center justify-center hover:bg- hover:bg-gradient-to-tr hover:from-[#FCAF45] hover:via-[#E1306C] hover:to-[#833AB4] hover:border-transparent hover:border-black transition-colors"
  >
    <FaInstagram size={22} className="text-gray-700 group-hover:text-white transition-colors" />
  </a>

  {/* WhatsApp */}
  <a
     href="https://wa.me/254700000000"
  target="_blank"
  rel="noopener noreferrer"
  className="group h-8 w-8 border border-gray-300 rounded flex items-center justify-center hover:bg-[#25D366] hover:border-[#25D366] transition-colors"
>
  <FaWhatsapp size={22} className="text-gray-700 group-hover:text-white transition-colors" />
</a>
</div>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-black/50 text-sm text-black/50 py-5 px-5">
  <p>&copy; {new Date().getFullYear()} ZAMAWEAR. All rights reserved.</p>

  <ul className="flex flex-wrap items-center justify-center gap-6 text-black">
    <li>
      <Link to="/privacy-policy" onClick={() => window.scrollTo(0, 0)} className="hover:text-red-600 transition-colors">
        Privacy Policy
      </Link>
    </li>
    <li>
      <Link to="/terms-of-service" onClick={() => window.scrollTo(0, 0)} className="hover:text-red-600 transition-colors">
        Terms of Service
      </Link>
    </li>
    <li>
      <Link to="/returns-exchanges" onClick={() => window.scrollTo(0, 0)} className="hover:text-red-600 transition-colors">
        Returns and Exchange Policy
      </Link>
    </li>
    <li>
      <Link to="/account-deletion-info" onClick={() => window.scrollTo(0, 0)} className="hover:text-red-600 transition-colors">
        Account Deletion Information
      </Link>
    </li>
  </ul>
</div>
    </footer>
    </>
  );
}

export default Footer;