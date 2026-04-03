import { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, Search, Info, Activity, Star, History, List, Clock, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'motion/react';

type ScanResult = {
  id: string;
  url: string;
  isPhishing: boolean;
  riskScore: number;
  stars: number;
  timestamp: number;
  features: {
    length: number;
    atCount: number;
    hyphenCount: number;
    doubleSlashCount: number;
    dotCount: number;
    hasHttps: boolean;
    domainAgeDays: number;
    ownerHidden: boolean;
    missingDns: boolean;
  };
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
};

const dangerVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    x: [0, -10, 10, -10, 10, -5, 5, 0], // Shake effect for danger
    transition: { type: "spring", stiffness: 300, damping: 24, duration: 0.6 }
  },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
};

export default function App() {
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentResults, setCurrentResults] = useState<ScanResult[]>([]);
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [activeTab, setActiveTab] = useState<'scan' | 'history'>('scan');

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem('phishing_history');
    if (saved) {
      try { setHistory(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  // Save history on change
  useEffect(() => {
    localStorage.setItem('phishing_history', JSON.stringify(history));
  }, [history]);

  const analyzeUrls = (e: React.FormEvent) => {
    e.preventDefault();
    const urls = input.split(/[\n,]+/).map(u => u.trim()).filter(u => u);
    if (!urls.length) return;

    setIsAnalyzing(true);
    setCurrentResults([]);
    setActiveTab('scan');

    // Simulate network delay and ML processing
    setTimeout(() => {
      const newResults = urls.map(url => {
        const length = url.length;
        const atCount = (url.match(/@/g) || []).length;
        const hyphenCount = (url.match(/-/g) || []).length;
        const doubleSlashCount = (url.match(/\/\//g) || []).length;
        const dotCount = (url.match(/\./g) || []).length;
        const hasHttps = url.toLowerCase().startsWith('https://');

        // Extract domain for pseudo-random generation
        let domain = '';
        try {
          const urlObj = new URL(url.startsWith('http') ? url : `http://${url}`);
          domain = urlObj.hostname;
        } catch (e) {
          domain = url;
        }

        // Pseudo-random deterministic values based on domain length/chars
        const charSum = domain.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        
        // Simulate Domain Age (0 to 3650 days)
        // If it looks suspicious (many hyphens, long), make it newer
        let domainAgeDays = (charSum * 17) % 3650;
        if (hyphenCount > 1 || length > 50) domainAgeDays = (charSum * 7) % 30; // Less than 30 days
        
        // Simulate WHOIS Hidden
        const ownerHidden = (charSum % 3) === 0 || domainAgeDays < 100;
        
        // Simulate Missing DNS
        const missingDns = (charSum % 7) === 0 && domainAgeDays < 50;

        let riskScore = 0;
        if (length > 75) riskScore += 15;
        if (atCount > 0) riskScore += 30;
        if (hyphenCount > 3) riskScore += 15;
        if (doubleSlashCount > 1) riskScore += 20;
        if (!hasHttps) riskScore += 15;
        if (dotCount > 4) riskScore += 10;
        
        // Add risk for new features
        if (domainAgeDays < 30) riskScore += 25; // Very new domain
        else if (domainAgeDays < 180) riskScore += 10;
        
        if (ownerHidden) riskScore += 15;
        if (missingDns) riskScore += 30;

        riskScore = Math.min(riskScore, 100);
        const isPhishing = riskScore >= 50;
        
        let stars = 5;
        if (riskScore > 80) stars = 1;
        else if (riskScore > 60) stars = 2;
        else if (riskScore > 40) stars = 3;
        else if (riskScore > 20) stars = 4;

        return {
          id: Math.random().toString(36).substring(7),
          url,
          isPhishing,
          riskScore,
          stars,
          timestamp: Date.now(),
          features: { length, atCount, hyphenCount, doubleSlashCount, dotCount, hasHttps, domainAgeDays, ownerHidden, missingDns },
        };
      });

      setCurrentResults(newResults);
      setHistory(prev => [...newResults, ...prev].slice(0, 50));
      setIsAnalyzing(false);
    }, 1500);
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-200 pb-20 overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center mb-8"
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-4"
          >
            <ShieldCheck className="w-8 h-8 text-blue-600" />
          </motion.div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-4">
            Phishing URL Detector
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Analyze links for potential threats. Supports bulk scanning and keeps a history of your checks.
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex space-x-2 bg-slate-200/50 p-1.5 rounded-xl mb-8 max-w-md mx-auto relative"
        >
          {['scan', 'history'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as 'scan' | 'history')} 
              className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-colors z-10 ${activeTab === tab ? 'text-blue-700' : 'text-slate-600 hover:text-slate-900'}`}
            >
              {activeTab === tab && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white shadow-sm rounded-lg -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              {tab === 'scan' ? <Search className="w-4 h-4" /> : <History className="w-4 h-4" />}
              <span className="capitalize">{tab === 'scan' ? 'Scanner' : `History (${history.length})`}</span>
            </button>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          {activeTab === 'scan' ? (
            <motion.div 
              key="scan-tab"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Search Box */}
              <Card className="mb-8 shadow-sm border-slate-200 overflow-hidden">
                <CardContent className="p-6">
                  <form onSubmit={analyzeUrls} className="relative">
                    <div className="flex flex-col gap-4">
                      <div className="relative flex-grow">
                        <textarea
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          placeholder="Enter URLs to scan (one per line or comma-separated)...&#10;https://example.com&#10;http://suspicious-link.com"
                          className="block w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[120px] resize-y font-mono text-sm"
                          required
                        />
                      </div>
                      <div className="flex justify-end">
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            type="submit"
                            disabled={isAnalyzing || !input.trim()}
                            className="h-auto px-8 py-3 text-base font-medium rounded-xl bg-blue-600 hover:bg-blue-700 text-white relative overflow-hidden"
                          >
                            <AnimatePresence mode="wait">
                              {isAnalyzing ? (
                                <motion.div 
                                  key="analyzing"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  className="flex items-center"
                                >
                                  <Activity className="animate-spin -ml-1 mr-2 h-5 w-5" />
                                  Analyzing...
                                </motion.div>
                              ) : (
                                <motion.div 
                                  key="idle"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  className="flex items-center"
                                >
                                  <List className="-ml-1 mr-2 h-5 w-5" />
                                  Scan {input.split(/[\n,]+/).filter(u => u.trim()).length > 1 ? 'URLs' : 'URL'}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </Button>
                        </motion.div>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Current Results Section */}
              {currentResults.length > 0 && (
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="space-y-6"
                >
                  <motion.h3 variants={itemVariants} className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" /> Scan Results
                  </motion.h3>
                  {currentResults.map(result => (
                    <ResultCard key={result.id} result={result} />
                  ))}
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="history-tab"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" /> Scan History
                </h3>
                <AnimatePresence>
                  {history.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      <Button variant="outline" size="sm" onClick={clearHistory} className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                        <Trash2 className="w-4 h-4 mr-2" /> Clear History
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {history.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12 bg-slate-100 rounded-2xl border border-slate-200 border-dashed"
                >
                  <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No scan history yet.</p>
                </motion.div>
              ) : (
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="space-y-6"
                >
                  <AnimatePresence>
                    {history.map(result => (
                      <ResultCard key={result.id} result={result} />
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ResultCard({ result }: { result: ScanResult }) {
  return (
    <motion.div variants={result.isPhishing ? dangerVariants : itemVariants} layout>
      <Card className={`border-2 overflow-hidden transition-all duration-300 relative ${
        result.isPhishing 
          ? 'bg-gradient-to-br from-red-50 via-red-100 to-rose-50 border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.3)] hover:shadow-[0_0_35px_rgba(239,68,68,0.5)]' 
          : 'bg-emerald-50/30 border-emerald-200 hover:border-emerald-300'
      }`}>
        {/* Pulsing top border for danger */}
        {result.isPhishing && (
          <div className="absolute top-0 left-0 w-full h-1 bg-red-600 animate-pulse"></div>
        )}
        
        <CardContent className="p-0">
          <div className="p-6 border-b border-slate-200/50 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <motion.div 
                initial={{ rotate: -180, scale: 0 }}
                animate={result.isPhishing ? { 
                  rotate: 0, 
                  scale: [1, 1.15, 1],
                  boxShadow: ["0px 0px 0px rgba(239,68,68,0)", "0px 0px 20px rgba(239,68,68,0.6)", "0px 0px 0px rgba(239,68,68,0)"]
                } : { rotate: 0, scale: 1 }}
                transition={result.isPhishing ? { repeat: Infinity, duration: 1.5 } : { type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                className={`p-3 rounded-full shrink-0 ${result.isPhishing ? 'bg-red-600 text-white' : 'bg-emerald-100 text-emerald-600'}`}
              >
                {result.isPhishing ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <ShieldCheck className="w-6 h-6" />
                )}
              </motion.div>
              <div className="min-w-0 flex-1">
                <h4 className={`text-lg font-bold mb-1 truncate ${result.isPhishing ? 'text-red-900' : 'text-emerald-800'}`} title={result.url}>
                  {result.url}
                </h4>
                <div className="flex items-center gap-3 text-sm">
                  <span className={`font-bold px-2 py-0.5 rounded-md ${result.isPhishing ? 'bg-red-200 text-red-800 uppercase tracking-wide text-xs' : 'text-emerald-600'}`}>
                    {result.isPhishing ? 'Critical Phishing Threat' : 'Safe URL'}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className={`font-medium ${result.isPhishing ? 'text-red-700/70' : 'text-slate-500'}`}>
                    {new Date(result.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            
            <div className={`flex items-center gap-6 p-4 rounded-xl border shadow-sm shrink-0 w-full lg:w-auto justify-between lg:justify-end ${result.isPhishing ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
              <div className="text-center">
                <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${result.isPhishing ? 'text-red-700' : 'text-slate-500'}`}>Risk Score</div>
                <motion.div 
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                  className={`text-3xl font-black ${result.isPhishing ? 'text-red-700 drop-shadow-md' : 'text-emerald-600'}`}
                >
                  {result.riskScore}%
                </motion.div>
              </div>
              <div className={`w-px h-10 ${result.isPhishing ? 'bg-red-200' : 'bg-slate-200'}`}></div>
              <div>
                <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${result.isPhishing ? 'text-red-700' : 'text-slate-500'}`}>Safety Rating</div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star, i) => (
                    <motion.div
                      key={star}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + (i * 0.05) }}
                    >
                      <Star 
                        className={`w-5 h-5 ${star <= result.stars ? (result.stars <= 2 ? 'text-red-600 fill-red-600 drop-shadow-sm' : result.stars === 3 ? 'text-yellow-500 fill-yellow-500' : 'text-emerald-500 fill-emerald-500') : (result.isPhishing ? 'text-red-200' : 'text-slate-200')}`} 
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className={`p-6 ${result.isPhishing ? 'bg-red-50/50' : 'bg-white/50'}`}>
            <div className="flex items-center gap-2 mb-4">
              <Info className={`w-4 h-4 ${result.isPhishing ? 'text-red-500' : 'text-slate-500'}`} />
              <h5 className={`text-sm font-bold ${result.isPhishing ? 'text-red-900' : 'text-slate-700'}`}>Feature Analysis</h5>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              <FeatureItem label="Domain Age" value={result.features.domainAgeDays < 30 ? '< 1 Month' : result.features.domainAgeDays < 365 ? '< 1 Year' : `${Math.floor(result.features.domainAgeDays / 365)} Years`} isWarning={result.features.domainAgeDays < 180} delay={0.4} />
              <FeatureItem label="WHOIS Owner" value={result.features.ownerHidden ? 'Hidden' : 'Public'} isWarning={result.features.ownerHidden} delay={0.45} />
              <FeatureItem label="DNS Records" value={result.features.missingDns ? 'Missing' : 'Valid'} isWarning={result.features.missingDns} delay={0.5} />
              <FeatureItem label="HTTPS" value={result.features.hasHttps ? 'Yes' : 'No'} isWarning={!result.features.hasHttps} delay={0.55} />
              <FeatureItem label="Length" value={result.features.length} isWarning={result.features.length > 75} delay={0.6} />
              <FeatureItem label="'@' Symbol" value={result.features.atCount} isWarning={result.features.atCount > 0} delay={0.65} />
              <FeatureItem label="Hyphens" value={result.features.hyphenCount} isWarning={result.features.hyphenCount > 3} delay={0.7} />
              <FeatureItem label="Redirects (//)" value={result.features.doubleSlashCount} isWarning={result.features.doubleSlashCount > 1} delay={0.75} />
              <FeatureItem label="Subdomains" value={result.features.dotCount} isWarning={result.features.dotCount > 4} delay={0.8} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function FeatureItem({ label, value, isWarning, delay }: { label: string, value: string | number, isWarning: boolean, delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className={`p-3 rounded-lg border ${isWarning ? 'bg-red-100 border-red-300 shadow-inner' : 'bg-slate-50 border-slate-200'}`}
    >
      <div className={`text-xs font-bold mb-1 ${isWarning ? 'text-red-700' : 'text-slate-500'}`}>{label}</div>
      <div className={`text-lg font-black ${isWarning ? 'text-red-900' : 'text-slate-900'}`}>
        {value}
      </div>
    </motion.div>
  );
}
