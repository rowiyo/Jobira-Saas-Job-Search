'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles, Target, Zap, Shield, Search, Upload, BarChart3, Star, CheckCircle, Menu, X, Briefcase, Users, TrendingUp, Award } from 'lucide-react'

export function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % 3)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Software Engineer at Google",
      content: "Found my dream job in just 3 days! The AI matching is incredible - every job was relevant to my skills.",
      image: "/testimonial-1.jpg"
    },
    {
      name: "Marcus Johnson", 
      role: "Product Manager at Meta",
      content: "The duplicate detection saved me hours! No more seeing the same job on 5 different sites.",
      image: "/testimonial-2.jpg"
    },
    {
      name: "Emily Rodriguez",
      role: "Data Scientist at Amazon", 
      content: "Best job search tool I've used. The relevance scoring is spot-on and saves so much time!",
      image: "/testimonial-3.jpg"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-600/20 via-cyan-600/20 to-blue-600/20" />
      
      {/* Animated particles */}
      {mounted && (
        <div className="fixed inset-0 overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-white rounded-full opacity-20"
              style={{
                width: Math.random() * 4 + 'px',
                height: Math.random() * 4 + 'px',
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
                animation: `float ${Math.random() * 10 + 20}s linear infinite`,
                animationDelay: Math.random() * 20 + 's'
              }}
            />
          ))}
        </div>
      )}

      {/* Header */}
      <header className={`fixed w-full z-50 transition-all duration-500 ${
        isScrolled ? 'bg-white shadow-lg py-4' : 'bg-white/95 backdrop-blur-sm py-6'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <img 
                src="/jobira_logo_sm.png" 
                alt="Jobira" 
                className="h-10 w-auto"
              />
            </div>
            
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-700 hover:text-blue-600 transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-700 hover:text-blue-600 transition-colors">How it Works</a>
              <a href="#testimonials" className="text-gray-700 hover:text-blue-600 transition-colors">Success Stories</a>
              <Link href="/auth">
                <Button variant="ghost" className="text-gray-700 hover:text-blue-600 hover:bg-blue-50">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth">
                <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0 shadow-lg shadow-blue-500/25">
                  Start Free →
                </Button>
              </Link>
            </nav>

            <button 
              className="md:hidden text-gray-700"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center space-y-8">
            {/* Animated badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border border-blue-500/50 text-blue-300 px-6 py-3 rounded-full text-sm font-medium">
              <Sparkles className="h-4 w-4 animate-pulse" />
              Thousands of Job Seekers Already Upgraded Their Search
              <Sparkles className="h-4 w-4 animate-pulse" />
            </div>
            
            {/* Main heading with gradient */}
            <h1 className="text-6xl lg:text-8xl font-bold leading-tight">
              <span className="block">Find Your</span>
              <span className="block bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                Dream Job
              </span>
              <span className="block">10x Faster</span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              One resume upload. All job boards searched. 
              <span className="text-white font-semibold"> No duplicates. Just perfect matches.</span>
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
              <Link href="/auth">
                <Button size="lg" className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0 shadow-2xl shadow-blue-500/25 transform hover:scale-105 transition-all duration-200 text-lg px-8 py-6">
                  Upload Resume & Start
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-gray-300 text-gray-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-600 text-lg px-8 py-6 transition-all">
                Watch 2-Min Demo
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-8 pt-12 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                14-day free trial
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Cancel anytime
              </div>
            </div>
          </div>

          {/* Floating dashboard preview */}
          <div className="relative mt-20">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 blur-3xl opacity-20 animate-pulse"></div>
            <div className="relative bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-blue-500/20 p-8 shadow-2xl shadow-blue-500/10">
              <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="bg-blue-500/20 rounded-xl p-6 border border-blue-500/30">
                  <p className="text-4xl font-bold text-blue-300">2,847</p>
                  <p className="text-gray-300 mt-2">Jobs Found</p>
                </div>
                <div className="bg-cyan-500/20 rounded-xl p-6 border border-cyan-500/30">
                  <p className="text-4xl font-bold text-cyan-300">10</p>
                  <p className="text-gray-300 mt-2">Job Boards Searched</p>
                </div>
                <div className="bg-green-500/20 rounded-xl p-6 border border-green-500/30">
                  <p className="text-4xl font-bold text-green-300">94%</p>
                  <p className="text-gray-300 mt-2">Match Score</p>
                </div>
              </div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-slate-700/50 rounded-lg p-4 flex items-center justify-between group hover:bg-slate-700/70 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-lg" />
                      <div>
                        <p className="font-semibold text-white">Senior Software Engineer</p>
                        <p className="text-sm text-gray-300">Google • San Francisco, CA</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-green-300 text-sm font-semibold">94% Match</span>
                      <Button size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity bg-blue-500 hover:bg-blue-600">
                        View →
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20 bg-slate-800/30 backdrop-blur-sm border-y border-blue-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center space-y-2">
              <p className="text-5xl font-bold bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">500K+</p>
              <p className="text-gray-300">Active Users</p>
            </div>
            <div className="text-center space-y-2">
              <p className="text-5xl font-bold bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">10M+</p>
              <p className="text-gray-300">Jobs Analyzed</p>
            </div>
            <div className="text-center space-y-2">
              <p className="text-5xl font-bold bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">24hrs</p>
              <p className="text-gray-300">Avg. Time to Hire</p>
            </div>
            <div className="text-center space-y-2">
              <p className="text-5xl font-bold bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">94%</p>
              <p className="text-gray-300">Success Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="relative py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6">
              Why Job Seekers 
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent"> Love Jobira</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              We've eliminated everything that makes job searching painful
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                          {[
              {
                icon: <Upload className="h-8 w-8" />,
                title: "Smart Resume Parser",
                description: "AI extracts your skills and finds perfect matches instantly",
                gradient: "from-blue-500/20 to-blue-600/20"
              },
              {
                icon: <Search className="h-8 w-8" />,
                title: "10+ Job Boards",
                description: "Search everywhere at once. LinkedIn, Indeed, Glassdoor & more",
                gradient: "from-cyan-500/20 to-cyan-600/20"
              },
              {
                icon: <Zap className="h-8 w-8" />,
                title: "Lightning Fast",
                description: "Get thousands of matches in seconds, not hours",
                gradient: "from-yellow-500/20 to-yellow-600/20"
              },
              {
                icon: <Target className="h-8 w-8" />,
                title: "94% Accuracy",
                description: "Our AI ensures every match is actually relevant",
                gradient: "from-green-500/20 to-green-600/20"
              },
              {
                icon: <Shield className="h-8 w-8" />,
                title: "No Duplicates",
                description: "See each job once, even if it's on multiple sites",
                gradient: "from-blue-500/20 to-blue-600/20"
              },
              {
                icon: <BarChart3 className="h-8 w-8" />,
                title: "Track Everything",
                description: "Manage applications, interviews, and offers in one place",
                gradient: "from-red-500/20 to-red-600/20"
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="group relative bg-slate-800/30 backdrop-blur-sm rounded-2xl p-8 border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20"
              >
                <div className={`bg-gradient-to-br ${feature.gradient} rounded-xl p-4 w-fit mb-6`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="relative py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6">
              3 Steps to Your Dream Job
            </h2>
            <p className="text-xl text-gray-400">
              It's really this simple
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-12">
            {[
              {
                step: "01",
                title: "Upload Resume",
                description: "Drop your resume and we'll extract everything important",
                icon: <Upload className="h-12 w-12" />
              },
              {
                step: "02", 
                title: "AI Searches",
                description: "We search 10+ job boards and remove all duplicates",
                icon: <Search className="h-12 w-12" />
              },
              {
                step: "03",
                title: "Get Matches",
                description: "Review perfectly matched jobs, ranked by relevance",
                icon: <Briefcase className="h-12 w-12" />
              }
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="text-center space-y-6">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur-2xl opacity-50"></div>
                    <div className="relative bg-slate-800/50 rounded-full w-24 h-24 flex items-center justify-center border border-blue-500/30 shadow-lg shadow-blue-500/20">
                      {item.icon}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-6xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                      {item.step}
                    </p>
                    <h3 className="text-2xl font-semibold">{item.title}</h3>
                    <p className="text-gray-400">{item.description}</p>
                  </div>
                </div>
                {index < 2 && (
                  <div className="hidden lg:block absolute top-12 left-full w-full">
                    <div className="w-full h-[2px] bg-gradient-to-r from-blue-500 to-transparent"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="relative py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6">Success Stories</h2>
            <p className="text-xl text-gray-400">From job seekers to dream job holders</p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-sm rounded-2xl p-12 border border-blue-500/30">
              <div className="text-center space-y-6">
                <div className="flex justify-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-8 w-8 fill-yellow-300 text-yellow-300" />
                  ))}
                </div>
                <p className="text-2xl leading-relaxed text-gray-100">
                  "{testimonials[currentTestimonial].content}"
                </p>
                <div className="flex items-center justify-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full" />
                  <div className="text-left">
                    <p className="font-semibold text-lg">{testimonials[currentTestimonial].name}</p>
                    <p className="text-gray-300">{testimonials[currentTestimonial].role}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial dots */}
            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentTestimonial ? 'w-8 bg-white' : 'bg-white/30'
                  }`}
                  onClick={() => setCurrentTestimonial(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl blur-3xl opacity-30"></div>
            <div className="relative bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl p-12 text-center">
              <h2 className="text-5xl font-bold mb-6">
                Ready to 10x Your Job Search?
              </h2>
              <p className="text-xl mb-8 text-white/80">
                Join 500,000+ professionals who found their dream jobs faster
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth">
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6">
                    Start Your Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-white mt-6">
                No credit card required • 14-day free trial • Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-blue-500/20 py-12 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-300">© 2024 Jobira. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          100% { transform: translateY(-100vh); }
        }
        
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  )
}