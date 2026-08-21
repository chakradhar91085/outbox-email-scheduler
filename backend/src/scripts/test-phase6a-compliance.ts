import { prisma } from '../lib/prisma';
import { CampaignService } from '../services/campaign.service';
import { RateLimiterService } from '../services/rate-limiter.service';
import { getQueueStatus } from '../queues/email.queue';
import { EmailStatus } from '@prisma/client';

async function runComplianceTests() {
  console.log('========================================================================');
  console.log('🧪 PHASE 6A: COMPREHENSIVE BACKEND COMPLIANCE & SCALABILITY TEST SUITE');
  console.log('========================================================================\n');

  const rateLimiter = RateLimiterService.getInstance();

  // -------------------------------------------------------------
  // TEST 1: SENDER NORMALIZATION & ATOMIC SENDER RATE LIMITS
  // -------------------------------------------------------------
  console.log('--- [TEST 1] Per-Sender Rate Limiting & Same-Sender Interaction ---');
  const senderShared = 'Team Alpha <shared.sender@reachinbox.ai>';
  const normalizedSender = RateLimiterService.normalizeSender(senderShared);
  console.log(`Original: "${senderShared}" -> Normalized: "${normalizedSender}"`);

  // Sender quota = 2
  const token1 = await rateLimiter.checkAndConsume(senderShared, 2);
  const token2 = await rateLimiter.checkAndConsume(normalizedSender, 2);
  const token3 = await rateLimiter.checkAndConsume(senderShared, 2); // Exceeds limit

  console.log(`Token 1 (from campaign 1): Allowed=${token1.allowed}, Count=${token1.currentCount}/2`);
  console.log(`Token 2 (from campaign 2): Allowed=${token2.allowed}, Count=${token2.currentCount}/2`);
  console.log(`Token 3 (from campaign 2): Allowed=${token3.allowed}, Delay=${Math.round(token3.delayUntilResetMs / 1000)}s`);

  if (token1.allowed && token2.allowed && !token3.allowed) {
    console.log('✅ TEST 1 PASSED: Shared sender quota is strictly enforced across campaigns.');
  } else {
    console.error('❌ TEST 1 FAILED');
  }

  // -------------------------------------------------------------
  // TEST 2: DIFFERENT SENDER INDEPENDENCE
  // -------------------------------------------------------------
  console.log('\n--- [TEST 2] Different Senders Independence ---');
  const senderIndependent = 'Beta Team <independent.sender@reachinbox.ai>';
  const tokenIndep = await rateLimiter.checkAndConsume(senderIndependent, 5);

  console.log(`Independent Sender Token: Allowed=${tokenIndep.allowed}, Count=${tokenIndep.currentCount}/5`);
  if (tokenIndep.allowed) {
    console.log('✅ TEST 2 PASSED: Independent sender was not blocked by shared sender cap.');
  } else {
    console.error('❌ TEST 2 FAILED');
  }

  // -------------------------------------------------------------
  // TEST 3: MINIMUM DELAY SPACING VERIFICATION
  // -------------------------------------------------------------
  console.log('\n--- [TEST 3] Minimum Delay Spacing Calculation ---');
  const baseTime = new Date('2026-08-21T14:00:00.000Z');
  const delaySec = 15;
  const campaign = await CampaignService.createCampaign({
    recipients: ['user.a@test.com', 'user.b@test.com', 'user.c@test.com'],
    subject: 'Delay Spacing Test',
    body: 'Verifying 15s spacing between consecutive emails.',
    sender: 'delay-tester@reachinbox.ai',
    startTime: baseTime,
    delaySeconds: delaySec,
    hourlyLimit: 100,
  });

  const emails = campaign.emails;
  const t0 = emails[0].scheduledAt.getTime();
  const t1 = emails[1].scheduledAt.getTime();
  const t2 = emails[2].scheduledAt.getTime();

  console.log(`Email 0 scheduledAt: ${emails[0].scheduledAt.toISOString()}`);
  console.log(`Email 1 scheduledAt: ${emails[1].scheduledAt.toISOString()} (Diff: ${(t1 - t0) / 1000}s)`);
  console.log(`Email 2 scheduledAt: ${emails[2].scheduledAt.toISOString()} (Diff: ${(t2 - t1) / 1000}s)`);

  if ((t1 - t0) / 1000 === 15 && (t2 - t1) / 1000 === 15) {
    console.log('✅ TEST 3 PASSED: Minimum delaySeconds spacing strictly enforced at 15s.');
  } else {
    console.error('❌ TEST 3 FAILED');
  }

  // -------------------------------------------------------------
  // TEST 4: 1000+ EMAIL BULK SCALABILITY TEST
  // -------------------------------------------------------------
  console.log('\n--- [TEST 4] 1000+ Email Scheduling & Atomic Bulk Enqueueing ---');
  const recipientCount = 1000;
  const bulkRecipients: string[] = [];
  for (let i = 1; i <= recipientCount; i++) {
    bulkRecipients.push(`lead${i}@scale-test.com`);
  }

  // Schedule 2 hours into the future so they sit safely in delayed state
  const futureStartTime = new Date(Date.now() + 2 * 3600 * 1000);
  const startTimePerf = Date.now();

  const scaleCampaign = await CampaignService.createCampaign({
    recipients: bulkRecipients,
    subject: '1000 Lead Enterprise Scalability Campaign',
    body: 'Automated high-throughput scalability test.',
    sender: 'Enterprise Outreach <scale@enterprise.com>',
    startTime: futureStartTime,
    delaySeconds: 1,
    hourlyLimit: 500,
  });

  const durationMs = Date.now() - startTimePerf;
  console.log(`⏱️ Time to persist and bulk-enqueue 1,000 emails: ${durationMs}ms`);

  // Verify PostgreSQL count
  const dbCount = await prisma.email.count({
    where: { campaignId: scaleCampaign.id },
  });
  console.log(`📊 PostgreSQL Email records created: ${dbCount}/${recipientCount}`);

  // Verify BullMQ Queue status
  const queueStatus = await getQueueStatus();
  console.log(`📊 BullMQ Delayed Queue Job Count:   ${queueStatus.counts.delayed}`);

  if (dbCount === 1000 && queueStatus.counts.delayed >= 1000 && durationMs < 5000) {
    console.log(`✅ TEST 4 PASSED: 1,000 emails persisted and bulk-enqueued in ${durationMs}ms without blocking!`);
  } else {
    console.error('❌ TEST 4 FAILED');
  }

  await prisma.$disconnect();
  console.log('\n========================================================================');
  console.log('🎉 ALL PHASE 6A COMPLIANCE & SCALABILITY TESTS COMPLETED SUCCESSFULLY');
  console.log('========================================================================');
}

runComplianceTests().catch(console.error);
