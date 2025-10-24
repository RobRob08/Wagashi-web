export function Footer() {
  return (
    <footer
      id="contact"
      className=" py-10 lg:py-24"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16 mb-16">
          {/* Brand */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="text-2xl tracking-[0.3em]">
                WAGASHI
              </div>
              <div className="w-px h-6 bg-border"></div>
              <div className="text-sm text-muted-foreground">
                <img src="/image/logo.png" width={60} height={60} alt="Wagashi Logo"/>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
              Preserving the sacred art of Japanese
              confectionery. Each piece handcrafted 
              with devotion to capture the essence
              of the seasons.
            </p>
          </div>

          {/* Links */}
          <div className="space-y-4">
            <div className="text-sm mb-6">Navigation</div>
            <div className="space-y-3">
              <a
                href="#products"
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Products
              </a>
              <a
                href="#about"
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                About
              </a>
              <a
                href="#gallery"
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Gallery
              </a>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <div className="text-sm mb-6">Contact</div>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div>Gion District</div>
              <div>Quezon City, Philippines</div>
              <div className="pt-2">info@wagashi.jp</div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            © 2025 Wagashi. All rights reserved.
          </div>
          <div className="text-xs text-muted-foreground">
            十二代目 • 12th Generation Master Artisan
          </div>
        </div>
      </div>
    </footer>
  );
}
