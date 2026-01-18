import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, Sparkles, BookOpen, TrendingUp, Zap, Shield } from 'lucide-react';
import { Button } from '../components/ui';
import { signInWithGoogle } from '../lib/supabase';
import { useStore } from '../store/useStore';

export function Home() {
  const { user } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();

  // Clean up OAuth hash fragments from URL
  useEffect(() => {
    if (window.location.hash) {
      // Remove hash from URL after OAuth callback
      const hash = window.location.hash;
      if (hash.includes('access_token') || hash.includes('error')) {
        // Clean up the URL
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }
  }, []);

  // Only redirect if user is in store (App.tsx handles session validation)
  // Don't redirect if user is null/undefined
  if (user) {
    const from = (location.state as any)?.from?.pathname;
    return <Navigate to={from || "/dashboard"} replace />;
  }

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      // Navigation will happen automatically via auth state change in App.tsx
    } catch (error) {
      console.error('Sign in error:', error);
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: 'AI Essay Analysis',
      description: 'Get instant feedback from multiple AI agents on structure, admissions perspective, and authenticity.',
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: 'Supplemental Essays',
      description: 'Access 2025-26 prompts for top universities and manage all your essays in one place.',
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Application Tracking',
      description: 'Track deadlines, decision types, and application status across all your target schools.',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Real-time Analysis',
      description: 'Powered by Groq AI with ultra-fast inference for instant essay feedback.',
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Authenticity Scoring',
      description: 'Ensure your essays are genuine and reflect your unique voice and experiences.',
    },
    {
      icon: <GraduationCap className="w-6 h-6" />,
      title: 'College Dashboard',
      description: 'Comprehensive view of your applications with stats, deadlines, and progress tracking.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/vite.svg" alt="AdmitX Logo" className="w-16 h-auto" />
            <span className="text-2xl font-bold text-gray-900">AdmitX</span>
          </div>
          <Button
            size="sm"
            onClick={handleSignIn}
            isLoading={isLoading}
            className="flex items-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Left side - Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Your college application companion
              </h1>

              <p className="text-xl text-gray-600 mb-6">
                Get AI-powered essay feedback, track applications, and maximize your chances of admission.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  onClick={handleSignIn}
                  isLoading={isLoading}
                  className="flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Get Started with Google
                </Button>
              </div>
            </motion.div>

            {/* Right side - Visual */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="hidden md:block"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-200 to-accent-200 rounded-2xl blur-3xl opacity-20"></div>
                <div className="relative bg-white rounded-2xl p-8 shadow-xl border border-gray-200">
                  <div className="mb-6">
                    <h4 className="text-base font-semibold text-gray-500 uppercase mb-2">Essay Feedback</h4>
                    <p className="text-lg text-gray-900 font-semibold mb-4">Personal Statement</p>
                  </div>
                  <div className="space-y-4 mb-6">
                    <div>
                      <p className="text-base font-semibold text-gray-700 mb-2">📖 Story Agent</p>
                      <p className="text-base text-gray-600">Strong narrative arc with vivid personal details. Consider expanding the transformative moment in the second paragraph.</p>
                    </div>
                    <div>
                      <p className="text-base font-semibold text-gray-700 mb-2">✍️ Technical Agent</p>
                      <p className="text-base text-gray-600">Minor grammar fixes: "I was running" → "I ran" (line 5). Overall flow is excellent.</p>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-semibold text-gray-700">Authenticity Score</span>
                      <span className="text-3xl font-bold text-blue-500">87/100</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Powerful features for smarter applications
          </h2>
          <p className="text-xl text-gray-600">
            Everything you need to craft compelling essays and track your progress.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group bg-white rounded-xl p-8 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-primary-200"
            >
              <div className="w-12 h-12 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center mb-4 group-hover:bg-primary-200 transition-colors">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to start your journey?
            </h3>
            <p className="text-lg text-primary-100 mb-8">
              Join thousands of students getting into their dream schools.
            </p>
            <Button
              size="lg"
              onClick={handleSignIn}
              isLoading={isLoading}
              className="bg-blue-500 text-white hover:bg-blue-600 flex items-center justify-center gap-2 mx-auto"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Get Started Free
            </Button>
          </motion.div>
        </div>
      </div>

    </div>
  );
}

