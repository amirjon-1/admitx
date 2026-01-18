import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, Sparkles, BookOpen, TrendingUp, Zap, Shield } from 'lucide-react';
import { Button } from '../components/ui';
import { signInWithGoogle } from '../lib/supabase';
import { useStore } from '../store/useStore';

export function Home() {
  const { user } = useStore();
  const [isLoading, setIsLoading] = useState(false);

  // If user is already logged in, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
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
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="inline-flex items-center justify-center mb-8"
            >
              <img src="/vite.svg" alt="AdmitX Logo" className="w-32 h-auto" />
            </motion.div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6">
              Welcome to AdmitX
           
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 mb-4 max-w-3xl mx-auto">
              Your AI-powered college counseling platform
            </p>
            <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">
              Get comprehensive essay analysis, track your applications, and maximize your chances of admission to top universities.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Button
                size="lg"
                onClick={handleSignIn}
                isLoading={isLoading}
                className="px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-shadow"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
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
                Continue with Google
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything you need to succeed
          </h2>
        
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-100"
            >
              <div className="w-12 h-12 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-black py-12">
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <p className="text-2xl sm:text-3xl font-semibold text-white mb-6">
        Join thousands of students!
      </p>
    </motion.div>
  </div>
</div>

    </div>
  );
}

