import { createContext, useContext, useEffect, useState } from "react";

const PageTitleContext = createContext(null);

export function PageTitleProvider({ children }) {
  const [title, setTitle] = useState("Tableau de bord");
  return (
    <PageTitleContext.Provider value={{ title, setTitle }}>
      {children}
    </PageTitleContext.Provider>
  );
}

export function usePageTitle() {
  return useContext(PageTitleContext);
}

// À utiliser pour envelopper l'élément de chaque route afin de définir le
// titre affiché dans la barre supérieure du dashboard.
export function Page({ title, children }) {
  const { setTitle } = usePageTitle();
  useEffect(() => {
    setTitle(title);
  }, [title, setTitle]);
  return children;
}
