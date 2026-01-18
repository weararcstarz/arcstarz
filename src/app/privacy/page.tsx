'use client';

import Link from 'next/link';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#F5F5F0] pt-20">
      <div className="max-w-4xl mx-auto px-4 py-12">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-headline text-4xl md:text-5xl tracking-tight mb-4">
            PRIVACY POLICY
          </h1>
          <div className="w-24 h-1 bg-[#0A0A0A] mx-auto"></div>
        </div>

        {/* Content */}
        <div className="space-y-8 font-body text-sm leading-relaxed">
          
          {/* Last Updated */}
          <div className="border-b-4 border-[#0A0A0A] pb-4">
            <p className="text-[#1C1C1C]">
              <strong>Last Updated:</strong> January 9, 2026
            </p>
          </div>

          {/* Introduction */}
          <section>
            <h2 className="font-headline text-2xl tracking-tight mb-4">1. INTRODUCTION</h2>
            <p className="mb-4">
              ARCSTARZ ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website arcstarz.com and use our online services.
            </p>
            <p>
              This Privacy Policy applies to our website, products, and services, and to all visitors, users, and others who access our services ("Users").
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="font-headline text-2xl tracking-tight mb-4">2. INFORMATION WE COLLECT</h2>
            
            <h3 className="font-headline text-lg tracking-tight mb-3 mt-6">Personal Information</h3>
            <p className="mb-4">
              We may collect personal information that can be used to identify or contact you, including but not limited to:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Name and contact information (email address, phone number, shipping address)</li>
              <li>Payment information (processed through secure third-party payment processors)</li>
              <li>Account credentials (username, password)</li>
              <li>Communication preferences</li>
            </ul>

            <h3 className="font-headline text-lg tracking-tight mb-3 mt-6">Automatically Collected Information</h3>
            <p className="mb-4">
              When you access our website, we automatically collect certain information about your device and browsing behavior:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>IP address and browser type</li>
              <li>Operating system and device information</li>
              <li>Pages visited and time spent on our website</li>
              <li>Referring website addresses</li>
              <li>Clickstream data</li>
            </ul>

            <h3 className="font-headline text-lg tracking-tight mb-3 mt-6">Cookies and Tracking Technologies</h3>
            <p>
              We use cookies and similar tracking technologies to track activity on our website and hold certain information. Cookies are files with small amounts of data which may include an anonymous unique identifier.
            </p>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="font-headline text-2xl tracking-tight mb-4">3. HOW WE USE YOUR INFORMATION</h2>
            <p className="mb-4">
              We use the information we collect for various purposes, including:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Product Fulfillment:</strong> To process and fulfill your orders, manage payments, and arrange shipping</li>
              <li><strong>Customer Service:</strong> To respond to your inquiries, provide support, and address your concerns</li>
              <li><strong>Personalization:</strong> To personalize your experience and provide relevant content and product recommendations</li>
              <li><strong>Communication:</strong> To send you order confirmations, shipping updates, and promotional communications</li>
              <li><strong>Website Improvement:</strong> To analyze website usage, identify trends, and improve our products and services</li>
              <li><strong>Security:</strong> To detect and prevent fraudulent transactions and protect the security of our website</li>
              <li><strong>Legal Compliance:</strong> To comply with legal obligations and resolve disputes</li>
            </ul>
          </section>

          {/* Information Sharing */}
          <section>
            <h2 className="font-headline text-2xl tracking-tight mb-4">4. INFORMATION SHARING</h2>
            
            <h3 className="font-headline text-lg tracking-tight mb-3 mt-6">Third-Party Service Providers</h3>
            <p className="mb-4">
              We may share your information with trusted third-party service providers who assist us in operating our website, conducting our business, or servicing users, including:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Payment processors (for secure payment processing)</li>
              <li>Shipping carriers (for order fulfillment)</li>
              <li>Analytics providers (for website usage analysis)</li>
              <li>Marketing platforms (for email communications)</li>
            </ul>

            <h3 className="font-headline text-lg tracking-tight mb-3 mt-6">Legal Requirements</h3>
            <p className="mb-4">
              We may disclose your information when required by law or in good faith belief that such action is necessary to:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Comply with legal obligations</li>
              <li>Protect and defend our rights or property</li>
              <li>Prevent or investigate possible wrongdoing</li>
              <li>Protect user safety</li>
            </ul>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="font-headline text-2xl tracking-tight mb-4">5. DATA SECURITY</h2>
            <p className="mb-4">
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
            </p>
            <p className="mb-4">
              <strong>Security Measures:</strong> We use SSL/TLS encryption for data transmission, secure payment processing, and regular security audits to protect your information.
            </p>
            <p>
              However, no method of transmission over the internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.
            </p>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="font-headline text-2xl tracking-tight mb-4">6. DATA RETENTION</h2>
            <p className="mb-4">
              We retain your personal information only as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.
            </p>
            <p>
              We may retain anonymized data for analytical purposes and to improve our services, even after you are no longer our customer.
            </p>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="font-headline text-2xl tracking-tight mb-4">7. YOUR RIGHTS</h2>
            <p className="mb-4">
              Depending on your location, you may have the following rights regarding your personal information:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Access:</strong> Request access to your personal information</li>
              <li><strong>Correction:</strong> Request correction of inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information</li>
              <li><strong>Portability:</strong> Request transfer of your data to another service</li>
              <li><strong>Objection:</strong> Object to processing of your information</li>
              <li><strong>Restriction:</strong> Request restriction of processing</li>
            </ul>
            <p>
              To exercise these rights, please contact us using the information provided below.
            </p>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="font-headline text-2xl tracking-tight mb-4">8. CHILDREN'S PRIVACY</h2>
            <p>
              Our website is not intended for children under 13 years of age. We do not knowingly collect personally identifiable information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
            </p>
          </section>

          {/* International Data Transfers */}
          <section>
            <h2 className="font-headline text-2xl tracking-tight mb-4">9. INTERNATIONAL DATA TRANSFERS</h2>
            <p>
              Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information in accordance with applicable data protection laws.
            </p>
          </section>

          {/* Changes to This Policy */}
          <section>
            <h2 className="font-headline text-2xl tracking-tight mb-4">10. CHANGES TO THIS POLICY</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
            </p>
          </section>

          {/* Contact Information */}
          <section className="border-t-4 border-[#0A0A0A] pt-8">
            <h2 className="font-headline text-2xl tracking-tight mb-4">11. CONTACT INFORMATION</h2>
            <p className="mb-4">
              If you have any questions about this Privacy Policy or want to exercise your rights, please contact us:
            </p>
            <div className="space-y-2">
              <p><strong>Email:</strong> privacy@arcstarz.com</p>
              <p><strong>Website:</strong> www.arcstarz.com</p>
              <p><strong>Address:</strong> [Your Business Address]</p>
            </div>
          </section>

        </div>

        {/* Back to Top */}
        <div className="text-center mt-12">
          <Link 
            href="/"
            className="inline-block border-4 border-[#0A0A0A] px-8 py-3 font-body text-sm font-bold uppercase tracking-wider hover:bg-[#0A0A0A] hover:text-[#F5F5F0] transition-colors"
          >
            Back to Home
          </Link>
        </div>

      </div>
    </div>
  );
}
