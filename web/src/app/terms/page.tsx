"use client";

import { Navbar } from "@/components/shared/navbar";
import { MDXRenderer } from "@/components/mdx-renderer";
import { Plus_Jakarta_Sans } from "next/font/google";
import { TERMS_CONTENT } from "@/lib/legal-content";

const jakarta = Plus_Jakarta_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin-ext", "vietnamese"],
});

export default function TermsPage() {
  return (
    <div className={`min-h-screen bg-background ${jakarta.className}`}>
      <Navbar title="Terms & Conditions" showBackToDashboard={true} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <MDXRenderer content={TERMS_CONTENT} className="legal-content" />
        </div>
      </div>
    </div>
  );
}

**Last updated:** **February 6, 2026**

These Terms & Conditions ("**Terms**") govern your access to and use of Flinote's website at [**https://flinote.ai**](https://flinote.ai/), our mobile applications, and related services that link to these Terms (collectively, the "**Services**"). By accessing or using the Services, you agree to these Terms. If you do not agree, do not use the Services.

If you are using the Services on behalf of an organization, you represent that you have authority to bind that organization, and "you" includes the organization.

For information about how we collect and use personal information, see our Privacy Policy.

**Apple App Store Notice.** If you downloaded the app from the Apple App Store, **Apple is not a party to these Terms**.

---

## 1) Who Flinote Is For

Flinote is intended for users generally in high school and above. If you are under **13**, or under **14** where parental consent is required under applicable law, you may not use the Services unless a parent/guardian provides valid consent and supervision as required by law.

---

## 2) Your Account

You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You agree to:

- provide accurate account information, and
- notify us promptly if you believe your account has been compromised.

We may suspend or terminate accounts that violate these Terms.

---

## 3) User Content: Uploads, Links, and Study Materials

### A) What you can submit

The Services allow you to submit content such as:

- audio recordings,
- YouTube links,
- Website links
- PDFs and documents,
- text, prompts, and note edits.

Your submitted content is "**User Content**."

### B) Processing of User Content (including transcripts/extracted text)

To provide the Services, Flinote may **extract text**, **generate transcripts**, and **store** both:

- the content you submit, and/or
- the **transcripts / extracted text** created from your submissions,
    
    along with the study outputs you generate (e.g., notes, flashcards, quizzes, mind maps, podcast-style summaries, and chat responses).
    

This processing is necessary to operate features like generating notes and enabling "chat with notes," editing, and re-accessing your materials.

### C) You are responsible for what you submit

You represent and warrant that:

- you have all rights and permissions needed to submit the User Content,
- your submission and our processing of it does not violate any law or policy applicable to you,
- you will not submit content that infringes copyright or other rights of others, and
- you will not submit content that violates academic integrity rules or institutional policies.

### D) If your content includes other people

If your User Content contains another person's voice, likeness, personal information, or private communications, you represent you have provided any required notice and obtained any required consent to record, upload, and process that content.

---

## 4) Recording & Classroom Content Policy (Important)

Flinote is designed to help you learn, not to help you violate rules or laws. When using recordings, lecture content, or other educational materials, you agree to:

### A) Follow school/workplace/instructor policies

You must not record or upload content if doing so violates your school, university, workplace, instructor, or institution rules.

### B) Follow copyright law

Do not upload or use materials you do not have permission to use. This includes textbooks, paid courses, slides, and protected lecture materials unless you have the right to submit them.

### C) Respect privacy and sensitive conversations

Do not record or upload private or confidential conversations without required consent. Laws vary by location, and you are responsible for compliance.

Because Flinote may store transcripts or extracted text from your submissions, you should only submit recordings or materials that you are permitted to record, upload, and have processed and stored.

You understand that you, not Flinote, are responsible for your conduct and submissions.

---

## 5) Acceptable Use (What you can't do)

You agree not to:

- use the Services for unlawful, harmful, deceptive, or abusive purposes;
- submit content that is illegal, infringing, defamatory, harassing, hateful, or sexually explicit;
- upload malware, ransomware, spyware, or any code intended to disrupt, damage, or gain unauthorized access to systems;
- phish, scam, impersonate others, or attempt to collect sensitive information from other users;
- exploit minors, facilitate self-harm, or promote violence or illegal activities;
- attempt to reverse engineer, scrape, or extract data or source code from the Services;
- use bots, scrapers, or automated means to access the Services except standard browser use;
- interfere with or disrupt the Services, security, or integrity of our systems;
- attempt unauthorized access to any account, system, or network;
- share, resell, or provide access to paid features to others (unless we explicitly allow it);
- use the Services to facilitate cheating, fraud, or academic dishonesty.

We may remove content or restrict access if we believe you violated these Terms.

---

## 6) AI Outputs and Educational Disclaimer

Flinote may generate study outputs such as notes, flashcards, quizzes, mind maps, podcast-style summaries, and chat responses based on your User Content (including transcripts/extracted text). You acknowledge:

- AI outputs may contain errors, omissions, or inaccuracies,
- you are responsible for reviewing outputs before relying on them,
- Flinote does not guarantee grades, learning outcomes, or accuracy of generated content.

Flinote is not a substitute for professional advice (including legal, medical, or financial advice).

---

## 7) Ownership and Licenses

### A) Your content

As between you and Flinote, you retain ownership of your User Content.

You grant Flinote a limited license to host, store, process, and display your User Content **only as needed to operate, maintain, and improve the Services**, including generating the outputs you request and providing support, subject to our Privacy Policy.

### B) Flinote content

The Services (including software, design, logos, and non-user content) are owned by Flinote or its licensors and protected by applicable laws. You receive a limited, personal, non-exclusive, non-transferable, revocable license to use the Services for your personal, non-commercial educational use (unless we expressly permit otherwise).

---

## 8) Third-Party Services (Including YouTube)

The Services may allow you to submit links or content from third-party platforms (for example, **YouTube**). You are responsible for ensuring your use of those platforms and any linked content complies with their terms, policies, and applicable law.

Flinote is not responsible for third-party platforms, their availability, or their content. Third-party terms and privacy practices may apply when you access or use their services.

---

## 9) Service Availability, Changes, and Feature Modifications

We are continuously improving Flinote. This means we may:

- add, remove, or change features or functionality,
- introduce limits or restrictions (including usage caps),
- modify plans and pricing (with notice where required), or
- suspend or discontinue parts of the Services.

We do not guarantee that any specific feature will always be available.

---

## 10) Subscriptions, Billing, and Trials (If Applicable)

If you purchase a subscription or paid plan:

- Fees are charged in advance and are generally non-refundable except as stated below or required by law.
- Your subscription may renew automatically unless cancelled before renewal (depending on the platform and plan).
- If you subscribed via Apple App Store or Google Play, billing and cancellation are managed through those platforms.

### Cancellation

You can cancel at any time through your billing settings (website billing portal or App Store/Google Play). You will typically retain access until the end of your current billing period.

---

## 11) Refund Policy (Digital Services)

Because the Services are digital, we generally do not offer returns.

**App Store purchases:** If you purchased a subscription or paid feature through the **Apple App Store**, billing and refunds are handled by Apple, and you must request any refund through Apple's refund process. **We cannot directly issue refunds for App Store purchases.**

For purchases made directly from Flinote (if available), refunds may be provided **only** if:

- you experience a technical issue that prevents you from accessing paid features, and
- we are unable to resolve the issue within a reasonable time.

To request help, email [**hello@flinote.ai**](mailto:hello@flinote.ai) with your account email, purchase details, and a description of the issue. Refunds, if approved, may be prorated or limited depending on the platform and applicable law.

(If your plan is purchased via Google Play, Google's refund rules may apply and you may need to request through them.)

---

## 12) Copyright / DMCA-Style Notice

We respect intellectual property rights. If you believe content on Flinote infringes your copyright, please email [**hello@flinote.ai**](mailto:hello@flinote.ai) with:

- your contact information,
- a description of the copyrighted work,
- where the material appears on the Services (URL/screenshot/details),
- a statement that you have a good-faith belief the use is not authorized,
- a statement that your notice is accurate, and
- your electronic or physical signature.

We may remove or disable access to allegedly infringing content and may terminate repeat infringers where appropriate.

---

## 13) User Content; Copyright Complaints

Flinote processes content uploaded or provided by users. We do not pre-screen all User Content. If you submit content that infringes someone else's rights, you are responsible for that submission.

If we receive a valid notice (including a copyright complaint) or otherwise reasonably believe content may violate rights or law, we may remove it, disable access to it, or restrict accounts, without prior notice where appropriate.

---

## 14) Academic Integrity ("Honor Code")

Flinote is designed to support learning—not replace it. You agree not to use the Services to:

- cheat on exams or graded assessments,
- share or request test answers,
- submit AI-generated output as your own work where prohibited,
- violate academic integrity or honor code rules.

We may take action (including content removal, account suspension/termination) if we believe the Services are used for academic dishonesty.

---

## 15) Termination

You may stop using the Services at any time. We may suspend or terminate your access if:

- you violate these Terms,
- your use creates risk or legal exposure,
- we are required to do so by law.

Certain sections (e.g., ownership, disclaimers, limitation of liability, dispute terms) survive termination.

---

## 16) Disclaimer of Warranties

The Services are provided **"as is"** and **"as available."** To the maximum extent permitted by law, we disclaim all warranties, express or implied, including merchantability, fitness for a particular purpose, and non-infringement. We do not guarantee that the Services will be uninterrupted, error-free, or completely secure.

---

## 17) Limitation of Liability

To the maximum extent permitted by law:

- Flinote will not be liable for indirect, incidental, special, consequential, or punitive damages, or any loss of profits, data, or goodwill.
- Flinote's total liability for any claim arising out of or related to the Services will not exceed the amount you paid to Flinote (if any) for the Services in the **12 months** before the event giving rise to the claim.

Some jurisdictions do not allow certain limitations, so some of the above may not apply to you.

---

## 18) Indemnification

You agree to indemnify and hold harmless Flinote from claims, liabilities, damages, losses, and expenses (including reasonable legal fees) arising from:

- your User Content,
- your violation of these Terms,
- your violation of any law, institutional policy, or third-party rights.

---

## 19) Dispute Resolution; Arbitration; Class Action Waiver

**Please read this section carefully. It affects your rights.**

**Informal resolution first.** Before filing a claim, you agree to try to resolve disputes informally by emailing **hello@flinote.ai** with a description of the issue.

**Arbitration.** To the extent permitted by applicable law, any dispute arising out of or relating to the Services or these Terms will be resolved by **binding arbitration on an individual basis**, rather than in court. Arbitration may be conducted **remotely (online/phone/video)**. Either party may bring a claim in **small claims court** if it qualifies.

**No class actions.** You and Flinote agree that disputes will be brought **only in an individual capacity** and not as a plaintiff or class member in any class, consolidated, or representative action.

**Exceptions.** Either party may seek injunctive or equitable relief to stop unauthorized use, infringement, or misuse of the Services.

**Local law limitations.** Some jurisdictions do not allow arbitration or certain waivers. To the extent those restrictions apply to you, the relevant parts of this section may not apply.

---

## 20) Governing Law and Venue

These Terms and any dispute arising out of or relating to the Services will be governed by the laws of **India**, without regard to conflict-of-law principles.

Subject to applicable law, you agree that any legal action or proceeding not subject to arbitration (or where arbitration is unenforceable) arising out of or relating to the Services will be brought exclusively in the competent courts located in **Rajasthan, India**, and you consent to the jurisdiction of those courts.

Nothing in this section limits rights you may have that cannot be waived under applicable law.

---

## 21) Changes to These Terms

We may update these Terms from time to time. If changes are material, we will provide notice as required by law. Your continued use of the Services after changes become effective means you accept the updated Terms.

---

## 22) Contact Us

Questions about these Terms: [**hello@flinote.ai**](mailto:hello@flinote.ai)`;
  } catch (error) {
    console.error("Error reading terms file:", error);
    return "# Terms & Conditions\n\nUnable to load terms content.";
  }
}

export default function TermsPage() {
  const termsContent = getTermsContent();

  return (
    <div className={`min-h-screen bg-background ${jakarta.className}`}>
      <Navbar title="Terms & Conditions" showBackToDashboard={true} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <MDXRenderer content={termsContent} className="legal-content" />
        </div>
      </div>
    </div>
  );
}
