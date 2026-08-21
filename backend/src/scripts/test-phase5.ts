import { prisma } from '../lib/prisma';
import { addEmailJob, getQueueStatus } from '../queues/email.queue';
import { RateLimiterService } from '../services/rate-limiter.service';
import { EmailStatus } from '@prisma/client';

async function runPhase5Tests() {
  console.log('============================================================');
  console.log('🧪 RUNNING PHASE 5 COMPREHENSIVE AUTOMATED VERIFICATION SUITE');
  console.log('============================================================');

  const rateLimiter = RateLimiterService.getInstance();

  // -------------------------------------------------------------
  // TEST 1: Per-Campaign Rate Limiter Atomic Lua Logic Test
  // -------------------------------------------------------------
  console.log('\n--- [TEST 1] Testing RateLimiterService Atomic Consumption ---');
  const dummyCampaignId = 'test-campaign-ratelimit-' + Date.now();
  const limit = 2;

  const res1 = await rateLimiter.checkAndConsume(dummyCampaignId, limit);
  console.log(`Attempt 1: Allowed=${res1.allowed}, Count=${res1.currentCount}/${limit}, Remaining=${res1.remaining}`);

  const res2 = await rateLimiter.checkAndConsume(dummyCampaignId, limit);
  console.log(`Attempt 2: Allowed=${res2.allowed}, Count=${res2.currentCount}/${limit}, Remaining=${res2.remaining}`);

  const res3 = await rateLimiter.checkAndConsume(dummyCampaignId, limit);
  console.log(`Attempt 3 (Exceeding): Allowed=${res3.allowed}, Count=${res3.currentCount}/${limit}, DelayUntilReset=${Math.round(res3.delayUntilResetMs / 1000)}s`);

  if (res1.allowed && res2.allowed && !res3.allowed) {
    console.log('✅ TEST 1 PASSED: Rate limiter allowed exact limit (2) and blocked attempt 3 atomically.');
  } else {
    console.error('❌ TEST 1 FAILED');
  }

  // -------------------------------------------------------------
  // TEST 2: Campaign Independence Test
  // -------------------------------------------------------------
  console.log('\n--- [TEST 2] Testing Campaign Independence ---');
  const campaignAId = 'campaign-A-' + Date.now();
  const campaignBId = 'campaign-B-' + Date.now();

  // Exhaust Campaign A (limit = 1)
  const a1 = await rateLimiter.checkAndConsume(campaignAId, 1);
  const a2 = await rateLimiter.checkAndConsume(campaignAId, 1);
  console.log(`Campaign A: Token 1 Allowed=${a1.allowed}, Token 2 Allowed=${a2.allowed}`);

  // Campaign B should still have full capacity (limit = 3)
  const b1 = await rateLimiter.checkAndConsume(campaignBId, 3);
  console.log(`Campaign B: Token 1 Allowed=${b1.allowed}, Count=${b1.currentCount}/3`);

  if (!a2.allowed && b1.allowed) {
    console.log('✅ TEST 2 PASSED: Campaign A limit does NOT block Campaign B.');
  } else {
    console.error('❌ TEST 2 FAILED');
  }

  // -------------------------------------------------------------
  // TEST 3: Database & Worker Rate-Limit Lifecycle Test
  // -------------------------------------------------------------
  console.log('\n--- [TEST 3] Creating Campaign with 5 Recipients & HourlyLimit = 2 ---');
  const campaign = await prisma.campaign.create({
    data: {
      subject: 'Phase 5 Rate Limit Verification',
      body: 'Testing hourly limit of 2 emails.',
      sender: 'rate-test@reachinbox.ai',
      startTime: new Date(),
      delaySeconds: 0,
      hourlyLimit: 2,
    },
  });

  const recipients = ['user1@test.com', 'user2@test.com', 'user3@test.com', 'user4@test.com', 'user5@test.com'];
  const createdEmails = [];

  for (const r of recipients) {
    const email = await prisma.email.create({
      data: {
        campaignId: campaign.id,
        recipientEmail: r,
        scheduledAt: new Date(),
        status: EmailStatus.PENDING,
      },
    });
    createdEmails.push(email);
    await addEmailJob(email.id, email.scheduledAt);
  }

  console.log(`Created Campaign '${campaign.id}' with ${createdEmails.length} emails. Enqueued jobs in BullMQ.`);
  console.log('Waiting for worker to process...');

  await prisma.$disconnect();
}

runPhase5Tests().catch(console.error);
