import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-gray-900 py-10 text-white">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h2 className="mb-3 text-xl font-bold">DogLife</h2>
            <p className="text-sm text-gray-300">
              Trusted local dog care, starting in Gauteng.
            </p>
          </div>

          <div>
            <h3 className="mb-3 font-semibold">Legal</h3>
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

              <Link to="/legal/refunds" className="block hover:text-white">
                Refund & Cancellation Policy
              </Link>

              <Link to="/legal/health-safety" className="block hover:text-white">
                Health & Safety Policy
              </Link>

              <Link to="/legal/trust-safety" className="block hover:text-white">
                Trust & Safety
              </Link>

              <Link
                to="/legal/community-standards"
                className="block hover:text-white"
              >
                Community Standards
              </Link>

              <Link to="/legal/disclaimer" className="block hover:text-white">
                Disclaimer
              </Link>

              <Link to="/legal/cookies" className="block hover:text-white">
                Cookie Policy
              </Link>
            </div>
          </div>

          <div>
            <h3 className="mb-3 font-semibold">Contact</h3>
            <p className="text-sm text-gray-300">hello@doglife.app</p>
          </div>
        </div>

        <p className="mt-8 text-xs text-gray-400">
          © {new Date().getFullYear()} DogLife. All rights reserved.
        </p>
      </div>
    </footer>
  );
}