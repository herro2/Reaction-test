# MS Teknis — Reaktionstest för tangentbord

Ett tangentbordsbaserat reaktionstest med live-topplista.

## Publicera på GitHub Pages

1. Pusha koden till ditt GitHub-repository (`main` eller `master`).
2. Gå till **Settings → Pages** i ditt GitHub-repository.
3. Under **Build and deployment → Source**, välj **GitHub Actions**.
4. Workflowen `.github/workflows/deploy.yml` bygger automatiskt projektet (`npm install && npm run build`) och publicerar `dist/` till GitHub Pages.

> Obs: Välj **GitHub Actions** (inte "Deploy from a branch" på roten), eftersom GitHub Pages inte kan köra `.tsx`-filer direkt utan byggsteg.
