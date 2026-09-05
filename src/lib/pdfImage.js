// Convertit une image distante (le logo de l'école, stocké sur Firebase
// Storage) en dataURL, seul format que jsPDF sait intégrer directement.
// Se dégrade silencieusement (retourne null) en cas d'échec — un PDF sans
// logo vaut toujours mieux qu'un PDF qui ne se génère pas.

export function fetchImageAsDataUrl(url) {
  return new Promise((resolve) => {
    if (!url) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}
