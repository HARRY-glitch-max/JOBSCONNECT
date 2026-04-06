import React, { useState, useEffect, useContext } from 'react';
import JobCard from '../components/jobs/JobCard';
import { getAllJobs } from '../api/jobs';
import { Search, Sparkles, ArrowRight, Briefcase, Users, ShieldCheck } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';

export default function Home() {
  const { role } = useContext(AuthContext);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (role === "jobseeker" || role === "employer" || !role) {
      fetchJobs();
    } else {
      setLoading(false);
    }
  }, [role]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const data = await getAllJobs(searchTerm);
      setJobs(data);
    } catch (err) {
      console.error("Failed to fetch jobs", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfd] dark:bg-slate-950 transition-colors duration-500">
      
      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-indigo-400/10 blur-[100px] rounded-full"></div>
        </div>

        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 px-4 py-1.5 rounded-full text-blue-600 dark:text-blue-400 text-sm font-semibold mb-8">
            <Sparkles size={14} />
            <span>The future of hiring is here</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-slate-900 dark:text-white tracking-tight leading-[1.1]">
            Connecting talent with <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">opportunity.</span>
          </h1>
          
          <p className="text-lg md:text-xl mb-10 text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Streamlining the recruitment process for both candidates and companies. 
            Smart matching, instant connections, zero friction.
          </p>

          {/* Search Bar - Professional Refinement */}
          <div className="relative max-w-3xl mx-auto group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2rem] blur opacity-20 group-focus-within:opacity-40 transition duration-500"></div>
            <div className="relative flex flex-col md:flex-row gap-2 bg-white dark:bg-slate-900 p-2 rounded-[1.8rem] shadow-xl border border-slate-200 dark:border-slate-800">
              <div className="flex-1 flex items-center px-4 gap-3">
                <Search className="text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Job title, keywords, or company..." 
                  className="w-full py-3 bg-transparent border-none focus:ring-0 text-slate-900 dark:text-white placeholder:text-slate-400 text-md outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button 
                onClick={fetchJobs}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                Find Jobs
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* --- TRUST BAR --- */}
      <div className="max-w-6xl mx-auto px-6 pb-20">
        <p className="text-center text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">Trusted by industry leaders</p>
        <div className="flex flex-wrap justify-center items-center gap-10 md:gap-20 grayscale opacity-50 contrast-125">
            <span className="text-2xl font-bold text-slate-600">TECHCORP</span>
            <span className="text-2xl font-bold text-slate-600">GLOBALIA</span>
            <span className="text-2xl font-bold text-slate-600">SOFTWAVE</span>
            <span className="text-2xl font-bold text-slate-600">NEXUS</span>
        </div>
      </div>

      {/* --- JOBS GRID --- */}
      <section className="bg-slate-50/50 dark:bg-slate-900/30 py-20 px-6 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Latest Openings</h2>
                <p className="text-slate-500">Explore recently posted positions that match your profile.</p>
            </div>
            <button className="hidden md:flex items-center gap-2 text-blue-600 font-semibold hover:underline">
                View all jobs <ArrowRight size={18} />
            </button>
          </div>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-3">
                {[1,2,3].map(i => <div key={i} className="h-64 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-3xl"></div>)}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => (
                <JobCard key={job._id || job.id} job={job} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* --- STATS / FEATURES SECTION --- */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-12">
            <div className="space-y-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600">
                    <Users size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Active Community</h3>
                <p className="text-slate-600 dark:text-slate-400">Join thousands of professionals finding their next career move with us daily.</p>
            </div>
            <div className="space-y-4">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600">
                    <Briefcase size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Verified Employers</h3>
                <p className="text-slate-600 dark:text-slate-400">We vet every company on our platform to ensure your safety and career growth.</p>
            </div>
            <div className="space-y-4">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600">
                    <ShieldCheck size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Privacy First</h3>
                <p className="text-slate-600 dark:text-slate-400">Your data is encrypted and you control exactly who sees your professional profile.</p>
            </div>
        </div>
      </section>

      <footer className="py-16 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900 text-center">
        <div className="mb-8">
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">JobConnect</span>
        </div>
        <p className="text-slate-400 text-sm max-w-xs mx-auto">
          Simplifying the search for excellence. Built for the next generation of global talent.
        </p>
        <div className="mt-8 pt-8 border-t border-slate-50 dark:border-slate-900 text-slate-400 text-xs">
            © 2026 JobConnect Inc. All rights reserved.
        </div>
      </footer>
    </div>
  );
}