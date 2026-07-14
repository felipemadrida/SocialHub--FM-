import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de privacidad | SocialHub -FM-",
  description:
    "Política de privacidad de SocialHub -FM- para usuarios y conexiones OAuth con redes sociales.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-sm text-teal-400">SocialHub -FM-</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Política de privacidad
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Última actualización: 14 de julio de 2026
        </p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-300">
          <section className="space-y-2">
            <h2 className="text-lg font-medium text-white">1. Quiénes somos</h2>
            <p>
              SocialHub -FM- (“la App”) es una plataforma de gestión y publicación
              de contenido en redes sociales (Facebook, Instagram, TikTok, X,
              LinkedIn, YouTube, Pinterest y similares). Esta política describe
              cómo tratamos datos personales y tokens de acceso al usar el
              servicio alojado en{" "}
              <a
                className="text-teal-400 underline"
                href="https://socialhub-fm.vercel.app"
              >
                socialhub-fm.vercel.app
              </a>
              .
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-white">2. Datos que tratamos</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong>Cuenta de acceso:</strong> email, nombre y rol (admin /
                retail) para iniciar sesión en la App.
              </li>
              <li>
                <strong>Cuentas sociales conectadas:</strong> identificadores de
                página/perfil, nombre público, avatar y tokens OAuth necesarios
                para publicar en tu nombre.
              </li>
              <li>
                <strong>Contenido:</strong> textos, medios y metadatos de
                publicaciones que creas o programas en la App.
              </li>
              <li>
                <strong>Uso técnico:</strong> logs mínimos de servidor, errores y
                métricas operativas para mantener el servicio.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-white">3. Finalidad</h2>
            <p>Usamos estos datos únicamente para:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Autenticarte y controlar el acceso por roles.</li>
              <li>
                Conectar tus redes mediante OAuth y publicar contenido a una o
                varias plataformas.
              </li>
              <li>
                Gestionar biblioteca creativa, campañas, automatizaciones e IA
                dentro del producto.
              </li>
              <li>Cumplir obligaciones legales y de seguridad.</li>
            </ul>
            <p>No vendemos tus datos personales a terceros.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-white">
              4. Facebook / Meta e Instagram
            </h2>
            <p>
              Al conectar Facebook o Instagram, la App solicita permisos OAuth
              (por ejemplo listar páginas y publicar). Los tokens se almacenan de
              forma cifrada en tránsito (HTTPS) y se usan solo para las acciones
              que inicias en SocialHub -FM-. Puedes revocar el acceso en cualquier
              momento desde la App (Cuentas → desconectar) o desde la
              configuración de Meta.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-white">5. Conservación</h2>
            <p>
              Conservamos la información mientras tu cuenta esté activa o sea
              necesaria para prestar el servicio. Si eliminas una conexión OAuth o
              solicitas baja, eliminamos o anonimizamos tokens y datos asociados
              en un plazo razonable, salvo retención legal.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-white">6. Seguridad</h2>
            <p>
              Aplicamos controles técnicos y organizativos razonables (HTTPS,
              control de sesión, roles, secretos de entorno). Ningún sistema es
              100 % seguro; te pedimos usar contraseñas fuertes y no compartir
              accesos.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-white">7. Tus derechos</h2>
            <p>
              Puedes solicitar acceso, corrección o eliminación de datos de tu
              cuenta contactando al administrador del servicio. También puedes
              desconectar redes y dejar de usar la App en cualquier momento.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-white">8. Contacto</h2>
            <p>
              Para privacidad y soporte: administrador de SocialHub -FM- a través
              de la cuenta de la aplicación o el correo configurado en tu
              despliegue.
            </p>
          </section>
        </div>

        <p className="mt-10 text-sm text-slate-500">
          <Link href="/login" className="text-teal-400 underline">
            Volver al login
          </Link>
        </p>
      </div>
    </main>
  );
}
