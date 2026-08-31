import ComingSoonPage from "./ComingSoonPage";
import { IconUsers } from "../../components/icons";

export default function ParentHomePage() {
  return (
    <ComingSoonPage
      icon={IconUsers}
      title="Le suivi de vos enfants apparaîtra ici"
      text="Dès que l'établissement aura lié votre compte à celui de votre enfant, vous retrouverez ici ses notes, son emploi du temps et les annonces de l'école."
    />
  );
}
