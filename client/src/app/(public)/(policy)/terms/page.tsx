'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function TermsAndConditions() {
  const router = useRouter();

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="px-6 py-8 sm:p-10">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Terms & Conditions</h1>
            <Button 
              onClick={handleGoBack}
              className="bg-pink-600 hover:bg-pink-700 text-white"
            >
              Back
            </Button>
          </div>

          <div className="prose prose-lg max-w-none">
            <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Introduction</h2>
                <p className="text-gray-700">
                  Plannova (&quot;Plannova&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is an event planning platform that provides valuable event-related information and services for modern clients. The services offered by us include the Plannova website located at plannova.com or any subdomain of plannova.com (the &quot;Plannova Website&quot;), the Plannova event planning app, and any other features, content, or applications offered from time to time by Plannova in connection with the Plannova Website (collectively, the &quot;Plannova Services&quot;).
                </p>
                <p className="text-gray-700 mt-3">
                  These Terms of Use (this &quot;Agreement&quot;) set forth the legally binding terms for your use of the Plannova Services. By using the Plannova Services, whether as a &quot;Visitor&quot; (meaning you simply browse the Plannova website) or as a &quot;User&quot; (meaning you have registered with and/or submitted content to the Plannova website either as an individual or as a company), you agree to be bound by this Agreement and the Plannova Privacy Policy.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Eligibility</h2>
                <p className="text-gray-700">
                  Use of the Plannova Services is void where prohibited. By registering, you (i) represent and warrant that you have the right, authority, and capacity to enter into and to fully abide by all of the terms and conditions of this Agreement, as far as age, jurisdiction, laws of land, etc. are concerned and (ii) agree to comply with all applicable domestic and international laws, statutes, ordinances and regulations regarding your use of the Plannova Services.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Term</h2>
                <p className="text-gray-700">
                  This Agreement shall remain in full force and effect while you use the Plannova Services or are a User on the website. Plannova may terminate your use of the Plannova Website or the Plannova Services, in its sole discretion, for any reason or no reason whatsoever, at any time, without warning or notice to you. Upon such termination of agreement, the User shall be stopped from using Plannova Services and all content shall remain to be the Property of Plannova.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">User & Plannova Content</h2>
                <p className="text-gray-700">
                  Plannova does not claim any ownership rights in the text, files, images, photos, video, sounds, musical works, works of authorship, or any other materials (collectively, &quot;User Content&quot;) that you upload to, submit to, or embed on the Plannova platform; except content created in collaboration with the Plannova team for its own events/perusal. In such cases, the same will be specified while creating the content in question.
                </p>
                <p className="text-gray-700 mt-3">
                  You represent and warrant that you own the User Content posted by you on or through the Plannova Services or that you otherwise have sufficient right, title and interest in and to such User Content to grant Plannova the licenses and rights set forth below without violating, infringing or misappropriating the privacy rights, publicity rights, copyrights, contract rights, intellectual property rights or any other rights of any person.
                </p>
                <p className="text-gray-700 mt-3">
                  After posting, uploading or embedding User Content to the Plannova Services, you continue to retain such rights in such User Content as you held prior to posting such User Content on the Plannova Services and you continue to have the right to use your User Content in any way you choose. However, by displaying or publishing (&quot;posting&quot;) any User Content on or through the Plannova Services, you hereby grant to Plannova a non-exclusive, royalty-free, transferable, sublicensable, worldwide license to use, display, reproduce, adapt, modify (e.g., re-format), rearrange, and distribute your User Content through any media now known or developed in the future.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Prohibited Content</h2>
                <p className="text-gray-700">
                  Plannova reserves the right, in its sole and absolute discretion, to determine whether User Content is appropriate; and to remove any User Content, without notice or liability to you, which it determines to be inappropriate. Without limiting the generality of the foregoing, the following is a partial list of the types of User Content that Plannova deems to be inappropriate:
                </p>
                <ul className="list-disc pl-6 mt-3 space-y-2 text-gray-700">
                  <li>Content that criticizes a business or individual beyond that of merely offering an opinion</li>
                  <li>Content that harasses or advocates harassment of another person</li>
                  <li>Content that exploits people in a sexual or violent manner</li>
                  <li>Content that contains nudity, violence, or offensive subject matter or contains a link to an adult website</li>
                  <li>Content that includes racially, ethically, or otherwise objectionable language</li>
                  <li>Content that is libelous, defamatory, or otherwise tortious language</li>
                  <li>Content that solicits personal information from anyone under 18</li>
                  <li>Content that promotes information that you know is false or misleading or promotes illegal activities or conduct that is abusive, threatening, obscene, defamatory or libelous</li>
                  <li>Content that promotes an illegal or unauthorized copy of another person&apos;s copyrighted work</li>
                  <li>Content that involves the transmission of &quot;junk mail,&quot; &quot;chain letters,&quot; or unsolicited mass mailing</li>
                  <li>Content that contains restricted or password only access pages or hidden pages or images</li>
                  <li>Content that furthers or promotes any criminal activity or enterprise</li>
                  <li>Content that solicits passwords or personal identifying information for commercial or unlawful purposes from other Users</li>
                  <li>Content that is owned, created or belongs to a third party and the entity posting/publishing such content has no authority to do so</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Prohibited Activity</h2>
                <p className="text-gray-700">
                  You expressly agree that you are prohibited from engaging in, and will not engage in, the following prohibited activities in connection with your use of the Plannova Services:
                </p>
                <ul className="list-disc pl-6 mt-3 space-y-2 text-gray-700">
                  <li>Copying, modifying, translating, publishing, broadcasting, transmitting, licensing, sublicensing, assigning, distributing, performing, publicly displaying, or selling any Third Party Content or Plannova Content appearing on or through the Plannova Services</li>
                  <li>Criminal or tortious activity, including child pornography, fraud, trafficking in obscene material, drug dealing, gambling, harassment, stalking, spamming, spimming, sending of viruses or other harmful files, copyright infringement, patent infringement, or theft of trade secrets</li>
                  <li>Covering or obscuring the banner advertisements on your personal profile page, or any Plannova page via HTML/CSS or any other means</li>
                  <li>Any automated use of the system, such as using scripts to add friends or send comments or messages</li>
                  <li>Interfering with, disrupting, or creating an undue burden on the Plannova Services or the networks or services connected to the Plannova Services</li>
                  <li>Attempting to impersonate another User, person, or representative of Plannova</li>
                  <li>Using the account, username, or password of another User at any time or disclosing your password to any third party or permitting any third party to access your account</li>
                  <li>Selling or otherwise transferring your profile, without our permission</li>
                  <li>Using any information obtained from the Plannova Services in order to harass, abuse, or harm another person</li>
                  <li>Displaying an advertisement on your profile, or accepting payment or anything of value from a third person in exchange for your performing any commercial activity on or through the Plannova Services on behalf of that person</li>
                  <li>Using the Plannova Services in a manner inconsistent with any and all applicable laws and regulations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Copyright Policy</h2>
                <p className="text-gray-700">
                  You may not post, modify, distribute, or reproduce in any way any copyrighted material, trademarks, or other proprietary information belonging to Plannova or others (including without limitation Third Party Content or Plannova Content) without obtaining the prior written consent of the owner of such copyrighted material, trademarks, or other proprietary information.
                </p>
                <p className="text-gray-700 mt-3">
                  If we become aware that one of our users is a repeat copyright infringer, it is our policy to take reasonable steps within our power to terminate that user. Without limiting the foregoing, if you believe that your work has been copied and posted on the Plannova Services in a way that constitutes copyright infringement, please provide us with relevant proof and we&apos;ll be happy to take corrective action accordingly.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">User Disputes</h2>
                <p className="text-gray-700">
                  Users are solely responsible for their interactions with other Plannova Users. Plannova reserves the right, but has no obligation, to monitor disputes between you and other Users and to immediately terminate the privileges of any User for any reason or for no reason.
                </p>
                <p className="text-gray-700 mt-3">
                  Plannova is only a listing and aggregating platform and no associations, interactions, bookings that happen on the Plannova platform are the responsibility of Plannova.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Privacy</h2>
                <p className="text-gray-700">
                  Use of the Plannova Services is also governed by our Privacy Policy, which is incorporated into this Agreement by this reference.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Disclaimer of Warranties</h2>
                <p className="text-gray-700">
                  THE PLANOVA SERVICE IS PROVIDED TO YOU ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS WITHOUT REPRESENTATIONS OR WARRANTIES OF ANY KIND AND PLANOVA EXPRESSLY DISCLAIMS ANY AND ALL IMPLIED OR STATUTORY WARRANTIES TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, INCLUDING WITHOUT LIMITATION IMPLIED WARRANTIES OF TITLE, NON-INFRINGEMENT, MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.
                </p>
                <p className="text-gray-700 mt-3">
                  PLANOVA IS NOT RESPONSIBLE FOR ANY PROBLEMS OR TECHNICAL MALFUNCTION OF ANY TELEPHONE NETWORK OR LINES, COMPUTER ONLINE SYSTEMS, SERVERS OR PROVIDERS, COMPUTER EQUIPMENT, SOFTWARE, FAILURE OF ANY EMAIL OR PLAYERS DUE TO TECHNICAL PROBLEMS OR TRAFFIC CONGESTION ON THE INTERNET OR ON ANY OF THE PLANOVA SERVICES OR COMBINATION THEREOF, INCLUDING ANY INJURY OR DAMAGE TO USERS OR TO ANY PERSON&apos;S COMPUTER RELATED TO OR RESULTING FROM PARTICIPATION OR DOWNLOADING MATERIALS IN CONNECTION WITH THE PLANOVA SERVICES.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Limitation of Liability</h2>
                <p className="text-gray-700">
                  IN NO EVENT SHALL PLANOVA OR ANY PARENT, SUBSIDIARY, AFFILIATE, DIRECTOR, OFFICER, EMPLOYEE, LICENSOR, DISTRIBUTOR, SUPPLIER, AGENT, RESELLER, OWNER, OR OPERATOR OF PLANOVA BE LIABLE TO YOU OR ANY THIRD PARTY FOR ANY DIRECT, INDIRECT, CONSEQUENTIAL, EXEMPLARY, INCIDENTAL, SPECIAL OR PUNITIVE DAMAGES, INCLUDING LOST PROFIT DAMAGES ARISING FROM YOUR USE OF THE SERVICES, EVEN IF PLANOVA HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Disputes; Choice of Law; Venue</h2>
                <p className="text-gray-700">
                  If there is any dispute about or involving the Plannova Services, you agree that the dispute shall be governed by the laws of the State of California, USA and the Courts of San Francisco County shall have jurisdiction. The prevailing party in any action brought in connection with this Agreement shall be entitled to an award of attorney&apos;s fees and costs incurred by the prevailing party in connection with such action.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Indemnity</h2>
                <p className="text-gray-700">
                  You agree to indemnify and hold harmless Plannova, and any parent, subsidiary, and affiliate, director, officer, employee, licensor, distributor, supplier, agent, reseller, owner and operator, from and against any and all claims, damages, obligations, losses, liabilities, costs or debt, including but not limited to reasonable attorneys&apos; fees, made by any third party due to or arising out of your use of the Plannova Services in violation of this Agreement and/or arising from: (i) your use of and access to the Plannova Website; (ii) your violation of any term of these Terms of Use; (iii) your violation of any third party right, including without limitation any copyright, property, or privacy right; or (iv) any claim that your User Content caused damage to a third party.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Changes to Terms</h2>
                <p className="text-gray-700">
                  Plannova may modify this Agreement from time to time and each modification will be effective when it is posted on the Plannova Website. You agree to be bound to any changes to this Agreement through your continued use of the Plannova Services. You will not be notified of any modifications to this Agreement so it is important that you review this Agreement regularly to ensure you are updated as to any changes.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Contact Us</h2>
                <p className="text-gray-700">
                  If you have any questions about these Terms & Conditions, please contact us at:
                </p>
                <p className="text-gray-700 mt-2">
                  <strong>Email:</strong> support@plannova.in
                </p>
                <p className="text-gray-700 mt-1">
                  <strong>Address:</strong> Plannova Inc., 123 Event Plaza, San Francisco, CA 94102
                </p>
              </section>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-gray-600 text-sm">
              © {new Date().getFullYear()} Plannova. All rights reserved.
            </p>
            <div className="mt-4 sm:mt-0">
              <Link href="/privacy" className="text-pink-600 hover:text-pink-800 text-sm mr-4">
                Privacy Policy
              </Link>
              <Link href="/refund-policy" className="text-pink-600 hover:text-pink-800 text-sm">
                Refund Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}