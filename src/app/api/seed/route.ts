import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { ensureDefaultUsers } from '@/lib/ensure-users';
import { requireAdmin } from '@/lib/api-auth';

function isSeedAllowed(request: Request): boolean {
  if (process.env.ALLOW_SEED !== 'true') return false;
  const secret = process.env.SEED_SECRET;
  if (!secret) return process.env.NODE_ENV !== 'production';
  const header = request.headers.get('x-seed-secret');
  return header === secret;
}

/**
 * Production-safe seed: users + settings + sample campaigns only.
 * Does NOT create fake social accounts — use OAuth in Cuentas.
 */
export async function POST(request: Request) {
  const { error: adminError } = await requireAdmin();
  if (adminError) return adminError;

  if (!isSeedAllowed(request)) {
    return NextResponse.json(
      { error: 'Seed endpoint disabled. Set ALLOW_SEED=true and send x-seed-secret header.' },
      { status: 403 }
    );
  }

  try {
    await ensureDefaultUsers();

    // Remove demo / tokenless placeholder accounts and related data
    await db.analytics.deleteMany();
    await db.scheduledPost.deleteMany();
    await db.automationRule.deleteMany();
    await db.socialAccount.deleteMany({
      where: {
        OR: [
          { accessToken: null },
          { accessToken: { startsWith: 'demo_' } },
        ],
      },
    });

    await db.appSettings.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        brandName: 'SocialHub -FM-',
        brandTagline: 'Marketing Hub + IA Studio',
        mockPublish: false,
      },
      update: {
        brandName: 'SocialHub -FM-',
        brandTagline: 'Marketing Hub + IA Studio',
        mockPublish: false,
      },
    });

    await db.marketingCampaign.deleteMany();
    await db.marketingCampaign.createMany({
      data: [
        {
          name: 'Lanzamiento Marketing Hub',
          description: 'Campaña de reconocimiento para SocialHub -FM- + IA Studio',
          objective: 'awareness',
          budget: 1200,
          status: 'active',
          platforms: '["instagram","facebook","linkedin"]',
          startDate: new Date(),
        },
        {
          name: 'Conversión prueba gratuita',
          description: 'Tráfico y conversión hacia onboarding',
          objective: 'conversion',
          budget: 800,
          status: 'planning',
          platforms: '["x","tiktok"]',
        },
      ],
    });

    return NextResponse.json({
      message:
        'Seed OK (usuarios, settings live, campañas). Conecta redes con OAuth en Cuentas.',
      accounts: 0,
      posts: 0,
      rules: 0,
      campaigns: 2,
      mockPublish: false,
    });
  } catch (error) {
    console.error('Error seeding data:', error);
    return NextResponse.json({ error: 'Failed to seed data' }, { status: 500 });
  }
}
