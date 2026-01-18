'use client';

import Link from 'next/link';

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#F5F5F0] pt-20">
      <div className="max-w-4xl mx-auto px-4 py-12">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-headline text-4xl md:text-5xl tracking-tight mb-4">
            TERMS OF SERVICE
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
              Welcome to ARCSTARZ. These Terms of Service ("Terms") govern your use of our website, products, and services. By accessing or using ARCSTARZ, you agree to be bound by these Terms.
            </p>
            <p>
              ARCSTARZ is a luxury streetwear brand specializing in limited edition apparel and accessories. These Terms outline the rules and regulations for the use of our website and the purchase of our products.
            </p>
          </section>

          {/* Products and Services */}
          <section>
            <h2 className="font-headline text-2xl tracking-tight mb-4">2. PRODUCTS AND SERVICES</h2>
            <p className="mb-4">
              ARCSTARZ offers premium streetwear products including but not limited to t-shirts, hoodies, accessories, and limited edition drops. All products are subject to availability.
            </p>
            <p className="mb-4">
              <strong>Product Descriptions:</strong> We strive to be as accurate as possible in the descriptions of our products. However, we do not warrant that product descriptions, colors, information, or other content of the products are accurate, complete, reliable, current, or error-free.
            </p>
            <p>
              <strong>Pricing:</strong> All prices are displayed in your selected currency and are subject to change without notice. Prices include applicable taxes unless otherwise stated.
            </p>
          </section>

          {/* Orders and Payment */}
          <section>
            <h2 className="font-headline text-2xl tracking-tight mb-4">3. ORDERS AND PAYMENT</h2>
            <p className="mb-4">
              <strong>Order Acceptance:</strong> We reserve the right to refuse or cancel any order for any reason, including but not limited to: product availability, errors in the description or price of the product, error in your order, or if we suspect fraud or an unauthorized or illegal transaction.
            </p>
            <p className="mb-4">
              <strong>Payment Methods:</strong> We accept payment through secure payment processors. By providing payment information, you represent that you are authorized to use the payment method and that the payment information is accurate.
            </p>
            <p>
              <strong>Order Confirmation:</strong> After you place an order, you will receive a confirmation email. This email does not signify our acceptance of your order, nor does it constitute confirmation of our offer to sell.
            </p>
          </section>

          {/* Shipping and Delivery */}
          <section>
            <h2 className="font-headline text-2xl tracking-tight mb-4">4. SHIPPING AND DELIVERY</h2>
            <p className="mb-4">
              <strong>Shipping:</strong> We offer worldwide shipping. Shipping costs and delivery times vary based on your location and selected shipping method.
            </p>
            <p className="mb-4">
              <strong>Delivery Time:</strong> Estimated delivery times are provided for guidance only and are not guaranteed. We are not liable for any delays in shipments.
            </p>
            <p>
              <strong>Risk of Loss:</strong> All risk of loss and title for products pass to you upon our delivery to the shipping carrier.
            </p>
          </section>

          {/* Returns and Refunds */}
          <section>
            <h2 className="font-headline text-2xl tracking-tight mb-4">5. RETURNS AND REFUNDS</h2>
            <p className="mb-4">
              <strong>Return Policy:</strong> Due to the limited edition nature of our products, all sales are final. We do not accept returns or exchanges unless the product is defective or damaged upon arrival.
            </p>
            <p className="mb-4">
              <strong>Defective Items:</strong> If you receive a defective or damaged item, please contact us within 7 days of receipt. We will provide instructions for return and replacement.
            </p>
            <p>
              <strong>Refunds:</strong> Refunds will be processed within 5-7 business days after we receive and inspect the returned item.
            </p>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="font-headline text-2xl tracking-tight mb-4">6. INTELLECTUAL PROPERTY</h2>
            <p className="mb-4">
              <strong>ARCSTARZ Content:</strong> All content on this website, including but not limited to text, graphics, logos, images, and software, is the property of ARCSTARZ and is protected by intellectual property laws.
            </p>
            <p>
              <strong>Restricted Use:</strong> You may not use, reproduce, distribute, or create derivative works of any ARCSTARZ content without our express written permission.
            </p>
          </section>

          {/* User Conduct */}
          <section>
            <h2 className="font-headline text-2xl tracking-tight mb-4">7. USER CONDUCT</h2>
            <p className="mb-4">
              You agree not to use this website for any unlawful purpose or in any way that could damage, disable, or impair the website. You agree not to attempt to gain unauthorized access to any portion of the website.
            </p>
            <p>
              <strong>Prohibited Activities:</strong> You may not use the website to transmit any harmful, threatening, abusive, defamatory, vulgar, obscene, or otherwise objectionable material.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="font-headline text-2xl tracking-tight mb-4">8. LIMITATION OF LIABILITY</h2>
            <p className="mb-4">
              <strong>Disclaimer:</strong> ARCSTARZ and its affiliates shall not be liable for any indirect, incidental, special, or consequential damages resulting from your use of the website or purchase of products.
            </p>
            <p>
              <strong>Maximum Liability:</strong> Our total liability to you for any cause of action whatsoever, and regardless of the form of the action, will at all times be limited to the amount paid, if any, by you to us for the product(s) at issue.
            </p>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="font-headline text-2xl tracking-tight mb-4">9. GOVERNING LAW</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which ARCSTARZ operates, without regard to its conflict of law provisions.
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="font-headline text-2xl tracking-tight mb-4">10. CHANGES TO TERMS</h2>
            <p>
              We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting. Your continued use of the website constitutes acceptance of the modified Terms.
            </p>
          </section>

          {/* Contact Information */}
          <section className="border-t-4 border-[#0A0A0A] pt-8">
            <h2 className="font-headline text-2xl tracking-tight mb-4">11. CONTACT INFORMATION</h2>
            <p className="mb-4">
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <div className="space-y-2">
              <p><strong>Email:</strong> legal@arcstarz.com</p>
              <p><strong>Website:</strong> www.arcstarz.com</p>
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
