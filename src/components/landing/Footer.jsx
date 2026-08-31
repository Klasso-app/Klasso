import KlassoLogo from "../ui/KlassoLogo";
import { IconMail, IconPhone, IconMapPin } from "../icons";

export default function Footer() {
  return (
    <footer id="contact" className="border-t border-line">
      <div className="mx-auto max-w-6xl px-5 py-14 grid md:grid-cols-3 gap-10">
        <div>
          <KlassoLogo size={30} />
          <p className="mt-4 text-sm text-ink-soft max-w-xs leading-relaxed">
            Le logiciel de gestion scolaire pensé pour les établissements
            d'Afrique de l'Ouest, de la maternelle à la terminale.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-ink mb-4">Produit</h3>
          <ul className="flex flex-col gap-3 text-sm text-ink-soft">
            <li><a href="#fonctionnalites">Fonctionnalités</a></li>
            <li><a href="#multi-etablissement">Multi-établissement</a></li>
            <li><a href="#espaces">Les espaces</a></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-medium text-ink mb-4">Contact</h3>
          <ul className="flex flex-col gap-3 text-sm text-ink-soft">
            <li className="flex items-center gap-2">
              <IconMail className="w-4 h-4" />
              contact@klasso.app
            </li>
            <li className="flex items-center gap-2">
              <IconPhone className="w-4 h-4" />
              +225 00 00 00 00
            </li>
            <li className="flex items-center gap-2">
              <IconMapPin className="w-4 h-4" />
              Abidjan, Côte d'Ivoire
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto max-w-6xl px-5 py-5 text-xs text-ink-soft">
          © {new Date().getFullYear()} Klasso. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
