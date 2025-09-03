import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function TermsConditions() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms & Conditions</h1>
          <p className="text-gray-600">Last updated: {new Date().toLocaleDateString('en-IE', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <Card className="shadow-lg">
          <CardContent className="p-8 space-y-8">
            
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Agreement to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing and using Public Prep ("the Service," "our platform," or "we"), you accept 
                and agree to be bound by these Terms and Conditions. If you do not agree to these terms, 
                please do not use our service. These terms apply to all users of the platform, including 
                candidates preparing for Irish Public Service interviews.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Service Description</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Public Prep is an AI-powered interview preparation platform specifically designed for 
                Irish Public Service positions including Higher Executive Officer (HEO) and other civil service roles.
              </p>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-gray-800">Our services include:</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>CV analysis and competency assessment using AI technology</li>
                  <li>Generation of practice interview questions based on official competency frameworks</li>
                  <li>Real-time interview coaching and STAR method evaluation</li>
                  <li>Progress tracking across the six core HEO competencies</li>
                  <li>Performance analytics and improvement recommendations</li>
                  <li>Export functionality for interview preparation records</li>
                </ul>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts and Registration</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Account Creation</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>You must provide accurate and complete information during registration</li>
                    <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                    <li>You must be at least 18 years old to create an account</li>
                    <li>One account per user - multiple accounts are not permitted</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Account Responsibility</h3>
                  <p className="text-gray-700">
                    You are fully responsible for all activities that occur under your account. 
                    Please notify us immediately of any unauthorized use of your account or any security breach.
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Subscription Plans and Payments</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Free Plan</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Limited to 3 practice interview evaluations</li>
                    <li>Basic CV analysis functionality</li>
                    <li>Access to competency framework information</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Premium Plan (€149 Lifetime Access)</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Unlimited practice interview sessions</li>
                    <li>Advanced AI coaching and personalized feedback</li>
                    <li>Full competency tracking and analytics</li>
                    <li>Export functionality for all interview reports</li>
                    <li>Priority customer support</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Payment Terms</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>All payments are processed securely through Stripe</li>
                    <li>Lifetime access means access for the duration of the service's operation</li>
                    <li>Payments are non-refundable except as required by Irish/EU consumer law</li>
                    <li>Prices are subject to change with 30 days' notice for new subscribers</li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Acceptable Use Policy</h2>
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800 mb-2">You agree NOT to:</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Share your account credentials with others</li>
                  <li>Upload malicious content or attempt to compromise our systems</li>
                  <li>Use the service for any illegal or unauthorized purpose</li>
                  <li>Attempt to reverse engineer or copy our AI models</li>
                  <li>Upload confidential or classified government information</li>
                  <li>Violate any Irish or EU laws while using our platform</li>
                  <li>Engage in any activity that could harm our service or other users</li>
                </ul>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Intellectual Property Rights</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Our Property</h3>
                  <p className="text-gray-700">
                    All content, features, and functionality of the Public Prep platform, including 
                    but not limited to text, graphics, logos, AI models, and software, are owned by us and 
                    protected by Irish and international copyright laws.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Your Content</h3>
                  <p className="text-gray-700">
                    You retain ownership of your CV content and interview responses. By using our service, 
                    you grant us a limited license to process this content solely for providing you with 
                    personalized coaching and analysis.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Public Service Competency Framework</h3>
                  <p className="text-gray-700">
                    The competency frameworks used are based on official Irish Public Service guidelines 
                    and are used for educational and preparation purposes under fair use provisions.
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. AI Technology and Accuracy</h2>
              <div className="bg-amber-50 p-6 rounded-lg space-y-4">
                <h3 className="text-lg font-medium text-amber-800">Important Disclaimers:</h3>
                <ul className="list-disc list-inside text-amber-700 space-y-2">
                  <li>Our AI analysis is for preparation purposes only and cannot guarantee interview success</li>
                  <li>AI-generated feedback should supplement, not replace, professional career advice</li>
                  <li>Practice questions are based on general competency frameworks, not specific interview content</li>
                  <li>We do not have access to actual interview questions or hiring decisions</li>
                  <li>Results may vary based on individual circumstances and interview panels</li>
                </ul>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Privacy and Data Protection</h2>
              <p className="text-gray-700 leading-relaxed">
                Your privacy is important to us. Our collection, use, and protection of your personal 
                information is governed by our Privacy Policy, which is incorporated into these Terms 
                by reference. By using our service, you consent to the collection and use of your 
                information as outlined in our Privacy Policy.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Service Availability and Modifications</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  We strive to maintain high service availability but cannot guarantee uninterrupted access. 
                  We reserve the right to:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Modify or discontinue features with reasonable notice</li>
                  <li>Perform maintenance that may temporarily affect service</li>
                  <li>Update our AI models and assessment criteria</li>
                  <li>Implement security measures that may impact user experience</li>
                </ul>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Limitation of Liability</h2>
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  To the fullest extent permitted by Irish law, Public Prep shall not be liable for:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Interview outcomes or employment decisions</li>
                  <li>Indirect, incidental, or consequential damages</li>
                  <li>Loss of data due to technical issues (though we maintain regular backups)</li>
                  <li>Delays or failures in service delivery beyond our control</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-4">
                  Our total liability to you for any claims related to the service shall not exceed 
                  the amount you paid for your subscription.
                </p>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Indemnification</h2>
              <p className="text-gray-700 leading-relaxed">
                You agree to indemnify and hold harmless Public Prep, its officers, directors, 
                employees, and agents from any claims, damages, or expenses arising from your use of 
                the service, violation of these terms, or infringement of any third-party rights.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Termination</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Account Termination</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>You may terminate your account at any time by contacting support</li>
                    <li>We may terminate accounts for violation of these terms</li>
                    <li>Upon termination, your right to use the service ceases immediately</li>
                    <li>We will retain your data according to our Privacy Policy</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Effect of Termination</h3>
                  <p className="text-gray-700">
                    Sections relating to intellectual property, limitation of liability, 
                    indemnification, and dispute resolution shall survive termination.
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Governing Law and Dispute Resolution</h2>
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  These Terms shall be governed by and construed in accordance with Irish law. 
                  Any disputes arising from these Terms or your use of the service shall be 
                  resolved through:
                </p>
                <ol className="list-decimal list-inside text-gray-700 space-y-1">
                  <li>Good faith negotiation between the parties</li>
                  <li>Mediation through an Irish mediation service</li>
                  <li>If necessary, litigation in the courts of Dublin, Ireland</li>
                </ol>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Changes to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to modify these Terms at any time. We will notify users of 
                significant changes via email and by updating the "Last updated" date. Your continued 
                use of the service after changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Contact Information</h2>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700 mb-4">
                  For questions about these Terms & Conditions or our service:
                </p>
                <div className="space-y-2 text-gray-700">
                  <p><strong>Email:</strong> support@publicprep.ie</p>
                  <p><strong>Legal:</strong> legal@publicprep.ie</p>
                  <p><strong>Business Address:</strong> Public Prep, Dublin, Ireland</p>
                  <p><strong>Support Hours:</strong> Monday-Friday, 9:00 AM - 6:00 PM IST</p>
                </div>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">16. Severability</h2>
              <p className="text-gray-700 leading-relaxed">
                If any provision of these Terms is found to be unenforceable or invalid, 
                that provision shall be limited or eliminated to the minimum extent necessary 
                so that these Terms shall otherwise remain in full force and effect.
              </p>
            </section>

          </CardContent>
        </Card>
        
        <div className="text-center mt-8">
          <p className="text-gray-600">
            Questions about these Terms? Contact us at{" "}
            <a href="mailto:legal@publicprep.ie" className="text-purple-600 hover:underline">
              legal@publicprep.ie
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}