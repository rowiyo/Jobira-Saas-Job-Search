'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, FileText, Shield, AlertCircle, Mail } from 'lucide-react'

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <img 
                src="/jobira_logo_sm.png" 
                alt="Jobira" 
                className="h-10 w-auto"
              />
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost" className="text-gray-600 hover:text-blue-600">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gray-50 py-12 border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
            <p className="text-lg text-gray-600">Last updated: January 2024</p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Table of Contents */}
          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Table of Contents</h2>
            <ol className="space-y-2 text-blue-600 list-decimal list-inside">
              <li><a href="#acceptance" className="hover:text-blue-800 hover:underline">Acceptance of Terms</a></li>
              <li><a href="#description" className="hover:text-blue-800 hover:underline">Description of Service</a></li>
              <li><a href="#account" className="hover:text-blue-800 hover:underline">Account Registration</a></li>
              <li><a href="#use" className="hover:text-blue-800 hover:underline">Acceptable Use</a></li>
              <li><a href="#privacy" className="hover:text-blue-800 hover:underline">Privacy and Data</a></li>
              <li><a href="#payment" className="hover:text-blue-800 hover:underline">Payment Terms</a></li>
              <li><a href="#intellectual" className="hover:text-blue-800 hover:underline">Intellectual Property</a></li>
              <li><a href="#termination" className="hover:text-blue-800 hover:underline">Termination</a></li>
              <li><a href="#disclaimer" className="hover:text-blue-800 hover:underline">Disclaimers</a></li>
              <li><a href="#limitation" className="hover:text-blue-800 hover:underline">Limitation of Liability</a></li>
              <li><a href="#changes" className="hover:text-blue-800 hover:underline">Changes to Terms</a></li>
              <li><a href="#contact" className="hover:text-blue-800 hover:underline">Contact Information</a></li>
            </ol>
          </div>

          {/* Terms Content */}
          <div className="space-y-12">
            <section id="acceptance">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-600 mb-4 leading-relaxed">
                By accessing or using Jobira ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, then you may not access the Service.
              </p>
              <p className="text-gray-600 mb-4 leading-relaxed">
                These Terms apply to all visitors, users, and others who access or use the Service. By using Jobira, you represent that you are at least 18 years old and have the legal capacity to enter into these Terms.
              </p>
            </section>

            <section id="description">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Jobira is an AI-powered job search aggregation platform that helps users find relevant job opportunities across multiple job boards. Our services include:
              </p>
              <ul className="list-disc list-inside pl-4 mb-4 text-gray-600 space-y-2">
                <li>Resume parsing and analysis using AI technology</li>
                <li>Automated job searching across multiple platforms</li>
                <li>Job matching based on user profiles and preferences</li>
                <li>ATS (Applicant Tracking System) optimization tools</li>
                <li>Job application tracking and management</li>
              </ul>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                  <p className="text-sm text-yellow-800">
                    <strong className="font-semibold">Important:</strong> Jobira aggregates job listings from third-party sources. We do not guarantee the accuracy, completeness, or availability of any job listings.
                  </p>
                </div>
              </div>
            </section>

            <section id="account">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Account Registration</h2>
              <p className="text-gray-600 mb-4 leading-relaxed">
                To use certain features of the Service, you must register for an account. When you register, you agree to:
              </p>
              <ul className="list-disc list-inside pl-4 mb-4 text-gray-600 space-y-2">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and promptly update your account information</li>
                <li>Maintain the security of your password and account</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized use</li>
              </ul>
              <p className="text-gray-600 mb-4 leading-relaxed">
                We reserve the right to refuse service, terminate accounts, or remove content at our sole discretion.
              </p>
            </section>

            <section id="use">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Acceptable Use</h2>
              <p className="text-gray-600 mb-4 leading-relaxed">
                You agree not to use the Service to:
              </p>
              <ul className="list-disc list-inside pl-4 mb-4 text-gray-600 space-y-2">
                <li>Violate any laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Upload false, misleading, or fraudulent content</li>
                <li>Transmit viruses, malware, or harmful code</li>
                <li>Scrape or harvest data without permission</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Attempt to gain unauthorized access</li>
                <li>Use the Service for any illegal or unauthorized purpose</li>
                <li>Resell or redistribute the Service without authorization</li>
              </ul>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Violation of these rules may result in immediate termination of your account.
              </p>
            </section>

            <section id="privacy">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Privacy and Data</h2>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Your use of our Service is also governed by our Privacy Policy. By using Jobira, you consent to the collection and use of information as detailed in our Privacy Policy.
              </p>
              <p className="text-gray-600 mb-4 leading-relaxed">
                You retain all rights to your resume and personal information. By uploading your resume, you grant Jobira a limited license to process and analyze your data solely for the purpose of providing our services.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                  <p className="text-sm text-blue-800">
                    We implement industry-standard security measures to protect your data. However, no method of transmission over the Internet is 100% secure.
                  </p>
                </div>
              </div>
            </section>

            <section id="payment">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Payment Terms</h2>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">6.1 Subscription Plans</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Jobira offers both free and paid subscription plans. Paid plans are billed on a recurring basis (monthly or annually) and will automatically renew unless cancelled.
              </p>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">6.2 Billing</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                By subscribing to a paid plan, you authorize us to charge your payment method on a recurring basis. You are responsible for providing accurate billing information and keeping it up to date.
              </p>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">6.3 Refunds</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                We offer a 14-day money-back guarantee for new subscriptions. After this period, payments are non-refundable except as required by law.
              </p>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">6.4 Price Changes</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                We reserve the right to modify our pricing. We will provide at least 30 days notice before any price increases affecting your subscription.
              </p>
            </section>

            <section id="intellectual">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Intellectual Property</h2>
              <p className="text-gray-600 mb-4 leading-relaxed">
                The Service and its original content (excluding user-generated content), features, and functionality are owned by Jobira and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
              <p className="text-gray-600 mb-4 leading-relaxed">
                You may not:
              </p>
              <ul className="list-disc list-inside pl-4 mb-4 text-gray-600 space-y-2">
                <li>Copy, modify, or distribute our Service</li>
                <li>Use our trademarks without permission</li>
                <li>Reverse engineer or attempt to extract source code</li>
                <li>Create derivative works based on our Service</li>
              </ul>
            </section>

            <section id="termination">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Termination</h2>
              <p className="text-gray-600 mb-4 leading-relaxed">
                We may terminate or suspend your account immediately, without prior notice or liability, for any reason, including:
              </p>
              <ul className="list-disc list-inside pl-4 mb-4 text-gray-600 space-y-2">
                <li>Breach of these Terms</li>
                <li>Request by law enforcement or court order</li>
                <li>Extended periods of inactivity</li>
                <li>Fraudulent or illegal activity</li>
                <li>Non-payment of fees</li>
              </ul>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Upon termination, your right to use the Service will cease immediately. You may delete your account at any time through your account settings.
              </p>
            </section>

            <section id="disclaimer">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Disclaimers</h2>
              <p className="text-gray-600 mb-4 leading-relaxed uppercase font-semibold">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>
              <p className="text-gray-600 mb-4 leading-relaxed">
                We do not warrant that:
              </p>
              <ul className="list-disc list-inside pl-4 mb-4 text-gray-600 space-y-2">
                <li>The Service will be uninterrupted or error-free</li>
                <li>Job listings are accurate, complete, or current</li>
                <li>You will obtain employment through our Service</li>
                <li>The results of using our Service will meet your requirements</li>
              </ul>
            </section>

            <section id="limitation">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Limitation of Liability</h2>
              <p className="text-gray-600 mb-4 leading-relaxed uppercase font-semibold">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, JOBIRA SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, OR GOODWILL.
              </p>
              <p className="text-gray-600 mb-4 leading-relaxed">
                In no event shall our total liability exceed the amount paid by you to Jobira in the twelve (12) months preceding the claim.
              </p>
            </section>

            <section id="changes">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to Terms</h2>
              <p className="text-gray-600 mb-4 leading-relaxed">
                We reserve the right to modify these Terms at any time. We will notify users of any material changes via email or through the Service. Your continued use of the Service after changes constitutes acceptance of the modified Terms.
              </p>
              <p className="text-gray-600 mb-4 leading-relaxed">
                It is your responsibility to review these Terms periodically for changes.
              </p>
            </section>

            <section id="contact">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Information</h2>
              <p className="text-gray-500 mb-4 leading-relaxed">
                If you have any questions about these Terms, please contact us at:
              </p>
              <div className="bg-gray-100 rounded-lg p-6">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-gray-600 mr-3" />
                    <span className="text-gray-700">legal@jobira.com</span>
                  </div>
                  <div className="text-gray-700">
                    <p className="font-semibold">Jobira Inc.</p>
                    <p>5 Saint Margrets Drive,</p>
                    <p>Pelham, NH 03076</p>
                    <p>United States</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Additional Legal */}
            <section className="border-t border-gray-200 pt-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Governing Law</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of the State of California, United States, without regard to its conflict of law provisions.
              </p>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Severability</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary so that these Terms will otherwise remain in full force and effect.
              </p>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Entire Agreement</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                These Terms constitute the entire agreement between you and Jobira regarding the use of the Service, superseding any prior agreements.
              </p>
            </section>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-600">© 2024 Jobira. All rights reserved.</p>
            <div className="mt-4 space-x-6">
              <Link href="/privacy" className="text-blue-600 hover:text-blue-800">Privacy Policy</Link>
              <Link href="/terms" className="text-blue-600 hover:text-blue-800">Terms of Service</Link>
              <Link href="/contact" className="text-blue-600 hover:text-blue-800">Contact Us</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}