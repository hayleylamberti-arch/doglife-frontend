import { Link } from "react-router-dom"

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h2 className="text-xl font-bold mb-3">DogLife</h2>
            <p className="text-sm text-gray-300">
              Trusted local dog care, starting in Gauteng.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Legal</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <Link to="/legal/privacy-policy" className="block hover:text-white">
                Privacy Policy
              </Link>
              <Link to="/legal/terms" className="block hover:text-white">
                Terms & Conditions
              </Link>
              <Link to="/legal/supplier-terms" className="block hover:text-white">
                Supplier Terms
              </Link>
              <Link to="/legal/cookies" className="block hover:text-white">
                Cookie Policy
              </Link>
              <Link to="/legal/refunds" className="block hover:text-white">
                Refund & Cancellation Policy
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Contact</h3>
            <p className="text-sm text-gray-300">
              hello@doglife.app
            </p>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-8">
          © {new Date().getFullYear()} DogLife. All rights reserved.
        </p>
      </div>
    </footer>
  )
}