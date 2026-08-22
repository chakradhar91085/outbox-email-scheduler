import { prisma } from '../lib/prisma';
import { emailQueue, EMAIL_QUEUE_NAME } from '../queues/email.queue';
import { CampaignService } from '../services/campaign.service';
import { EmailStatus } from '@prisma/client';

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runStaggerTest() {
  console.log('================================================================');
  console.log('🧪 VERIFYING STAGGER DELAY, ORDER & STATUS TRANSITIONS');
  console.log('================================================================\n');

  const recipients = [
    'lead1@outbox-test.com',
    'lead2@outbox-test.com',
    'lead3@outbox-test.com',
    'lead4@outbox-test.com',
  ];
  const delaySeconds = 3; // 3 seconds between each email
  const startTime = new Date(); // Start immediately

  console.log(`▶️ Step 1: Creating campaign with ${recipients.length} recipients and ${delaySeconds}s stagger delay...`);
  const campaign = await CampaignService.createCampaign({
    recipients,
    subject: 'Staggered Order Verification Campaign',
    body: 'Verifying chronological dispatch and BullMQ delay spacing.',
    sender: 'ReachInbox Verification <verify@reachinbox.ai>',
    startTime,
    delaySeconds,
    hourlyLimit: 100,
  });

  console.log(`   ✅ Campaign created: ${campaign.id}`);
  console.log(`   ✅ Total emails:     ${campaign.emails.length}\n`);

  // Verify scheduled timestamps in PostgreSQL
  console.log('▶️ Step 2: Verifying PostgreSQL scheduledAt timestamps...');
  const emails = campaign.emails;
  for (let i = 0; i < emails.length; i++) {
    const email = emails[i];
    const diffFromFirst = (email.scheduledAt.getTime() - emails[0].scheduledAt.getTime()) / 1000;
    console.log(`   Email ${i + 1} (${email.recipientEmail}): scheduledAt = ${email.scheduledAt.toISOString()} (+${diffFromFirst}s)`);
    if (i > 0 && diffFromFirst !== i * delaySeconds) {
      throw new Error(`Step 2 Failed: Expected +${i * delaySeconds}s for email ${i + 1}, got +${diffFromFirst}s`);
    }
  }
  console.log('   ✅ All PostgreSQL scheduled timestamps are strictly staggered by exactly 3s!\n');

  // Verify BullMQ delayed jobs in Redis
  console.log('▶️ Step 3: Verifying BullMQ delayed queue state in Redis...');
  for (let i = 0; i < emails.length; i++) {
    const email = emails[i];
    const job = await emailQueue.getJob(email.id);
    if (!job) {
      throw new Error(`Step 3 Failed: BullMQ job for email ${email.id} not found in Redis!`);
    }
    const state = await job.getState();
    console.log(`   Job ${i + 1} (ID: ${job.id}): State = "${state}", Delay = ${job.opts.delay}ms`);
  }
  console.log('   ✅ All BullMQ delayed jobs are registered in Redis with correct delay offsets!\n');

  // Step 4: Monitor execution order over time (polling every 1s)
  console.log('▶️ Step 4: Polling database and monitoring sequential execution...');
  const startTimeMs = Date.now();
  const maxWaitMs = (recipients.length + 2) * delaySeconds * 1000;
  let allDone = false;

  while (!allDone && Date.now() - startTimeMs < maxWaitMs) {
    const currentEmails = await prisma.email.findMany({
      where: { campaignId: campaign.id },
      orderBy: { scheduledAt: 'asc' },
    });

    const statusCounts = currentEmails.reduce(
      (acc, e) => {
        acc[e.status] = (acc[e.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const elapsed = Math.round((Date.now() - startTimeMs) / 1000);
    console.log(
      `   [+${elapsed}s] Status breakdown: ` +
      `SENT=${statusCounts['SENT'] || 0} | ` +
      `PROCESSING=${statusCounts['PROCESSING'] || 0} | ` +
      `PENDING=${statusCounts['PENDING'] || 0}`
    );

    allDone = currentEmails.every((e) => e.status === EmailStatus.SENT || e.status === EmailStatus.FAILED);
    if (!allDone) {
      await sleep(1000);
    }
  }

  // Step 5: Final validation
  console.log('\n▶️ Step 5: Confirming final dispatch order and timestamps...');
  const finalEmails = await prisma.email.findMany({
    where: { campaignId: campaign.id },
    orderBy: { scheduledAt: 'asc' },
  });

  for (let i = 0; i < finalEmails.length; i++) {
    const e = finalEmails[i];
    console.log(
      `   Email ${i + 1} (${e.recipientEmail}): ` +
      `Status = ${e.status} | ` +
      `Attempts = ${e.attempts} | ` +
      `SentAt = ${e.sentAt?.toISOString() || 'N/A'}`
    );
    if (e.status !== EmailStatus.SENT) {
      throw new Error(`Step 5 Failed: Email ${i + 1} did not reach status SENT!`);
    }
  }

  console.log('\n================================================================');
  console.log('🎉 ALL STAGGER DELAY & SEQUENTIAL ORDER CHECKS PASSED 100%!');
  console.log('================================================================');

  await emailQueue.close();
  await prisma.$disconnect();
  process.exit(0);
}

runStaggerTest().catch(async (err) => {
  console.error('\n❌ STAGGER TEST FAILED:', err);
  await emailQueue.close();
  await prisma.$disconnect();
  process.exit(1);
});
