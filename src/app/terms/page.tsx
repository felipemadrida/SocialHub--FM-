import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Términos del servicio | SocialHub -FM-",
  description:
    "Condiciones de uso de SocialHub -FM- para gestión y publicación en redes sociales.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-sm text-teal-400">SocialHub -FM-</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Condiciones del servicio
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Última actualización: 14 de julio de 2026
        </p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-300">
          <section className="space-y-2">
            <h2 className="text-lg font-medium text-white">1. Aceptación</h2>
            <p>
              Al acceder o usar SocialHub -FM- (“el Servicio”) disponible en{" "}
              <a
                className="text-teal-400 underline"
                href="https://socialhub-fm.vercel.app"
              >
                socialhub-fm.vercel.app
              </a>
              , aceptas estas Condiciones. Si no estás de acuerdo, no uses el
              Servicio.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-white">2. Descripción</h2>
            <p>
              El Servicio permite gestionar cuentas sociales conectadas vía OAuth,
              crear y programar publicaciones, usar biblioteca creativa, marketing
              e IA, y administrar usuarios con roles Admin / Retail.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-white">3. Cuentas y redes</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Eres responsable de tus credenciales y de las acciones realizadas
                con tu sesión.
              </li>
              <li>
                Al conectar Facebook u otras redes, autorizas a la App a actuar
                según los permisos OAuth que otorgues.
              </li>
              <li>
                Debes cumplir las políticas de cada plataforma (Meta, X, etc.).
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-white">4. Contenido</h2>
            <p>
              Conservas la titularidad del contenido que publicas. Garantizas
              que tienes derechos para publicarlo y que no infringe leyes ni
              derechos de terceros. Nos reservamos el derecho de suspender el
              Servicio ante abuso o incumplimiento.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-white">5. Disponibilidad</h2>
            <p>
              El Servicio se ofrece “tal cual”. Puede haber interrupciones por
              mantenimiento, fallos de terceros (APIs de redes) o fuerza mayor.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-white">6. Privacidad</h2>
            <p>
              El tratamiento de datos se describe en la{" "}
              <Link href="/privacy" className="text-teal-400 underline">
                Política de privacidad
              </Link>
              .
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-white">7. Contacto</h2>
            <p>
              Para soporte legal o de producto, contacta al administrador de tu
              instancia de SocialHub -FM-.
            </p>
          </section>
        </div>

        <p className="mt-10 text-sm text-slate-500">
          <Link href="/login" className="text-teal-400 underline">
            Volver al login
          </Link>
          {" · "}
          <Link href="/privacy" className="text-teal-400 underline">
            Privacidad
          </Link>
        </p>
      </div>
    </main>
  );
}
