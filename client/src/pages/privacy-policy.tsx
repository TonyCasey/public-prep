import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-gray-600">Last updated: {new Date().toLocaleDateString('en-IE', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <Card className="shadow-lg">
          <CardContent className="p-8 space-y-8">
            
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 leading-relaxed">
                Public Prep ("we," "our," or "us") is committed to protecting your privacy and personal data. 
                This Privacy Policy explains how we collect, use, process, and protect your information when you use 
                our AI-powered interview preparation platform for Irish Public Service positions.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Personal Information</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Email address and password for account creation</li>
                    <li>Name and profile information (optional)</li>
                    <li>Payment information processed securely through Stripe</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Application Data</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>CV/Resume content uploaded for analysis</li>
                    <li>Job specification documents</li>
                    <li>Practice interview responses and recordings</li>
                    <li>Performance scores and progress tracking data</li>
                    <li>AI analysis results and feedback</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Technical Information</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>IP address and browser information</li>
                    <li>Usage patterns and session data</li>
                    <li>Device information and preferences</li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. CV Upload Guidelines and Data Protection</h2>
              <div className="bg-amber-50 border-l-4 border-amber-400 p-6 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-amber-800">Important: Remove Personal Data from Your CV</h3>
                    <div className="mt-2 text-sm text-amber-700">
                      <p className="mb-3">
                        <strong>For your privacy and security, please remove all personal identifying information from your CV before uploading.</strong> 
                        Our AI analysis only requires your professional experience, skills, and achievements to provide effective interview preparation.
                      </p>
                      <p className="mb-2 font-medium">Please remove the following before upload:</p>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Full name, address, phone number</li>
                        <li>Date of birth, PPS number, passport details</li>
                        <li>Photo or personal image</li>
                        <li>Personal email addresses (replace with generic placeholder if needed)</li>
                        <li>References' contact details</li>
                        <li>Any other sensitive personal identifiers</li>
                      </ul>
                      <p className="mt-3 font-medium">
                        The application works effectively with anonymized CVs. Focus on your professional experience, skills, education, and achievements - this is all our AI needs to provide valuable competency analysis and interview preparation.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. How We Use Your Information</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Provide personalized AI-powered interview coaching and analysis</li>
                <li>Generate competency-based practice questions tailored to your experience</li>
                <li>Track your progress and improvement across Public Service competencies</li>
                <li>Process payments and manage your subscription</li>
                <li>Send important service updates and interview preparation tips</li>
                <li>Improve our AI models and platform functionality</li>
                <li>Comply with legal obligations and prevent fraud</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. AI and Data Processing</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Our platform uses advanced AI technology (powered by Anthropic's Claude) to analyze your CV, 
                generate interview questions, and provide personalized feedback. Your data is processed with 
                enterprise-grade security measures.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-800 font-medium">Important:</p>
                <p className="text-blue-700">
                  Your CV content and interview responses are used solely to provide you with personalized coaching. 
                  We do not share your personal career information with third parties or use it for training 
                  general AI models.
                </p>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Sharing and Disclosure</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We do not sell, rent, or share your personal information with third parties except in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li><strong>Service Providers:</strong> Stripe for payment processing, Anthropic for AI analysis</li>
                <li><strong>Legal Requirements:</strong> When required by Irish or EU law enforcement</li>
                <li><strong>Business Transfers:</strong> In the event of a merger or acquisition (with user notification)</li>
                <li><strong>Consent:</strong> When you explicitly authorize sharing</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data Security</h2>
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  We implement robust security measures to protect your personal information:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>End-to-end encryption for all data transmission</li>
                  <li>Secure database storage with regular backups</li>
                  <li>Multi-factor authentication and secure password hashing</li>
                  <li>Regular security audits and penetration testing</li>
                  <li>GDPR-compliant data processing procedures</li>
                </ul>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Your Rights Under GDPR</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                As an Irish/EU-based service, we comply with the General Data Protection Regulation (GDPR). 
                You have the following rights:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li><strong>Right to Access:</strong> Request a copy of your personal data</li>
                <li><strong>Right to Rectification:</strong> Correct inaccurate or incomplete data</li>
                <li><strong>Right to Erasure:</strong> Request deletion of your personal data</li>
                <li><strong>Right to Portability:</strong> Export your data in a machine-readable format</li>
                <li><strong>Right to Object:</strong> Opt-out of certain data processing activities</li>
                <li><strong>Right to Restrict Processing:</strong> Limit how we process your data</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Data Retention</h2>
              <p className="text-gray-700 leading-relaxed">
                We retain your personal data only for as long as necessary to provide our services and comply 
                with legal obligations. Specifically:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 mt-4">
                <li>Account data: Until account deletion</li>
                <li>CV and interview responses: 3 years or until deletion requested</li>
                <li>Payment records: 7 years (Irish tax law requirement)</li>
                <li>Usage analytics: 2 years in anonymized form</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Cookies and Tracking</h2>
              <p className="text-gray-700 leading-relaxed">
                We use essential cookies to maintain your session and preferences. We do not use tracking 
                cookies or third-party analytics that identify individual users. You can manage cookie 
                preferences through your browser settings.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contact Information</h2>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700 mb-4">
                  For privacy-related questions, data requests, or to exercise your GDPR rights, contact us:
                </p>
                <div className="space-y-2 text-gray-700">
                  <p><strong>Email:</strong> privacy@publicprep.ie</p>
                  <p><strong>Data Protection Officer:</strong> dpo@publicprep.ie</p>
                  <p><strong>Address:</strong> Public Prep, Dublin, Ireland</p>
                </div>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Updates to This Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy to reflect changes in our practices or legal requirements. 
                We will notify users of significant changes via email and update the "Last updated" date. 
                Your continued use of our services constitutes acceptance of the updated policy.
              </p>
            </section>

          </CardContent>
        </Card>
        
        <div className="text-center mt-8">
          <p className="text-gray-600">
            Questions about this Privacy Policy? Contact us at{" "}
            <a href="mailto:privacy@publicprep.ie" className="text-blue-600 hover:underline">
              privacy@publicprep.ie
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}