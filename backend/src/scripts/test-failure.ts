import { prisma } from '../lib/prisma';
import nodemailer from 'nodemailer';
import { EmailStatus } from '@prisma/client';

async function testFailureScenario() {
  console.log('--- Testing SMTP Failure & Retry Tracking ---');

  // 1. Create a test campaign and email in DB
  const campaign = await prisma.campaign.create({
    data: {
      subject: 'Failure Test Campaign',
      body: 'Testing SMTP error handling',
      sender: 'invalid@test.com',
      startTime: new Date(),
      delaySeconds: 0,
      hourlyLimit: 100,
    },
  });

  const email = await prisma.email.create({
    data: {
      campaignId: campaign.id,
      recipientEmail: 'failure.test@example.com',
      scheduledAt: new Date(),
      status: EmailStatus.PENDING,
    },
  });

  console.log(`Created test email ID: ${email.id}`);

  // 2. Simulate SMTP dispatch using bad credentials
  const badTransporter = nodemailer.createTransport({
    host: 'invalid-smtp-host.example.com',
    port: 587,
    secure: false,
    auth: {
      user: 'bad-user',
      pass: 'bad-pass',
    },
    connectionTimeout: 2000,
  });

  // 3. Mark PROCESSING and increment attempt 1
  await prisma.email.update({
    where: { id: email.id },
    data: {
      status: EmailStatus.PROCESSING,
      attempts: { increment: 1 },
    },
  });

  try {
    await badTransporter.sendMail({
      from: campaign.sender,
      to: email.recipientEmail,
      subject: campaign.subject,
      text: campaign.body,
    });
  } catch (error: any) {
    console.log(`Captured expected SMTP failure: ${error.message}`);

    // Update status to FAILED with errorMessage
    const failedEmail = await prisma.email.update({
      where: { id: email.id },
      data: {
        status: EmailStatus.FAILED,
        errorMessage: `SMTP Error: ${error.message}`,
      },
    });

    console.log('✅ PostgreSQL Record updated to FAILED:');
    console.log(`   Status:       ${failedEmail.status}`);
    console.log(`   Attempts:     ${failedEmail.attempts}`);
    console.log(`   ErrorMessage: ${failedEmail.errorMessage}`);
  }

  await prisma.$disconnect();
}

testFailureScenario().catch(console.error);
