export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-border mt-auto">
      <div className="container-app py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="font-semibold text-primary">GamMarket</p>
            <p className="text-sm text-text-secondary">
              Local marketplace for The Gambia
            </p>
          </div>
          
          <div className="text-center sm:text-right text-sm text-text-secondary">
            <p>&copy; {new Date().getFullYear()} Gambia Marketplace</p>
            <p className="mt-1">Made with care for The Gambia</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
