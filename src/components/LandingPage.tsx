'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles, Target, Zap, Shield, Search, Upload, BarChart3, Star, Gauge, CheckCircle, Menu, X, Briefcase, Users, TrendingUp, Award } from 'lucide-react'

export function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)

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
    <div className="min-h-screen bg-white">
      {/* Clean geometric pattern background */}
      <div className="fixed inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Header */}
      <header className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-md py-4' : 'bg-white/95 backdrop-blur-sm py-6'
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
              <a href="#features" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">How it Works</a>
              <a href="#testimonials" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Success Stories</a>
              <Link href="/auth">
                <Button variant="ghost" className="text-gray-700 hover:text-blue-600 hover:bg-gray-50">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                  Start Free Trial
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


      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              Trusted by job seekers like you
            </div>
            
            
            {/* Heading */}
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Find Your Dream Job
              <span className="block text-blue-600">4X FASTER</span>
            </h1>
            
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Upload Resume → AI Searches All Job Boards → Get Matched Jobs → Optimize ATS Score → Get Hired Faster
            </p>

          
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/auth">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg shadow-sm">
                  Upload Resume & Start
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-6 text-lg">
                Watch Demo
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                14-day free trial
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Cancel anytime
              </div>
            </div>
          </div>
          

          {/* Dashboard preview */}
          <div className="relative mt-16 max-w-5xl mx-auto">
            <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 p-8">
              <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="bg-blue-50 rounded-xl p-6 text-center">
                  <p className="text-3xl font-bold text-blue-600">2,847</p>
                  <p className="text-gray-600 mt-2">Jobs Found</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-6 text-center">
                  <p className="text-3xl font-bold text-gray-900">10</p>
                  <p className="text-gray-600 mt-2">Job Boards</p>
                </div>
                <div className="bg-green-50 rounded-xl p-6 text-center">
                  <p className="text-3xl font-bold text-green-600">94%</p>
                  <p className="text-gray-600 mt-2">Match Score</p>
                </div>
              </div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Briefcase className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Senior Software Engineer</p>
                        <p className="text-sm text-gray-600">Google • San Francisco, CA</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-green-600 text-sm font-medium bg-green-50 px-3 py-1 rounded-full">94% Match</span>
                      <Button size="sm" variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                        View
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
      <section className="py-16 bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold text-gray-900">1</p>
              <p className="text-gray-600 mt-2">Active Users</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-gray-900">50+</p>
              <p className="text-gray-600 mt-2">Jobs Analyzed</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-gray-900">2 Weeks</p>
              <p className="text-gray-600 mt-2">Avg. Time to Hire</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-gray-900">94%</p>
              <p className="text-gray-600 mt-2">Success Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Job Seekers Love Jobira
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We've eliminated everything that makes job searching painful
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Upload className="h-6 w-6" />,
                title: "Smart Resume Parser",
                description: "AI extracts your skills and finds perfect matches instantly",
                color: "blue"
              },
               {
                icon: <Shield className="h-6 w-6" />,
                 title: "ATS Optimizer",
                description: "Optimize your resume to get past ATS systems",
                color: "green"
              },
              {
                icon: <Search className="h-6 w-6" />,
                title: "10+ Job Boards",
                description: "Search everywhere at once. LinkedIn, Indeed, Glassdoor & more",
                color: "blue"
              },
                {
                icon: <BarChart3 className="h-6 w-6" />,
                title: "Track Everything",
                description: "Manage applications, interviews, and offers in one place",
                color: "green"
              },
              {
                icon: <Zap className="h-6 w-6" />,
                title: "Lightning Fast",
                description: "Get thousands of matches in seconds, not hours",
                color: "blue"
              },
              {
                icon: <Target className="h-6 w-6" />,
                title: "94% Accuracy",
                description: "Our AI ensures every match is actually relevant",
                color: "green"
              },
              
            
            ].map((feature, index) => (
              <div key={index} className="bg-white p-8 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all">
                <div className={`${
                  feature.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                  feature.color === 'green' ? 'bg-green-100 text-green-600' :
                  'bg-gray-100 text-gray-600'
                } rounded-lg p-3 w-fit mb-6`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              3 Steps to Your Dream Job
            </h2>
            <p className="text-xl text-gray-600">
              It's really this simple
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-12">
            {[
              {
                step: "01",
                title: "Upload Resume",
                description: "Drop your resume and we'll extract everything important",
                icon: <Upload className="h-8 w-8" />
              },
              {
                step: "02", 
                title: "AI Searches",
                description: "We search 10+ job boards and remove all duplicates",
                icon: <Search className="h-8 w-8" />
              },
              {
                step: "03",
                title: "Get Matches",
                description: "Review perfectly matched jobs, ranked by relevance",
                icon: <Briefcase className="h-8 w-8" />
              }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="relative inline-block mb-6">
                  <div className="bg-blue-100 rounded-full w-20 h-20 flex items-center justify-center text-blue-600">
                    {item.icon}
                  </div>
                  <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Success Stories</h2>
            <p className="text-xl text-gray-600">From job seekers to dream job holders</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12">
              <div className="text-center space-y-6">
                <div className="flex justify-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-2xl text-gray-700 leading-relaxed">
                  "{testimonials[currentTestimonial].content}"
                </p>
                <div className="flex items-center justify-center gap-4">
                  <img src={testimonials[currentTestimonial].image} alt={testimonials[currentTestimonial].name} className="w-16 h-16 rounded-full object-cover" />
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">{testimonials[currentTestimonial].name}</p>
                    <p className="text-gray-600">{testimonials[currentTestimonial].role}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial dots */}
            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  className={`transition-all ${
                    index === currentTestimonial 
                      ? 'w-8 h-2 bg-blue-600 rounded-full' 
                      : 'w-2 h-2 bg-gray-300 rounded-full hover:bg-gray-400'
                  }`}
                  onClick={() => setCurrentTestimonial(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to 4x Your Job Search?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join 1 professional who has not found his dream job faster
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-6 text-lg">
                Start Your Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
          <p className="text-sm text-blue-100 mt-6">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-50 border-t border-gray-200 relative z-50">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="text-center">
      <p className="text-gray-600 mb-4">© 2024 Jobira. All rights reserved.</p>
      <div className="space-x-6 text-sm">
        <button 
          onClick={() => window.location.href = '/terms'}
          className="text-gray-600 hover:text-blue-600 transition-colors cursor-pointer"
        >
          Terms of Service
        </button>
        <span className="text-gray-400">|</span>
        <button 
          onClick={() => window.location.href = '/privacy'}
          className="text-gray-600 hover:text-blue-600 transition-colors cursor-pointer"
        >
          Privacy Policy
        </button>
        <span className="text-gray-400">|</span>
        <button 
          onClick={() => window.location.href = '/contact'}
          className="text-gray-600 hover:text-blue-600 transition-colors cursor-pointer"
        >
          Contact
        </button>
      </div>
    </div>
  </div>
</footer>
    </div>
  )
}