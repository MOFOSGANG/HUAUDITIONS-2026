
import React from 'react';
import { Page } from '../types';
import { Icons } from '../constants';

interface ConfirmationPageProps {
  referenceId: string;
  onNavigate: (page: Page) => void;
}

const ConfirmationPage: React.FC<ConfirmationPageProps> = ({ referenceId, onNavigate }) => {
  return (
    <div className="bg-hudt-light min-h-screen py-16 px-4 flex items-center justify-center">
      <div className="max-w-xl w-full bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-12 text-center animate-fade-in-up">
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
          <Icons.Check />
        </div>

        <h2 className="text-4xl md:text-5xl font-black text-purple-900 mb-4">Application Submitted!</h2>
        <p className="text-xl text-gray-600 mb-10 leading-relaxed">
          Thank you for applying! We are thrilled to see your passion for the arts.
        </p>

        <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-8 mb-10">
          <p className="text-amber-800 font-bold mb-2 uppercase tracking-widest text-sm">Your Reference Number</p>
          <div className="flex items-center justify-center gap-4">
            <span className="text-3xl md:text-5xl font-black text-purple-900 tracking-tighter">
              {referenceId || 'HUDT-2026-000'}
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-4 font-medium italic">Save this ID to check your application status later.</p>
        </div>

        <div className="bg-green-50 border-2 border-green-200 rounded-3xl p-6 mb-8 group hover:scale-[1.02] transition-transform">
          <p className="text-green-800 font-bold mb-4 uppercase tracking-widest text-sm">Action Required: Join the HUDT Community</p>
          <a
            href="https://chat.whatsapp.com/JIyFdFsw3t5JT2C7vEBYoq"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 bg-[#25D366] text-white font-black rounded-2xl hover:bg-[#128C7E] transition-all shadow-xl text-lg animate-pulse"
          >
            💬 JOIN HUDT NOW
          </a>
          <p className="text-gray-500 text-xs mt-4 font-medium italic">Click above to join our official WhatsApp group for instant updates.</p>
        </div>

        <div className="bg-purple-50 p-6 rounded-2xl text-left mb-10 space-y-4">
          <h4 className="font-black text-purple-900 text-lg flex items-center gap-2">
            <span>🚀</span> What Happens Next?
          </h4>
          <ul className="space-y-3">
            {[
              "Our team will review your application within 48 hours",
              "Updates will be posted in the WhatsApp group",
              "Check status anytime using your reference number",
              "Prepare to showcase your unique talents!"
            ].map((text, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700 font-medium">
                <span className="text-green-500 font-bold">✓</span> {text}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => onNavigate(Page.HOME)}
            className="flex-1 py-4 bg-purple-900 text-white font-black rounded-xl hover:bg-purple-800 transition-all shadow-lg"
          >
            Return Home
          </button>
          <button
            onClick={() => onNavigate(Page.CHECK_STATUS)}
            className="flex-1 py-4 bg-amber-500 text-white font-black rounded-xl hover:bg-amber-600 transition-all shadow-lg"
          >
            Check Status
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationPage;
