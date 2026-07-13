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

    // Seed social accounts
    const accounts = [
      {
        platform: 'facebook',
        accountName: 'Mi Negocio FB',
        avatarUrl: 'https://ui-avatars.com/api/?name=FB&background=1877F2&color=fff&size=128',
        followers: 8540,
        following: 342,
        posts: 156,
        engagement: 4.2,
      },
      {
        platform: 'instagram',
        accountName: '@mi_negocio_ig',
        avatarUrl: 'https://ui-avatars.com/api/?name=IG&background=E4405F&color=fff&size=128',
        followers: 12350,
        following: 890,
        posts: 245,
        engagement: 6.8,
      },
      {
        platform: 'tiktok',
        accountName: '@mi_negocio_tt',
        avatarUrl: 'https://ui-avatars.com/api/?name=TT&background=000000&color=fff&size=128',
        followers: 24800,
        following: 156,
        posts: 89,
        engagement: 8.5,
      },
      {
        platform: 'x',
        accountName: '@mi_negocio_x',
        avatarUrl: 'https://ui-avatars.com/api/?name=X&background=000000&color=fff&size=128',
        followers: 5200,
        following: 1200,
        posts: 1890,
        engagement: 3.1,
      },
    ];

    // Clean existing data
    await db.analytics.deleteMany();
    await db.scheduledPost.deleteMany();
    await db.automationRule.deleteMany();
    await db.socialAccount.deleteMany();

    const createdAccounts: Awaited<ReturnType<typeof db.socialAccount.create>>[] = [];
    for (const acc of accounts) {
      const account = await db.socialAccount.create({ data: acc });
      createdAccounts.push(account);
    }

    // Seed some scheduled posts
    const now = new Date();
    const posts = [
      {
        content: '🎉 ¡Gran oferta de temporada! 50% de descuento en todos nuestros productos. ¡No te lo pierdas! #oferta #descuento',
        platforms: '["facebook","instagram"]',
        status: 'published',
        scheduledAt: new Date(now.getTime() - 86400000 * 2),
        publishedAt: new Date(now.getTime() - 86400000 * 2),
        accountId: createdAccounts[0].id,
        likes: 245,
        comments: 38,
        shares: 56,
        reaches: 3200,
      },
      {
        content: '📸 Detrás de cámaras de nuestra última colección. ¿Qué opinan? #bts #nuevacoleccion',
        platforms: '["instagram","tiktok"]',
        status: 'published',
        scheduledAt: new Date(now.getTime() - 86400000),
        publishedAt: new Date(now.getTime() - 86400000),
        accountId: createdAccounts[1].id,
        likes: 890,
        comments: 125,
        shares: 78,
        reaches: 5600,
      },
      {
        content: '🚀 Lanzamiento nuevo producto este viernes. Stay tuned! #lanzamiento #nuevo',
        platforms: '["x","facebook"]',
        status: 'scheduled',
        scheduledAt: new Date(now.getTime() + 86400000 * 2),
        accountId: createdAccounts[3].id,
        likes: 0,
        comments: 0,
        shares: 0,
        reaches: 0,
      },
      {
        content: '💡 5 tips para mejorar tu productividad empresarial. Hilo 🧵👇 #emprendimiento #productividad',
        platforms: '["x"]',
        status: 'draft',
        accountId: createdAccounts[3].id,
        likes: 0,
        comments: 0,
        shares: 0,
        reaches: 0,
      },
      {
        content: '🎬 Nuevo video en TikTok: Cómo usar nuestro producto paso a paso #tutorial #viral',
        platforms: '["tiktok","instagram"]',
        status: 'scheduled',
        scheduledAt: new Date(now.getTime() + 86400000),
        accountId: createdAccounts[2].id,
        likes: 0,
        comments: 0,
        shares: 0,
        reaches: 0,
      },
      {
        content: '🌟 Gracias a nuestra comunidad por alcanzar los 25K seguidores en TikTok! 🎂🎉',
        platforms: '["tiktok","facebook","instagram"]',
        status: 'published',
        scheduledAt: new Date(now.getTime() - 86400000 * 3),
        publishedAt: new Date(now.getTime() - 86400000 * 3),
        accountId: createdAccounts[2].id,
        likes: 1200,
        comments: 234,
        shares: 156,
        reaches: 15000,
      },
    ];

    for (const post of posts) {
      await db.scheduledPost.create({ data: post });
    }

    // Seed automation rules
    const rules = [
      {
        name: 'Auto-publicar ofertas diarias',
        description: 'Publicar ofertas automáticamente cada día a las 10:00 AM en Facebook e Instagram',
        triggerType: 'time_based',
        triggerConfig: JSON.stringify({ time: '10:00', frequency: 'daily' }),
        actionType: 'post',
        actionConfig: JSON.stringify({ template: 'daily_deal' }),
        platforms: '["facebook","instagram"]',
        isActive: true,
        runCount: 15,
        lastRunAt: new Date(now.getTime() - 3600000),
      },
      {
        name: 'Seguir de vuelta nuevos seguidores',
        description: 'Seguir automáticamente a los nuevos seguidores que te sigan',
        triggerType: 'new_followers',
        triggerConfig: JSON.stringify({ threshold: 1 }),
        actionType: 'follow_back',
        actionConfig: JSON.stringify({ delay: '5m' }),
        platforms: '["instagram","x"]',
        isActive: true,
        runCount: 234,
        lastRunAt: new Date(now.getTime() - 7200000),
      },
      {
        name: 'Like automático a comentarios',
        description: 'Dar like automáticamente a los comentarios de los seguidores',
        triggerType: 'engagement_threshold',
        triggerConfig: JSON.stringify({ minComments: 5 }),
        actionType: 'like',
        actionConfig: JSON.stringify({ targetType: 'comment' }),
        platforms: '["instagram","tiktok"]',
        isActive: false,
        runCount: 0,
      },
      {
        name: 'Responder mensajes con FAQ',
        description: 'Respuesta automática a mensajes directos con preguntas frecuentes',
        triggerType: 'engagement_threshold',
        triggerConfig: JSON.stringify({ type: 'dm_received' }),
        actionType: 'dm',
        actionConfig: JSON.stringify({ template: 'faq_response', delay: '10m' }),
        platforms: '["facebook","instagram"]',
        isActive: true,
        runCount: 89,
        lastRunAt: new Date(now.getTime() - 1800000),
      },
    ];

    for (const rule of rules) {
      await db.automationRule.create({ data: rule });
    }

    // Seed analytics for the past 7 days
    for (const account of createdAccounts) {
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);

        const baseFollowers = account.followers - (7 - i) * Math.floor(Math.random() * 30 + 10);

        await db.analytics.create({
          data: {
            accountId: account.id,
            date,
            platform: account.platform,
            followers: baseFollowers,
            following: account.following,
            posts: Math.floor(Math.random() * 5 + 1),
            likes: Math.floor(Math.random() * 2000 + 100),
            comments: Math.floor(Math.random() * 300 + 20),
            shares: Math.floor(Math.random() * 150 + 10),
            reaches: Math.floor(Math.random() * 10000 + 500),
            impressions: Math.floor(Math.random() * 15000 + 2000),
            engagement: parseFloat((Math.random() * 8 + 2).toFixed(1)),
          },
        });
      }
    }

    // Ensure app settings exist
    await db.appSettings.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        brandName: "SocialHub -FM-",
        brandTagline: "Marketing Hub + IA Studio",
      },
      update: {
        brandName: "SocialHub -FM-",
        brandTagline: "Marketing Hub + IA Studio",
      },
    });

    await db.marketingCampaign.deleteMany();
    await db.marketingCampaign.createMany({
      data: [
        {
          name: "Lanzamiento Marketing Hub",
          description: "Campaña de reconocimiento para SocialHub -FM- + IA Studio",
          objective: "awareness",
          budget: 1200,
          status: "active",
          platforms: '["instagram","facebook","linkedin"]',
          startDate: new Date(),
        },
        {
          name: "Conversión prueba gratuita",
          description: "Tráfico y conversión hacia onboarding",
          objective: "conversion",
          budget: 800,
          status: "planning",
          platforms: '["x","tiktok"]',
        },
      ],
    });

    return NextResponse.json({
      message: 'Seed data created successfully',
      accounts: createdAccounts.length,
      posts: posts.length,
      rules: rules.length,
      campaigns: 2,
    });
  } catch (error) {
    console.error('Error seeding data:', error);
    return NextResponse.json({ error: 'Failed to seed data' }, { status: 500 });
  }
}
