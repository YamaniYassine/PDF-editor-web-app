# Éditeur PDF Web

## 1. Vue d’ensemble

L’**Éditeur PDF Web** est une application complète permettant de **modifier, fusionner, supprimer et compresser** des fichiers PDF en ligne, sans installation logicielle.

- **Backend** : API FastAPI (Python) responsable du traitement des PDFs.
- **Frontend** : Application Next.js 14 (React/TypeScript) avec une interface moderne et intuitive.

**Public cible** : utilisateurs recherchant des outils PDF rapides et efficaces en ligne.  
**Technologies principales** : Next.js 14, Tailwind CSS, TypeScript, Python, FastAPI, PyMuPDF, qpdf, PDF.js.


### Structure du projet
```bash
/pdf-editor-backend
  main.py                # API FastAPI
  utils.py               # Fonctions de traitement PDF
  requirements.txt       # Dépendances Python

/pdf-editor-frontend
  /src
    /app
      /compress/page.tsx # Page compression PDF
      /delete/page.tsx   # Page suppression de pages PDF
      /edit/page.tsx     # Page édition PDF
      /merge/page.tsx    # Page fusion PDF
      /page.tsx          # Page d'accueil
    /components          # Composants UI
      FileUploader.tsx
      Footer.tsx
      Hero.tsx
      NavBar.tsx
      PageThumbnails.tsx
      Pagination.tsx
      PDFCanvas.tsx
      PdfCompressor.tsx
      PdfDeleter.tsx
      PdfEditor.tsx
      PdfMerger.tsx
      ToolGrid.tsx
      types.tsx
```
---

## 2. Fonctionnalités clés

- **Édition de texte en place**  
  Extraction précise du texte avec position et style, édition directe dans le navigateur, style conservé, multi-pages supporté.

- **Fusion de PDFs**  
  Combine plusieurs fichiers en un seul, dans l'ordre d'envoi.

- **Suppression de pages**  
  Sélection visuelle de pages à supprimer. Numérotation base-0.

- **Compression de PDF**  
  Réduction du poids des fichiers via `qpdf`, optimisation sans perte visuelle notable.

- **Performance**  
  Rendu optimisé via PDF.js, traitement en mémoire côté client, chargement lazy des composants.

---

## 3. Architecture technique

### Backend - `pdf-editor-backend/`

Technologies utilisées :

- FastAPI (API REST)
- PyMuPDF (manipulation PDF)
- qpdf (compression)
- uvicorn (serveur ASGI)

Endpoints API principaux :

| Method | Endpoint            | Description                   |
|--------|--------------------|--------------------------------|
| POST   | `/api/extract`      | Extract text with coordinates |
| POST   | `/api/replace`      | Replace text in a PDF         |
| POST   | `/api/merge`        | Merge multiple PDFs           |
| POST   | `/api/delete-pages` | Delete specific pages         |
| POST   | `/api/compress`     | Compress PDF file             |



Fonctions utilitaires (`utils.py`) :  
- `extract_text_items()`  
- `replace_text_and_generate()`  
- `merge_pdfs_bytes()`  
- `delete_pages_from_pdf()`  
- `compress_pdf_with_qpdf()`

### Frontend - `pdf-editor-frontend/`

Technologies utilisées :

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- PDF.js
- Axios
- FileSaver.js

Structure des pages (`src/app/`) :

- `/` – Accueil (Hero)
- `/edit` – Éditeur interactif
- `/merge` – Fusion PDF
- `/delete` – Suppression de pages
- `/compress` – Compression PDF

Composants principaux (`src/components/`) :

- **PdfEditor.tsx** : chargement, affichage et édition du texte PDF  
- **PDFCanvas.tsx** : rendu PDF avec PDF.js + zones éditables  
- **FileUploader.tsx** : upload drag & drop, validation PDF  
- **PageThumbnails.tsx** : miniatures pages, navigation rap.  
- `Pagination.tsx`, `ToolGrid.tsx`, `Navbar.tsx`, `Footer.tsx`, `Hero.tsx` – composants d’interface  
- **PdfMerger.tsx**, **PdfDeleter.tsx**, **PdfCompressor.tsx** – interfaces spécifiques pour chaque fonctionnalité

---

## 4. Flux de fonctionnement

**Exemple - Édition de texte** :

1. Upload du PDF.
2. Extraction via `/api/extract`.
3. Affichage avec zones de texte éditables.
4. Modification par l’utilisateur.
5. Envoi des modifs à `/api/replace`.
6. Téléchargement du PDF modifié.

**Autres actions** :

- Fusion → `/api/merge`  
- Suppression pages → `/api/delete-pages`  
- Compression → `/api/compress`

---

## 5. Installation et déploiement

### Backend

```bash
cd pdf-editor-backend/
python -m venv venv
source venv/bin/activate  # ou venv\Scripts\activate sur Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd pdf-editor-frontend/
npm install
npm run dev  # accessible sur http://localhost:3000
```

### Prérequis système :

- Python 3.8+

- Node.js 18+

- qpdf installé (pour la compression)


## 6. Points techniques importants

- Coordonnées : conversion PyMuPDF (orig bottom-left) ↔ PDF.js (top-left) : y_converted = page_height - y_original.

- Typage TS : défini dans types.ts.

- Sécurité : validation des fichiers, CORS en mode dev, aucun stockage serveur.

- Gestion d’erreurs : try/catch sur toutes les opérations.


## 7. Conclusion

- Cette application propose une solution complète et pratique pour la gestion des PDFs :

- Interface moderne et responsive

- Édition de texte précise, conservation du style

- Fonctions essentielles : fusion, suppression, compression

- Architecture claire et scalable

- Code maintenable (TypeScript + structure front/backend)

### Suggestions futures :

- Sécurisation avancée (CORS, validation)

- OCR pour les PDF scannés

- Historique des versions modifiées


## 8. Licence

- MIT License © 2025 - YAMANI Yassine

## 9. Contribution

- Les pull requests sont les bienvenues ! Merci d'ouvrir une issue pour discuter des modifications proposées.

## 10. Support

- Si ce projet t’a été utile, un ⭐️ sur le repo serait grandement apprécié !



# if needed
For Ubuntu/Debian:  sudo apt-get update && sudo apt-get install -y qpdf
For Docker (inside Dockerfile): RUN apt-get update && apt-get install -y qpdf