import React from 'react';
import { 
  Heart, 
  Shield, 
  BarChart3, 
  Bell, 
  Users, 
  Clock, 
  CheckCircle,
  ArrowRight,
  Star,
  Activity
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
const LandingPage: React.FC = () => {
  const { setShowAuthModal, setAuthMode } = useAuth();

  const handleGetStarted = () => {
    setAuthMode('register');
    setShowAuthModal(true);
  };

  const handleSignIn = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };
  const features = [
    {
      icon: Activity,
      title: "Real-time Monitoring",
      description: "Continuous tracking of vital signs with instant data synchronization between patients and healthcare providers."
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Comprehensive data visualization with trend analysis to identify patterns and potential health concerns early."
    },
    {
      icon: Bell,
      title: "Smart Alerts",
      description: "Intelligent notification system that alerts doctors immediately when abnormal readings are detected."
    },
    {
      icon: Shield,
      title: "HIPAA Compliant",
      description: "Enterprise-grade security ensuring all patient data is encrypted and fully compliant with healthcare regulations."
    },
    {
      icon: Users,
      title: "Care Team Collaboration",
      description: "Seamless communication tools connecting patients, doctors, and care teams for coordinated healthcare."
    },
    {
      icon: Clock,
      title: "24/7 Accessibility",
      description: "Round-the-clock access to health data and communication tools from any device, anywhere."
    }
  ];

  const testimonials = [
    {
      name: "Dr. Sarah Chen",
      role: "Cardiologist",
      content: "CareSync has revolutionized how I monitor my chronic patients. The early warning system has prevented several emergency situations.",
      rating: 5
    },
    {
      name: "Robert Martinez",
      role: "Diabetes Patient",
      content: "Logging my blood sugar levels is so simple now. My doctor can see trends immediately and adjust my treatment accordingly.",
      rating: 5
    },
    {
      name: "Dr. Michael Thompson",
      role: "Primary Care Physician",
      content: "The data visualization tools help me make better treatment decisions. My patients are more engaged in their care than ever before.",
      rating: 5
    }
  ];

  const stats = [
    { number: "10,000+", label: "Active Patients" },
    { number: "500+", label: "Healthcare Providers" },
    { number: "99.9%", label: "Uptime Reliability" },
    { number: "24/7", label: "Monitoring Support" }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Heart className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">CareSync</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors duration-200">Features</a>
              <a href="#testimonials" className="text-gray-600 hover:text-blue-600 transition-colors duration-200">Reviews</a>
              <a href="#contact" className="text-gray-600 hover:text-blue-600 transition-colors duration-200">Contact</a>
              <div className="flex space-x-3">
                <button 
                  onClick={handleSignIn}
                  className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors duration-200"
                >
                  Sign In
                </button>
                <button 
                  onClick={handleGetStarted}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-green-50 pt-16 pb-20 sm:pt-24 sm:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Remote Patient
                <span className="text-blue-600 block">Health Monitoring</span>
                Made Simple
              </h1>
              <p className="mt-6 text-xl text-gray-600 leading-relaxed">
                Empower patients to log vital signs while enabling doctors to monitor trends, 
                receive alerts, and provide better care through our comprehensive health monitoring platform.
              </p>
              
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={handleGetStarted}
                  className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 flex items-center justify-center group"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                </button>
                <button 
                  onClick={handleSignIn}
                  className="px-8 py-4 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors duration-200 flex items-center justify-center"
                >
                  Sign In
                </button>
              </div>

              {/* Stats */}
              <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl lg:text-3xl font-bold text-blue-600">{stat.number}</div>
                    <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Today's Readings</h3>
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-gray-700">Blood Pressure</span>
                    <span className="font-semibold text-blue-600">120/80</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-gray-700">Blood Sugar</span>
                    <span className="font-semibold text-green-600">95 mg/dL</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <span className="text-gray-700">Heart Rate</span>
                    <span className="font-semibold text-red-600">72 BPM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Comprehensive Health Monitoring
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform provides everything needed for effective remote patient monitoring, 
              from data collection to actionable insights.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index}
                  className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Healthcare Professionals
            </h2>
            <p className="text-xl text-gray-600">
              See what doctors and patients are saying about CareSync
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-8 hover:bg-gray-100 transition-colors duration-200">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-gray-600">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Transform Patient Care?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of healthcare providers and patients already using CareSync 
            to improve health outcomes through better monitoring and communication.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={handleGetStarted}
              className="px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors duration-200 font-semibold"
            >
              Get Started Free
            </button>
            <button 
              onClick={handleSignIn}
              className="px-8 py-4 border-2 border-white text-white rounded-lg hover:bg-white hover:text-blue-600 transition-colors duration-200 font-semibold"
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <Heart className="h-8 w-8 text-blue-400" />
                <span className="text-2xl font-bold">CareSync</span>
              </div>
              <p className="text-gray-400 mb-6">
                Revolutionizing healthcare through intelligent remote patient monitoring 
                and seamless doctor-patient communication.
              </p>
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-400">All systems operational</span>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 CareSync. All rights reserved. HIPAA Compliant Healthcare Solution.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;