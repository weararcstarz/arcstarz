import { Suspense } from 'react';
import ThankYouContent from './thank-you-client';

export default function ThankYou() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <div className="w-20 h-20 bg-[#0A0A0A] rounded-full flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-[#F5F5F0] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    }>
      <ThankYouContent />
    </Suspense>
  );
}
