
import React, { useState } from 'react';
import { Page, AppStatus } from '../types';
import { Icons } from '../constants';
import { checkApplicationStatus, ApplicationStatus } from '../lib/api';

interface StatusCheckerProps {
  applications?: any[]; // Optional legacy prop, not used with API
  onNavigate: (page: Page) => void;
}

const StatusChecker: React.FC<StatusCheckerProps> = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [result, setResult] = useState<ApplicationStatus | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchTerm.trim()) return;

    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await checkApplicationStatus(searchTerm.trim());
      if (response.success) {
        setResult(response.application);
      } else {
        setResult(null);
      }
    } catch (err: any) {
      if (err.message?.includes('not found')) {
        setResult(null);
      } else {
        setError(err.message || 'Failed to check status. Please try again.');
      }
    } finally {
      setIsLoading(false);
      setHasSearched(true);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Submitted': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'Under Review': return 'bg-yellow-100 text-yellow-600 border-yellow-200';
      case 'Audition Scheduled': return 'bg-purple-100 text-purple-600 border-purple-200';
      case 'Accepted': return 'bg-green-100 text-green-600 border-green-200';
      case 'Waitlisted': return 'bg-orange-100 text-orange-600 border-orange-200';
      case 'Not Selected': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="bg-hudt-light min-h-screen py-16 px-4">
      <div className="max-w-3xl mx-auto space-y-8 animate-fade-in-up">
        {/* Search Box */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-12">
          <h2 className="text-4xl font-black text-purple-900 text-center mb-4">Check Status</h2>
          <p className="text-center text-gray-500 mb-8 font-medium">Enter your Reference Number or Phone Number</p>

          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Icons.Search />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="HUDT-2026-XXX or 080..."
                className="w-full pl-14 pr-4 py-4 rounded-2xl border-2 border-purple-100 outline-none focus:ring-2 focus:ring-purple-500 transition-all font-bold"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className={`px-10 py-4 bg-purple-900 text-white font-black rounded-2xl hover:bg-purple-800 transition-all shadow-lg flex items-center justify-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Searching...
                </>
              ) : (
                'Search'
              )}
            </button>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-8 border-red-500 p-8 rounded-3xl shadow-xl animate-fade-in">
            <div className="flex items-center gap-4 text-red-700">
              <span className="text-3xl font-bold">⚠️</span>
              <div>
                <h4 className="text-2xl font-black">Error</h4>
                <p className="font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Not Found */}
        {hasSearched && !result && !error && !isLoading && (
          <div className="bg-red-50 border-l-8 border-red-500 p-8 rounded-3xl shadow-xl animate-fade-in">
            <div className="flex items-center gap-4 text-red-700">
              <span className="text-3xl font-bold">⚠️</span>
              <div>
                <h4 className="text-2xl font-black">Application Not Found</h4>
                <p className="font-medium">Please check your details and try again.</p>
              </div>
            </div>
          </div>
        )}

        {/* Result */}
        {hasSearched && result && (
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-12 space-y-10 animate-fade-in">
            <div className="flex flex-col md:flex-row items-center justify-between border-b-2 border-gray-100 pb-8 gap-4">
              <div>
                <h3 className="text-3xl font-black text-purple-900">Application Details</h3>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mt-1">
                  Submitted on: {new Date(result.submittedAt).toLocaleDateString()}
                </p>
              </div>
              <div className={`px-8 py-3 rounded-2xl border-2 font-black text-lg ${getStatusColor(result.status)}`}>
                {result.status}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-purple-50 p-6 rounded-2xl">
                <p className="text-xs uppercase text-purple-400 font-black mb-2 tracking-widest">Full Name</p>
                <p className="text-xl font-black text-purple-900">{result.fullName}</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-2xl">
                <p className="text-xs uppercase text-gray-400 font-black mb-2 tracking-widest">Reference ID</p>
                <p className="text-xl font-black text-gray-700">{result.refNumber}</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-2xl">
                <p className="text-xs uppercase text-gray-400 font-black mb-2 tracking-widest">Department</p>
                <p className="text-xl font-bold text-gray-700">{result.department}</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-2xl">
                <p className="text-xs uppercase text-gray-400 font-black mb-2 tracking-widest">Level</p>
                <p className="text-xl font-bold text-gray-700">{result.level}</p>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl">
              <p className="text-xs uppercase text-gray-400 font-black mb-4 tracking-widest">Talents</p>
              <div className="flex flex-wrap gap-2">
                {result.talents.map(t => (
                  <span key={t} className="px-4 py-1.5 bg-purple-900 text-white rounded-full text-sm font-bold shadow-sm">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* WhatsApp CTA */}
            <div className="bg-green-50 border-2 border-green-200 rounded-3xl p-6 text-center shadow-sm">
              <p className="text-green-800 font-bold mb-4 uppercase tracking-widest text-xs">Stay Updated via WhatsApp</p>
              <a
                href="https://chat.whatsapp.com/JIyFdFsw3t5JT2C7vEBYoq"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-8 py-3 bg-[#25D366] text-white font-black rounded-xl hover:bg-[#128C7E] transition-all shadow-md text-base"
              >
                💬 JOIN HUDT NOW
              </a>
            </div>

            {/* Status Specific Message */}
            <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-8">
              {result.status === 'Accepted' && (
                <div className="text-center">
                  <h4 className="text-2xl font-black text-amber-800 mb-2">🎉 Congratulations!</h4>
                  <p className="text-amber-700 font-medium italic">Welcome to the HUDT family! Please join the WhatsApp group for onboarding details.</p>
                </div>
              )}
              {result.status === 'Audition Scheduled' && (
                <div className="text-center">
                  <h4 className="text-2xl font-black text-purple-900 mb-2">📅 Audition Scheduled</h4>
                  {result.auditionSlot && (
                    <div className="bg-white p-4 rounded-xl shadow-sm inline-block mx-auto mb-2 font-bold text-purple-700">
                      {result.auditionSlot}
                    </div>
                  )}
                  <p className="text-gray-600 font-medium italic">Venue: Main Theatre Hall, Arts Building</p>
                </div>
              )}
              {result.status === 'Under Review' && (
                <div className="text-center">
                  <h4 className="text-2xl font-black text-yellow-700 mb-2">🔍 Under Review</h4>
                  <p className="text-yellow-600 font-medium italic animate-pulse">Our team is carefully reviewing your profile. Hang tight!</p>
                </div>
              )}
              {result.status === 'Submitted' && (
                <div className="text-center">
                  <h4 className="text-2xl font-black text-blue-700 mb-2">📥 Received</h4>
                  <p className="text-blue-600 font-medium italic">We've received your application. Review begins shortly.</p>
                </div>
              )}
              {result.status === 'Waitlisted' && (
                <div className="text-center">
                  <h4 className="text-2xl font-black text-orange-700 mb-2">⏳ Waitlisted</h4>
                  <p className="text-orange-600 font-medium italic">You're on our waitlist. We'll contact you if a spot opens up!</p>
                </div>
              )}
              {result.status === 'Not Selected' && (
                <div className="text-center">
                  <h4 className="text-2xl font-black text-gray-700 mb-2">Keep Shining! ✨</h4>
                  <p className="text-gray-600 font-medium italic">Thank you for your interest! We encourage you to apply again in the future. Keep developing your amazing talents!</p>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setHasSearched(false);
                setResult(null);
                setSearchTerm('');
                setError('');
              }}
              className="w-full py-4 bg-gray-600 text-white font-black rounded-2xl hover:bg-gray-700 transition-all shadow-lg"
            >
              Search Another Application
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusChecker;
