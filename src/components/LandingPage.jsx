import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import ThemeToggle from './ThemeToggle'

const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const theme = useTheme()

  const features = [
    {
      icon: "🧠",
      title: "AI-Powered Customer Personas",
      description: "Practice with intelligent AI personas that adapt to your responses and challenge you with realistic objections",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: "🎯",
      title: "Real-Time Performance Analytics",
      description: "Get instant feedback on your pitch delivery, objection handling, and closing techniques",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: "📚",
      title: "Custom Sales Playbooks",
      description: "Upload your company's sales materials and let AI create personalized training scenarios",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: "🎤",
      title: "Voice-Enabled Training",
      description: "Practice natural conversations with AI that understands context and responds intelligently",
      gradient: "from-orange-500 to-red-500"
    },
    {
      icon: "👥",
      title: "Team Management Dashboard",
      description: "Monitor your team's progress, identify skill gaps, and track improvement over time",
      gradient: "from-indigo-500 to-purple-500"
    },
    {
      icon: "🏆",
      title: "Skill Certification System",
      description: "Earn badges and certifications as you master different aspects of the sales process",
      gradient: "from-yellow-500 to-orange-500"
    }
  ]

  const benefits = [
    "🚀 Reduce training time by 60%",
    "📈 Improve sales performance by 40%",
    "⏰ Practice anytime, anywhere",
    "🎯 Consistent training quality",
    "💡 Real-time feedback",
    "📊 Scalable team training",
    "🌍 Tailored for African markets",
    "💰 Cost-effective solution"
  ]

  const testimonials = [
    {
      name: "Amara Okafor",
      role: "Sales Director",
      company: "TechHub Lagos",
      content: "Our team's confidence skyrocketed after using Kuuza AI. The African market scenarios are incredibly realistic!",
      avatar: "👩🏾‍💼"
    },
    {
      name: "Kwame Asante",
      role: "VP of Sales",
      company: "GrowthCorp Ghana",
      content: "The AI personas understand our local business culture. It's like having unlimited practice with real customers.",
      avatar: "👨🏿‍💼"
    },
    {
      name: "Fatima Al-Rashid",
      role: "Sales Manager",
      company: "InnovateCorp Egypt",
      content: "The detailed feedback helped our reps identify and fix their weaknesses quickly. ROI was immediate!",
      avatar: "👩🏽‍💼"
    }
  ]

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme.bg.primary}`}>
      {/* Navigation */}
      <nav className={`fixed top-0 z-50 w-full transition-colors duration-300 ${theme.bg.nav}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className={`text-2xl font-bold ${theme.text.gradient}`}>
                  🚀 Kuuza AI
                </h1>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-baseline space-x-4">
                <a href="#features" className={`${theme.text.secondary} ${theme.hover.link} px-3 py-2 rounded-md text-sm font-medium transition-colors`}>
                  Features
                </a>
                <a href="#benefits" className={`${theme.text.secondary} ${theme.hover.link} px-3 py-2 rounded-md text-sm font-medium transition-colors`}>
                  Benefits
                </a>
                <a href="#testimonials" className={`${theme.text.secondary} ${theme.hover.link} px-3 py-2 rounded-md text-sm font-medium transition-colors`}>
                  Success Stories
                </a>
                <Link to="/login" className={`${theme.text.secondary} ${theme.hover.link} px-3 py-2 rounded-md text-sm font-medium transition-colors`}>
                  Sign In
                </Link>
              </div>
              <ThemeToggle className="mx-2" />
              <Link to="/login" className={`${theme.button.primary} font-semibold py-2 px-6 rounded-full transition-all duration-200 transform hover:scale-105 shadow-lg`}>
                Start Free Trial
              </Link>
            </div>

            <div className="md:hidden flex items-center space-x-2">
              <ThemeToggle />
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`${theme.text.secondary} ${theme.hover.link} focus:outline-none`}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden">
            <div className={`px-2 pt-2 pb-3 space-y-1 sm:px-3 ${theme.bg.nav} border-t ${theme.isDark ? 'border-white/20' : 'border-gray-200'}`}>
              <a href="#features" className={`${theme.text.secondary} ${theme.hover.link} block px-3 py-2 rounded-md text-base font-medium`}>
                Features
              </a>
              <a href="#benefits" className={`${theme.text.secondary} ${theme.hover.link} block px-3 py-2 rounded-md text-base font-medium`}>
                Benefits
              </a>
              <a href="#testimonials" className={`${theme.text.secondary} ${theme.hover.link} block px-3 py-2 rounded-md text-base font-medium`}>
                Success Stories
              </a>
              <Link to="/login" className={`${theme.text.secondary} ${theme.hover.link} block px-3 py-2 rounded-md text-base font-medium`}>
                Sign In
              </Link>
              <Link to="/login" className={`${theme.button.primary} font-semibold py-2 px-6 rounded-full block text-center mx-3 mt-2`}>
                Start Free Trial
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-20 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl animate-pulse ${theme.isDark ? 'bg-purple-500/20' : 'bg-blue-500/10'}`}></div>
          <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl animate-pulse delay-1000 ${theme.isDark ? 'bg-cyan-500/20' : 'bg-purple-500/10'}`}></div>
          <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl animate-pulse delay-500 ${theme.isDark ? 'bg-pink-500/10' : 'bg-cyan-500/5'}`}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <div className={`inline-flex items-center px-4 py-2 rounded-full mb-8 ${theme.isDark ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30' : 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20'}`}>
              <span className={`text-sm font-semibold ${theme.isDark ? 'text-cyan-400' : 'text-blue-600'}`}>🌟 #1 AI Sales Training Platform for Africa</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
              <span className={`${theme.isDark ? 'bg-gradient-to-r from-white via-cyan-200 to-purple-200' : 'bg-gradient-to-r from-gray-900 via-blue-700 to-purple-700'} bg-clip-text text-transparent`}>
                Master Sales with
              </span>
              <br />
              <span className={`${theme.isDark ? 'bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400' : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500'} bg-clip-text text-transparent`}>
                AI-Powered Training
              </span>
            </h1>

            <p className={`text-xl md:text-2xl ${theme.text.secondary} mb-12 max-w-4xl mx-auto leading-relaxed`}>
              🚀 Transform your sales team with intelligent AI personas that understand African markets.
              Practice real conversations, get instant feedback, and close more deals with confidence.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
              <Link
                to="/login"
                className={`group ${theme.button.primary} font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl ${theme.isDark ? 'hover:shadow-cyan-500/25' : 'hover:shadow-blue-500/25'}`}
              >
                🎯 Start Free Trial
                <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <button className={`group ${theme.button.secondary} font-semibold py-4 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105`}>
                🎬 Watch Demo
                <span className="ml-2 group-hover:scale-110 transition-transform inline-block">▶️</span>
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className={`text-3xl md:text-4xl font-bold ${theme.isDark ? 'bg-gradient-to-r from-cyan-400 to-purple-400' : 'bg-gradient-to-r from-blue-500 to-purple-500'} bg-clip-text text-transparent`}>10K+</div>
                <div className={`${theme.text.muted} text-sm`}>Training Sessions</div>
              </div>
              <div className="text-center">
                <div className={`text-3xl md:text-4xl font-bold ${theme.isDark ? 'bg-gradient-to-r from-green-400 to-emerald-400' : 'bg-gradient-to-r from-green-500 to-emerald-500'} bg-clip-text text-transparent`}>95%</div>
                <div className={`${theme.text.muted} text-sm`}>Success Rate</div>
              </div>
              <div className="text-center">
                <div className={`text-3xl md:text-4xl font-bold ${theme.isDark ? 'bg-gradient-to-r from-orange-400 to-red-400' : 'bg-gradient-to-r from-orange-500 to-red-500'} bg-clip-text text-transparent`}>40%</div>
                <div className={`${theme.text.muted} text-sm`}>Performance Boost</div>
              </div>
              <div className="text-center">
                <div className={`text-3xl md:text-4xl font-bold ${theme.isDark ? 'bg-gradient-to-r from-pink-400 to-purple-400' : 'bg-gradient-to-r from-pink-500 to-purple-500'} bg-clip-text text-transparent`}>50+</div>
                <div className={`${theme.text.muted} text-sm`}>African Companies</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={`py-20 relative transition-colors duration-300 ${theme.bg.secondary}`}>
        <div className="absolute inset-0 opacity-50">
          <div className={`w-full h-full ${theme.isDark ? 'bg-gradient-to-br from-purple-500/5 to-cyan-500/5' : 'bg-gradient-to-br from-blue-500/5 to-purple-500/5'}`}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <div className={`inline-flex items-center px-4 py-2 rounded-full mb-6 ${theme.isDark ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30' : 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20'}`}>
              <span className={`text-sm font-semibold ${theme.isDark ? 'text-purple-400' : 'text-blue-600'}`}>✨ Powerful Features</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className={`${theme.isDark ? 'bg-gradient-to-r from-white to-gray-300' : 'bg-gradient-to-r from-gray-900 to-gray-700'} bg-clip-text text-transparent`}>
                Everything You Need for
              </span>
              <br />
              <span className={`${theme.isDark ? 'bg-gradient-to-r from-cyan-400 to-purple-400' : 'bg-gradient-to-r from-blue-500 to-purple-500'} bg-clip-text text-transparent`}>
                Sales Excellence
              </span>
            </h2>
            <p className={`text-xl ${theme.text.secondary} max-w-3xl mx-auto`}>
              Our comprehensive platform combines cutting-edge AI with proven sales methodologies,
              specifically designed for African businesses and markets.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group relative">
                <div className={`${theme.bg.card} ${theme.hover.card} rounded-2xl p-8 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl`}>
                  <div className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  <h3 className={`text-xl font-bold ${theme.text.primary} mb-4 ${theme.hover.link} transition-colors`}>
                    {feature.title}
                  </h3>
                  <p className={`${theme.text.secondary} leading-relaxed`}>
                    {feature.description}
                  </p>

                  {/* Hover effect overlay */}
                  <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${theme.isDark ? 'bg-gradient-to-r from-cyan-500/5 to-purple-500/5' : 'bg-gradient-to-r from-blue-500/5 to-purple-500/5'}`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section >

      {/* Benefits Section */}
      <section id="benefits" className={`py-20 relative transition-colors duration-300 ${theme.isDark ? 'bg-gradient-to-br from-purple-900 via-slate-900 to-indigo-900' : 'bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50'}`}>
        <div className="absolute inset-0 overflow-hidden">
          <div className={`absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl ${theme.isDark ? 'bg-cyan-500/10' : 'bg-blue-500/5'}`}></div>
          <div className={`absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full blur-3xl ${theme.isDark ? 'bg-purple-500/10' : 'bg-purple-500/5'}`}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className={`inline-flex items-center px-4 py-2 rounded-full mb-6 ${theme.isDark ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30' : 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20'}`}>
                <span className={`text-sm font-semibold ${theme.isDark ? 'text-green-400' : 'text-green-600'}`}>🎯 Proven Results</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-8">
                <span className={`${theme.isDark ? 'bg-gradient-to-r from-white to-gray-300' : 'bg-gradient-to-r from-gray-900 to-gray-700'} bg-clip-text text-transparent`}>
                  Why Leading African
                </span>
                <br />
                <span className={`${theme.isDark ? 'bg-gradient-to-r from-green-400 to-emerald-400' : 'bg-gradient-to-r from-green-500 to-emerald-500'} bg-clip-text text-transparent`}>
                  Companies Choose Us
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {benefits.map((benefit, index) => (
                  <div key={index} className={`flex items-center space-x-3 p-3 ${theme.bg.card} ${theme.hover.card} rounded-lg transition-all duration-200`}>
                    <span className={`text-lg ${theme.text.primary}`}>{benefit}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/login"
                  className={`group font-bold py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg ${theme.isDark ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white' : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'}`}
                >
                  🚀 Start Your Free Trial
                  <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </Link>
                <button className={`group ${theme.button.secondary} font-semibold py-4 px-8 rounded-full transition-all duration-300`}>
                  📞 Book a Demo
                </button>
              </div>
            </div>

            <div className="relative">
              <div className={`${theme.bg.card} rounded-3xl p-8 shadow-2xl`}>
                <div className="text-center space-y-8">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto text-3xl ${theme.isDark ? 'bg-gradient-to-r from-cyan-500 to-purple-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'}`}>
                    🎤
                  </div>
                  <h3 className="text-2xl font-bold text-white">
                    Practice Makes Perfect
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    Our AI personas provide unlimited practice opportunities with realistic
                    customer interactions tailored to African business culture and markets.
                  </p>
                  <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/20">
                    <div className="text-center">
                      <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">10K+</div>
                      <div className="text-sm text-gray-400">Sessions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">95%</div>
                      <div className="text-sm text-gray-400">Success Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">40%</div>
                      <div className="text-sm text-gray-400">Performance Boost</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section >

      {/* Testimonials Section */}
      <section id="testimonials" className={`py-20 relative transition-colors duration-300 ${theme.isDark ? 'bg-gradient-to-br from-slate-900 to-purple-900' : 'bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50'}`}>
        <div className="absolute inset-0 opacity-30">
          <div className={`w-full h-full ${theme.isDark ? 'bg-gradient-to-br from-yellow-500/5 to-orange-500/5' : 'bg-gradient-to-br from-yellow-500/10 to-orange-500/10'}`}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <div className={`inline-flex items-center px-4 py-2 rounded-full mb-6 ${theme.isDark ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30' : 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20'}`}>
              <span className={`text-sm font-semibold ${theme.isDark ? 'text-yellow-400' : 'text-orange-600'}`}>⭐ Success Stories</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className={`${theme.isDark ? 'bg-gradient-to-r from-white to-gray-300' : 'bg-gradient-to-r from-gray-900 to-gray-700'} bg-clip-text text-transparent`}>
                Trusted by Sales Teams
              </span>
              <br />
              <span className={`${theme.isDark ? 'bg-gradient-to-r from-yellow-400 to-orange-400' : 'bg-gradient-to-r from-yellow-500 to-orange-500'} bg-clip-text text-transparent`}>
                Across Africa
              </span>
            </h2>
            <p className={`text-xl ${theme.text.secondary} max-w-2xl mx-auto`}>
              See what our customers are saying about their incredible results and transformations
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="group relative">
                <div className={`${theme.bg.card} ${theme.hover.card} rounded-2xl p-8 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl`}>
                  <div className="flex mb-6">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={`text-xl ${theme.isDark ? 'text-yellow-400' : 'text-yellow-500'}`}>⭐</span>
                    ))}
                  </div>
                  <p className={`${theme.text.secondary} mb-6 italic text-lg leading-relaxed`}>
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center space-x-4">
                    <div className="text-4xl">{testimonial.avatar}</div>
                    <div>
                      <div className={`font-bold ${theme.text.primary} text-lg`}>{testimonial.name}</div>
                      <div className={`${theme.text.muted}`}>{testimonial.role}</div>
                      <div className={`${theme.text.accent} text-sm`}>{testimonial.company}</div>
                    </div>
                  </div>

                  {/* Hover effect */}
                  <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${theme.isDark ? 'bg-gradient-to-r from-yellow-500/5 to-orange-500/5' : 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10'}`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section >

      {/* CTA Section */}
      < section className="py-20 bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 relative overflow-hidden" >
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Sales Team?
          </h2>
          <p className="text-xl text-white/90 mb-12 leading-relaxed">
            Join thousands of sales professionals across Africa who are already improving their skills
            and closing more deals with Kuuza AI. Start your journey today!
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              to="/login"
              className="group bg-white text-purple-600 hover:bg-gray-100 font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl"
            >
              🚀 Start Free Trial
              <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            <button className="group bg-white/10 backdrop-blur-md border-2 border-white/30 text-white font-semibold py-4 px-8 rounded-full text-lg hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
              📞 Contact Sales
            </button>
          </div>
        </div>
      </section >

      {/* Footer */}
      <footer className={`py-16 relative transition-colors duration-300 ${theme.bg.footer} ${theme.text.primary}`}>
        <div className="absolute inset-0 opacity-50">
          <div className={`w-full h-full ${theme.isDark ? 'bg-gradient-to-br from-white/5 to-gray-500/5' : 'bg-gradient-to-br from-gray-500/5 to-black/5'}`}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center mb-4">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  🚀 Kuuza AI
                </h3>
              </div>
              <p className="text-gray-400 leading-relaxed mb-6">
                Empowering African businesses with cutting-edge AI-powered sales training solutions.
                Transform your team, boost performance, close more deals.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform cursor-pointer">
                  📧
                </div>
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform cursor-pointer">
                  📱
                </div>
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform cursor-pointer">
                  💬
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-6 text-lg">🎯 Product</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#features" className="hover:text-cyan-400 transition-colors">Features</a></li>
                <li><a href="#benefits" className="hover:text-cyan-400 transition-colors">Benefits</a></li>
                <li><a href="#testimonials" className="hover:text-cyan-400 transition-colors">Success Stories</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Demo</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-6 text-lg">🏢 Company</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-cyan-400 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Support</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Blog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-6 text-lg">⚖️ Legal</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">GDPR</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 mb-4 md:mb-0">
                &copy; 2025 Kuuza AI. All rights reserved. Made with ❤️ for African businesses.
              </p>
              <div className="flex items-center space-x-6 text-gray-400">
                <span className="text-sm">🌍 Proudly serving Africa</span>
              </div>
            </div>
          </div>
        </div>
      </footer >
    </div >
  )
}

export default LandingPage
