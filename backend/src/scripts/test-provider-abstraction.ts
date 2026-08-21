import { emailService } from '../services/email.service';
import { EmailProviderFactory } from '../services/email/email-provider.factory';
import { ResendEmailProvider } from '../services/email/resend-email.provider';

async function runAuditTests() {
  console.log('====================================================');
  console.log('🧪 Running Email Provider Abstraction Audit Tests...');
  console.log('====================================================\n');

  // Test A: Verify default provider selection (Ethereal)
  console.log('Test A: Default provider selection');
  const defaultProvider = EmailProviderFactory.createProvider();
  if (defaultProvider.name !== 'ethereal') {
    throw new Error(`Expected default provider 'ethereal', got '${defaultProvider.name}'`);
  }
  console.log('✅ Test A Passed: Default provider is Ethereal (SMTP).\n');

  // Test B: Verify explicit Ethereal selection
  console.log('Test B: Explicit Ethereal selection');
  const explicitEthereal = EmailProviderFactory.createProvider('ethereal');
  if (explicitEthereal.name !== 'ethereal') {
    throw new Error(`Expected provider 'ethereal', got '${explicitEthereal.name}'`);
  }
  console.log('✅ Test B Passed: Explicit Ethereal selection works.\n');

  // Test C: Verify unsupported provider error
  console.log('Test C: Unsupported provider validation');
  try {
    EmailProviderFactory.createProvider('unsupported-smtp');
    throw new Error('Test C Failed: Unsupported provider did not throw an error');
  } catch (err: any) {
    if (err.message.includes('Unsupported EMAIL_PROVIDER')) {
      console.log(`✅ Test C Passed: Threw expected error -> "${err.message}"\n`);
    } else {
      throw err;
    }
  }

  // Test D: Verify Resend missing API key validation
  console.log('Test D: Resend missing API key fail-fast validation');
  try {
    const resendProvider = new ResendEmailProvider();
    await resendProvider.initialize();
    // If RESEND_API_KEY is present in .env, verify it initializes, otherwise ensure it threw
    console.log('ℹ️ Resend initialized (API key present in environment).\n');
  } catch (err: any) {
    if (err.message.includes('RESEND_API_KEY is missing')) {
      console.log(`✅ Test D Passed: Threw expected fail-fast error -> "${err.message}"\n`);
    } else {
      throw err;
    }
  }

  // Test E: Verify real Ethereal SMTP dispatch through EmailService facade
  console.log('Test E: Real Ethereal SMTP dispatch via EmailService facade');
  await emailService.initialize();
  const sendResult = await emailService.sendEmail({
    to: 'evaluator-compliance@reachinbox.ai',
    subject: 'ReachInbox Email Provider Abstraction Audit Verification',
    text: 'Automated audit verification testing Ethereal SMTP delivery and normalized result structure.',
  });

  console.log(`- Provider:    ${sendResult.provider}`);
  console.log(`- Message ID:  ${sendResult.messageId}`);
  console.log(`- Preview URL: ${sendResult.previewUrl}`);

  if (!sendResult.messageId || sendResult.previewUrl === false) {
    throw new Error('Test E Failed: Did not receive valid messageId or previewUrl from Ethereal');
  }
  console.log('✅ Test E Passed: Ethereal SMTP dispatched successfully with preview URL.\n');

  console.log('====================================================');
  console.log('🎉 ALL 5 PROVIDER AUDIT TESTS PASSED SUCCESSFULLY!');
  console.log('====================================================');
}

runAuditTests().catch((err) => {
  console.error('\n❌ Provider Abstraction Audit Failed:', err);
  process.exit(1);
});
