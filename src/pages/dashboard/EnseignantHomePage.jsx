import ComingSoonPage from "./ComingSoonPage";
import { IconLayers } from "../../components/icons";

export default function EnseignantHomePage() {
  return (
    <ComingSoonPage
      icon={IconLayers}
      title="Vos classes apparaîtront ici"
      text="Une fois affecté à une ou plusieurs classes par la direction, vous retrouverez ici vos élèves, la saisie des notes et votre emploi du temps."
    />
  );
}
