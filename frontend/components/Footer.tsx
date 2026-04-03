import React from 'react';
import Link from 'next/link';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-bg-page text-text-muted py-12 mt-auto border-t border-border-subtle">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <Link href="/" className="flex items-center">
              <div
                className="h-30 w-100 bg-contain bg-no-repeat bg-center md:bg-left"
                style={{ backgroundImage: "url('/KnowYourMLA_Full.png') ", backgroundSize: "450px", backgroundPosition: "-70px -60px" }}
                role="img"
                aria-label="KnowYourMLA Logo"
              />
            </Link>
            <p className="text-sm text-text-muted max-w-xs text-center md:text-left">
              Empowering citizens with data-driven insights into Tamil Nadu's political landscape.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 md:gap-12 text-sm font-medium">
            <Link href="/terms" className="hover:text-text-primary transition-colors">
              Terms of Service
            </Link>
            <Link href="/privacy" className="hover:text-text-primary transition-colors">
              Privacy
            </Link>
            <Link href="/about" className="hover:text-text-primary transition-colors">
              About Us
            </Link>
          </div>

          <div className="text-sm text-text-muted font-medium max-w-md text-center md:text-right">
            © {currentYear} KnowYourMLA.<br />
            All Rights Reserved. Data sourced from MyNeta.info and Election Commission.
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border-subtle text-center">
          <p className="text-xs text-text-muted max-w-2xl mx-auto leading-relaxed">
            Data aggregated from official sources including ECI and MyNeta. This platform is non-partisan and does not endorse any political entity.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
