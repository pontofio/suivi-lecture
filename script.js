//
// ─── script.js ───────────────────────────────────────────────────────────────────
//
//  Ce fichier gère :
//   • recherche.php  → recherche Google Books + popup « Ajouter à ma bibliothèque »
//   • bibliotheque.php → affichage/filtre/tri + popup « Modifier un livre »
//


// ─── 0) DÉCLARATION UNIQUE DE LA BASE URL ─────────────────────────────────────────
const API_BASE_URL = "http://localhost/suivi-lecture";



// ─── 1) CLASSE GLOBALE POUR LA BIBLIOTHÈQUE ─────────────────────────────────────
class BibliothequeManager {
  constructor() {
    this.livres = [];            // liste de tous les livres (objet avec title, authors, status, note, startDate, endDate, genre, description, cover)
    this.livreTemporaire = null; // utilisé lors de la recherche Google Books → popup « Ajouter »
    this.livreEnCours    = null; // utilisé lors de la page Bibliothèque → popup « Modifier »
  }

  // 1.a) Charger la liste des livres depuis get-livre.php (et stocker en localStorage)
  async chargerLivres() {
    try {
      const res  = await fetch("get-livre.php");
      const data = await res.json();
      console.log("→ Données brutes reçues de get-livre.php :", data.livres);

      if (!data.success) throw new Error(data.message);

      this.livres = data.livres.map(item => ({
          title:       item.title,
          authors:     item.authors,
          status:      item.statut,
          note:        parseFloat(item.note) || 0,
          startDate:   item.date_debut,
          endDate:     item.date_fin,
          genre:       item.genre,
          description: item.description,
          cover: item.cover || ""

        }));

      localStorage.setItem("bibliotheque", JSON.stringify(this.livres));

      // Si on est sur la page bibliotheque.php, on peut afficher immédiatement
      if (window.location.pathname.includes("bibliotheque.php")) {
        this.afficherLivresFiltres("Tous");
      }
    } catch (err) {
      console.error("Erreur lors du chargement des livres :", err);
    }
  }

  // 1.b) Afficher / filtrer (statut) ← utilisé dans bibliotheque.php
  afficherLivresFiltres(statut) {
    
    const container = document.getElementById("library");

    if (!container) return;
    container.innerHTML = "";

    const self = this;  // pour garder la référence correcte à l’instance

    let toDisplay = this.livres;
    if (statut && statut !== "Tous") {
      toDisplay = this.livres.filter(l => l.status === statut);
    }

    if (toDisplay.length === 0) {
      container.innerHTML = "<p>Aucun livre trouvé pour ce filtre.</p>";
      return;
    }

    toDisplay.forEach(livre => {
      const div = document.createElement("div");
      const fullDesc = livre.description || "Pas de résumé disponible.";
      const maxChars = 500;
      const shortDesc = (fullDesc.length > maxChars)
    ? fullDesc.substring(0, maxChars).trim() + "…"
    : fullDesc; 
      div.className = "grid-item";
      div.style.display = "flex";
      div.style.alignItems = "flex-start";
      div.style.padding = "12px";
      div.style.borderBottom = "1px solid var(--gray-200, #d1d5db)";

      // ≪ … ≫ avant : const div = document.createElement("div");
div.className = "grid-item";

div.innerHTML = `
  <div class="cover-container">
    <div class="cover-info-row">
      <img
        src="${livre.cover || ""}"
        alt="Couverture"
        onerror="this.style.display='none'"
        class="book-cover"
      >
      <div class="title-author">
        <p class="book-title">${livre.title}</p>
        <p class="book-author">${livre.authors}</p>
      </div>
      <button class="delete-button">Supprimer</button>

    </div>
  </div>

  <div class="book-details">
    <p><strong class="label">Genre :</strong> ${livre.genre}</p>
    <p><strong class="label">Note :</strong> ${livre.note || "Non noté"}</p>
    <p><strong class="label">Statut :</strong> ${livre.status}</p>
    <p class="description-text">${shortDesc || "Pas de résumé disponible."}</p>
  </div>
`;

// 1) clic sur la carte pour ouvrir la popup d’édition (sauf quand on clique sur "Supprimer")
div.addEventListener("click", () => {
  self.ouvrirPopupEdit(livre);
});

// 2) évènement du bouton 'Supprimer' (stopPropagation empêche l'ouverture de la popup)
const deleteBtn = div.querySelector(".delete-button");
deleteBtn.addEventListener("click", e => {
  e.stopPropagation();
  if (window.confirm("Voulez-vous vraiment supprimer ce livre ?")) {
    self.supprimerLivre(livre);
  }
});

container.appendChild(div);

    });
  }

  // 1.c) Trier (critère) ← utilisé dans bibliotheque.php
  trierLivres(critere) {
    const container = document.getElementById("library");
    
    if (!container) return;

    const self = this;

    let sorted = [...this.livres];
    switch (critere) {
      case "auteur":
        sorted.sort((a, b) => a.authors.localeCompare(b.authors));
        break;
      case "note":
        sorted.sort((a, b) => (b.note || 0) - (a.note || 0));
        break;
      case "genre":
        sorted.sort((a, b) => a.genre.localeCompare(b.genre));
        break;
      case "titre":
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "date-croissant":
        sorted.sort((a, b) => {
          if (!a.endDate) return -1;
          if (!b.endDate) return 1;
          return new Date(a.endDate) - new Date(b.endDate);
        });
        break;
      case "date-decroissant":
        sorted.sort((a, b) => {
          if (!a.endDate) return 1;
          if (!b.endDate) return -1;
          return new Date(b.endDate) - new Date(a.endDate);
        });
        break;
      default:
        break;
    }

    container.innerHTML = "";
    sorted.forEach(livre => {
      const div = document.createElement("div");
      const fullDesc = livre.description || "Pas de résumé disponible.";
      const maxChars = 500;
      const shortDesc = (fullDesc.length > maxChars)
    ? fullDesc.substring(0, maxChars).trim() + "…"
    : fullDesc; 
  
      // ≪ … ≫ avant : const div = document.createElement("div");
div.className = "grid-item";

div.innerHTML = `
  <div class="cover-container">
    <div class="cover-info-row">
      <img
        src="${livre.cover || ""}"
        alt="Couverture"
        onerror="this.style.display='none'"
        class="book-cover"
      >
      <div class="title-author">
        <p class="book-title">${livre.title}</p>
        <p class="book-author">${livre.authors}</p>
      </div>
      <button class="delete-button">Supprimer</button>

    </div>
  </div>

  <div class="book-details">
    <p><strong class="label">Genre :</strong> ${livre.genre}</p>
    <p><strong class="label">Note :</strong> ${livre.note || "Non noté"}</p>
    <p><strong class="label">Statut :</strong> ${livre.status}</p>
    <p class="description-text">${shortDesc || "Pas de résumé disponible."}</p>
  </div>
`;

// 1) clic sur la carte pour ouvrir la popup d’édition (sauf quand on clique sur "Supprimer")
div.addEventListener("click", () => {
  self.ouvrirPopupEdit(livre);
});

// 2) évènement du bouton 'Supprimer' (stopPropagation empêche l'ouverture de la popup)
const deleteBtn = div.querySelector(".delete-button");
deleteBtn.addEventListener("click", e => {
  e.stopPropagation();
  if (window.confirm("Voulez-vous vraiment supprimer ce livre ?")) {
    self.supprimerLivre(livre);
  }
});

container.appendChild(div);

    });
  }



  // 1.d) Ouvrir la popup « Modifier un livre » ← utilisé sur bibliotheque.php
ouvrirPopupEdit(livre) {
  this.livreEnCours = livre;

  // 1) Récupération de l’élément <img>
  const coverElt = document.getElementById("popup-edit-cover");
  if (coverElt) {
    // Afficher l'URL dans la console (pour debug) :
    console.log("URL de couverture chargée :", livre.cover);

    if (livre.cover) {
      coverElt.src = livre.cover;
      coverElt.style.display = "block";
    } else {
      // Si cover est vide ou undefined, on masque l'<img>
      coverElt.style.display = "none";
    }
  }

  // 2) Les autres champs textuels
  const titleElt   = document.getElementById("popup-edit-title");
  const authorElt  = document.getElementById("popup-edit-authors");
  const genreElt   = document.getElementById("popup-edit-genre-text");
  const descElt    = document.getElementById("popup-edit-desc-text");
  const statusElt  = document.getElementById("popup-edit-status");
  const noteElt    = document.getElementById("popup-edit-note");
  const startElt   = document.getElementById("popup-edit-start");
  const endElt     = document.getElementById("popup-edit-end");

  if (titleElt)  titleElt.textContent  = livre.title;
  if (authorElt) authorElt.textContent = livre.authors;
  if (genreElt)  genreElt.textContent  = livre.genre;
  if (descElt)   descElt.textContent   = livre.description;

  if (statusElt) statusElt.value = livre.status;
  if (noteElt)   noteElt.value   = livre.note || "";
  if (startElt)  startElt.value  = livre.startDate || "";
  if (endElt)    endElt.value    = livre.endDate || "";

  // 3) Enfin, on affiche la popup
  document.getElementById("popup-edit").style.display = "flex";
}


  // 1.e) Fermer la popup « Modifier » et réinitialiser
  fermerPopupEdit() {
    document.getElementById("popup-edit").style.display = "none";
    this.livreEnCours = null;
  }

  // 1.f) Enregistrer les modifications d’un livre → utilisé sur bibliotheque.php
  async enregistrerModifications() {
    const livre = this.livreEnCours;
    if (!livre) return;

    const statut    = document.getElementById("popup-edit-status").value;
    const note      = document.getElementById("popup-edit-note").value;
    const startDate = document.getElementById("popup-edit-start").value;
    const endDate   = document.getElementById("popup-edit-end").value;

    // CONTRAINTES MÉTIER (identiques à la popup « Ajouter »)
    if (statut === "À lire" && (startDate || endDate)) {
      alert("Un livre 'À lire' ne doit pas avoir de date de début ou de fin.");
      return;
    }
    if (statut === "En cours" && endDate) {
      alert("Un livre 'En cours' ne doit pas avoir de date de fin.");
      return;
    }
    if (statut === "Terminé" && (!startDate || !endDate)) {
      alert("Un livre 'Terminé' doit avoir une date de début et une date de fin.");
      return;
    }
    if (statut === "DNF" && endDate) {
      alert("Un livre 'DNF' ne doit pas avoir de date de fin.");
      return;
    }

    // Appliquer les valeurs aux propriétés de l’objet en mémoire
    livre.status    = statut;
    livre.note      = parseInt(note) || 0;
    livre.startDate = (statut === "Terminé") ? startDate : "";
    livre.endDate   = (statut === "Terminé") ? endDate : "";

    // Envoi vers le serveur pour mise à jour en base
    try {
      const res = await fetch(`${API_BASE_URL}/modifier-livre.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          livre_id:   livre.id, // ← C’EST ÇA QUI MANQUE
          titre:      livre.title,
          auteur:     livre.authors,
          statut:     livre.status,
          note:       livre.note,
          date_debut: livre.startDate,
          date_fin:   livre.endDate
        })
      });
      const data = await res.json();
      console.log("→ données reçues depuis get-livre.php :", data.livres);

      if (!data.success) {
        console.warn("Erreur sur le serveur :", data.message);
      }
    } catch (err) {
      console.error("Erreur communication serveur :", err);
    }

    // Mise à jour locale + réaffichage
    localStorage.setItem("bibliotheque", JSON.stringify(this.livres));
    this.afficherLivresFiltres(document.getElementById("filtre-statut").value || "Tous");
    this.fermerPopupEdit();
  }

  // 1.g) Ajouter un livre en base (pop « Ajouter ») ← utilisé sur recherche.php
  async ajouterLivre(bookData) {
    try {
      const response = await fetch(`${API_BASE_URL}/ajouter-livre.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(bookData)
      });
      const data = await response.json();
      if (!data.success) {
        console.warn("Erreur BD :", data.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error("Erreur communication serveur :", err);
      return false;
    }
  }

  
/**
 * Supprime un livre à la fois du tableau en mémoire, du localStorage
 * et via l’API (supprimer-livre.php).
 */
async  supprimerLivre(livre) {
  // 1) Retirer du tableau interne
  this.livres = this.livres.filter(l => 
    !(l.title === livre.title && l.authors === livre.authors)
  );
  // 2) Mettre à jour localStorage
  localStorage.setItem("bibliotheque", JSON.stringify(this.livres));

  // 3) Appeler l’API pour supprimer en base
  try {
    const res = await fetch(`${API_BASE_URL}/supprimer-livre.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        titre:  livre.title,
        auteur: livre.authors
      })
    });
    const data = await res.json();
    if (!data.success) {
      console.warn("Erreur lors de la suppression côté serveur :", data.message);
    }
  } catch (err) {
    console.error("Erreur réseau lors de la suppression :", err);
  }

  // 4) Réafficher la liste mise à jour (en tenant compte du filtre actuel)
  const filtre = document.getElementById("filtre-statut")?.value || "Tous";
  this.afficherLivresFiltres(filtre);
}
}



// ─── 2) INITIALISATION LORSQUE LE DOM EST CHARGÉ ─────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  const manager = new BibliothequeManager();
  manager.chargerLivres();

  // Charger le menu (menu.html) si présent
  const menuPlaceholder = document.getElementById("menu-placeholder");
  if (menuPlaceholder) {
    fetch("menu.html")
      .then(r => r.ok ? r.text() : Promise.reject("menu.html introuvable"))
      .then(html => menuPlaceholder.innerHTML = html)
      .catch(err => {
        console.warn("Impossible de charger menu.html :", err);
        menuPlaceholder.innerHTML = "<p>Menu non disponible.</p>";
      });
  }

  // Selon la page, appeler la fonction d’initialisation adéquate
  const page = window.location.pathname;
  if (page.includes("recherche.php")) {
    initialiserRecherche(manager);
  }
  if (page.includes("bibliotheque.php")) {
    initialiserBibliotheque(manager);
  }
});

// ----------------------------
//  Assurez-vous d'avoir déjà
//  défini/laissé votre
//  BibliothequeManager dans
//  script.js (ou importé).
//  On présume donc que
//  BibliothequeManager.retourne
//  un tableau `this.livres`
//  où chaque livre est de la forme :
//  {
//    title:       string,
//    authors:     string,
//    status:      "À lire" | "En cours" | "Terminé" | "DNF",
//    note:        number,
//    startDate:   "YYYY-MM-DD" (ou "" si inexistant),
//    endDate:     "YYYY-MM-DD" (ou "" si inexistant),
//    genre:       string,
//    description: string,
//    cover:       string (URL ou "") 
//  }
// ----------------------------

document.addEventListener("DOMContentLoaded", () => {
  const manager = new BibliothequeManager();

  // 1) Charger les livres depuis get-livre.php
  manager.chargerLivres().then(() => {
    // 2) Dès que la liste est chargée, on remplit la section "Mes dernières lectures"
    afficherDernieresLectures(manager);
    if (document.getElementById("popup-edit")) {
  initialiserBibliotheque(manager);
}
  });


  // 3) Charger le menu commun (menu.html) s’il y a lieu
  const menuPlaceholder = document.getElementById("menu-placeholder");
  if (menuPlaceholder) {
    fetch("menu.html")
      .then(r => r.ok ? r.text() : Promise.reject("menu.html introuvable"))
      .then(html => menuPlaceholder.innerHTML = html)
      .catch(err => {
        console.warn("Impossible de charger menu.html :", err);
        menuPlaceholder.innerHTML = "<p>Menu non disponible.</p>";
      });
  }

  // 4) Si on est sur recherche.php, on appelle initialiserRecherche(manager)
  if (window.location.pathname.includes("recherche.php")) {
    initialiserRecherche(manager);
  }
  // 5) Si on est sur bibliotheque.php, on appelle initialiserBibliotheque(manager)
  if (window.location.pathname.includes("bibliotheque.php")) {
    initialiserBibliotheque(manager);
  }
  // (On ne veut PAS appeler initialiserBibliotheque sur index.php,
  //  on appelle juste afficherDernieresLectures plus haut.)
});




// ─── 3) LOGIQUE « RECHERCHE + POPUP ADD » (pour recherche.php) ──────────────────
function initialiserRecherche(manager) {
  const searchForm = document.getElementById("search-form");
  const resultDiv  = document.getElementById("result");

  // 3.a) Soumettre le formulaire → requête Google Books
  searchForm.addEventListener("submit", event => {
    event.preventDefault();
    const query = document.getElementById("search-input").value.trim();
    if (!query) {
      alert("Veuillez saisir un titre ou un auteur.");
      return;
    }

    resultDiv.innerHTML = "<p>Recherche en cours…</p>";
    fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&langRestrict=fr&maxResults=5`)
      .then(res => res.json())
      .then(data => {
        resultDiv.innerHTML = "";
        if (!data.items || data.items.length === 0) {
          resultDiv.innerHTML = "<p>Aucun livre trouvé en français. Essayez un autre titre.</p>";
          return;
        }
        data.items.forEach(item => {
          const book = item.volumeInfo;
          const bookDiv = document.createElement("div");
          bookDiv.classList.add("result-item");
          bookDiv.style.display = "flex";
          bookDiv.style.alignItems = "flex-start";
          bookDiv.style.padding = "12px";
          bookDiv.style.borderBottom = "1px solid var(--gray-200, #d1d5db)";
          bookDiv.innerHTML = `
            <div class="image-and-button" style="margin-right: 12px;">
              <img src="${book.imageLinks?.thumbnail || ""}" alt="Couverture" onerror="this.style.display='none'" 
                   style="width: 60px; height: 90px; object-fit: cover; border-radius: var(--radius-md,8px); box-shadow: var(--shadow-md);">
              <button class="add-button" style="
                      margin-top: 8px;
                      padding: 6px 12px;
                      background: var(--success-500, #10b981);
                      color: white;
                      border: none;
                      border-radius: var(--radius-md, 8px);
                      cursor: pointer;
                      font-size: 0.9rem;
                      font-weight: 500;
                    ">
                Ajouter
              </button>
            </div>
            <div class="book-content" style="flex:1;">
              <h3 style="margin:0 0 4px 0; font-size: 1.1rem;">${book.title || "Titre inconnu"}</h3>
              <h4 style="margin:0 0 8px 0; font-size: 0.95rem; color: var(--primary-600, #8b5cf6);">
                ${book.authors ? book.authors.join(", ") : "Auteur inconnu"}
              </h4>
              <p style="margin:0; color: var(--gray-600, #4b5563); font-size: 0.9rem; line-height:1.4;">
                ${book.description
                  ? book.description.substring(0, 200) + "…"
                  : "Pas de résumé disponible."}
              </p>
            </div>
          `;
          resultDiv.appendChild(bookDiv);

          // 3.b) Clique sur le bouton « Ajouter »
          const addButton = bookDiv.querySelector(".add-button");
          addButton.addEventListener("click", () => {
            // Construire l’objet temporaire
            const livreTemporaire = {
              title:       book.title || "Titre inconnu",
              authors:     book.authors ? book.authors.join(", ") : "Auteur inconnu",
              cover:       book.imageLinks?.thumbnail || "",
              description: book.description?.trim() || "Pas de résumé disponible.",
              genre:       Array.isArray(book.categories) && book.categories.length > 0
                            ? book.categories[0].trim()
                            : "Inconnu",
              status:      "À lire",
              note:        "",
              startDate:   "",
              endDate:     ""
            };
            manager.livreTemporaire = livreTemporaire;

            // Pré-remplir la popup « Ajouter »
            document.getElementById("popup-add-title").textContent   = livreTemporaire.title;
            document.getElementById("popup-add-authors").textContent = livreTemporaire.authors;

            const coverElt = document.getElementById("popup-add-cover-preview");
            if (livreTemporaire.cover) {
              coverElt.src = livreTemporaire.cover;
              coverElt.style.display = "block";
            } else {
              coverElt.style.display = "none";
            }

            document.getElementById("popup-add-genre").textContent       = livreTemporaire.genre;
            document.getElementById("popup-add-description").textContent = livreTemporaire.description;

            // Réinitialiser les champs statut/note/dates
            document.getElementById("popup-add-status").value = "À lire";
            document.getElementById("popup-add-note").value   = "";
            document.getElementById("popup-add-start").value  = "";
            document.getElementById("popup-add-end").value    = "";

            // Ouvrir la popup
            document.getElementById("popup-add").style.display = "flex";
          });
        });
      })
      .catch(err => {
        console.error("Erreur API Google Books :", err);
        resultDiv.innerHTML = "<p>Erreur lors de la recherche. Vérifiez votre connexion.</p>";
      });
  });


  // 3.c) Popup « Ajouter à ma bibliothèque » → fermeture / validation
  const popupAdd       = document.getElementById("popup-add");
  const popupAddClose  = document.getElementById("popup-add-close");
  const popupAddCancel = document.getElementById("popup-add-cancel");
  const popupAddSave   = document.getElementById("popup-add-save");

  // Fermer via la croix
  popupAddClose.addEventListener("click", () => {
    popupAdd.style.display = "none";
    manager.livreTemporaire = null;
  });
  // Fermer via « Annuler »
  popupAddCancel.addEventListener("click", () => {
    popupAdd.style.display = "none";
    manager.livreTemporaire = null;
  });

  // Lorsque l’utilisateur clique sur « Valider »
  popupAddSave.addEventListener("click", async () => {
    if (!manager.livreTemporaire) {
      alert("Aucun livre chargé !");
      return;
    }
    const statut    = document.getElementById("popup-add-status").value;
    const note      = document.getElementById("popup-add-note").value.trim();
    const startDate = document.getElementById("popup-add-start").value;
    const endDate   = document.getElementById("popup-add-end").value;

    // Validations métier :
    if (statut === "À lire" && (startDate || endDate)) {
      alert("Un livre 'À lire' ne doit pas avoir de date.");
      return;
    }
    if (statut === "En cours" && endDate) {
      alert("Un livre 'En cours' ne doit pas avoir de date de fin.");
      return;
    }
    if (statut === "Terminé" && (!startDate || !endDate)) {
      alert("Un livre 'Terminé' doit avoir date de début et de fin.");
      return;
    }
    if (statut === "DNF" && endDate) {
      alert("Un livre 'DNF' ne doit pas avoir de date de fin.");
      return;
    }

    // Mise à jour de l’objet temporaire
    manager.livreTemporaire.status    = statut;
    manager.livreTemporaire.note      = parseInt(note) || 0;
    manager.livreTemporaire.startDate = (statut === "Terminé") ? startDate : "";
    manager.livreTemporaire.endDate   = (statut === "Terminé") ? endDate : "";

    // Construire l’objet définitif pour l’API
    const livreFinal = {
    title:       manager.livreTemporaire.title,        // col `titre`
    authors:     manager.livreTemporaire.authors,      // col `auteur`
    cover:       manager.livreTemporaire.cover,        // col `couverture`
    description: manager.livreTemporaire.description,  // col `description`
    genre:       manager.livreTemporaire.genre,        // col `genre`
    status:      statut,                               // col `statut` en base
    note:        parseInt(note) || 0,                  // col `note`
    startDate:   (statut === "Terminé" ? startDate : ""), // col `date_debut`
    endDate:     (statut === "Terminé" ? endDate   : "")  // col `date_fin`
  };

    const success = await manager.ajouterLivre(livreFinal);
    if (success) {
      alert("Livre ajouté avec succès !");
      popupAdd.style.display = "none";
      manager.livreTemporaire = null;
      // On peut recharger la liste (optionnel)
      manager.chargerLivres();
    } else {
      alert("Erreur lors de l’ajout du livre (verifier la console).");
    }
  });
}



// ─── 4) LOGIQUE « BIBLIOTHÈQUE + POPUP EDIT » (pour bibliotheque.php) ──────────
function initialiserBibliotheque(manager) {
  const selectFiltre = document.getElementById("filtre-statut");
  const selectTri    = document.getElementById("tri-critere");

  // 4.a) Filtrer dès qu’on change de valeur
  selectFiltre.addEventListener("change", e => {
    manager.afficherLivresFiltres(e.target.value);
  });

  // 4.b) Trier dès qu’on change de critère
  selectTri.addEventListener("change", e => {
    manager.trierLivres(e.target.value);
  });

  // 4.c) Configuration de la popup « Modifier un livre »
  const popupEdit       = document.getElementById("popup-edit");
  const popupEditClose  = document.getElementById("popup-edit-close");
  const popupEditCancel = document.getElementById("popup-edit-cancel");

  // Fermer la popup via la croix
  popupEditClose.addEventListener("click", () => manager.fermerPopupEdit());
  // Fermer via « Annuler »
  popupEditCancel.addEventListener("click", () => manager.fermerPopupEdit());

  // Enregistrer → appeler manager.enregistrerModifications()
const popupEditSave = document.getElementById("popup-edit-save");
if (popupEditSave) {
  popupEditSave.addEventListener("click", async () => {
    console.log("🔔 clic sur Enregistrer détecté");
    await manager.enregistrerModifications();
  });
}


observer.observe(document.body, { childList: true, subtree: true });

  
  // 4.d) Exporter CSV
  const exportBtn = document.getElementById("export-csv");
  exportBtn.addEventListener("click", () => {
    const livres = JSON.parse(localStorage.getItem("bibliotheque")) || [];
    if (livres.length === 0) {
      alert("Aucun livre à exporter.");
      return;
    }
    const header = ["Titre", "Auteur(s)", "Statut", "Note", "Début", "Fin", "Genre", "Résumé"];
    const rows = livres.map(l => [
      l.title,
      l.authors,
      l.status,
      l.note || "",
      l.startDate || "",
      l.endDate || "",
      l.genre || "",
      (l.description || "").replace(/"/g, '""')
    ].map(val => `"${val}"`).join(","));
    const csvContent = [header.join(","), ...rows].join("\n");
    const blob       = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url        = URL.createObjectURL(blob);
    const link       = document.createElement("a");
    link.href  = url;
    link.download = "ma_bibliotheque.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });

  // 4.e) Importer CSV
  const importBtn     = document.getElementById("import-csv");
  const importTrigger = document.getElementById("import-trigger");
  importTrigger.addEventListener("click", () => importBtn.click());

  importBtn.addEventListener("change", async event => {
    const file = event.target.files[0];
    if (!file) {
      alert("Aucun fichier sélectionné.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async e => {
      try {
        const text  = new TextDecoder("utf-8")
                        .decode(e.target.result)
                        .normalize("NFC");
        const lines = text.trim().split("\n").map(l => l.replace(/\r/g, "").trim());
        const headers = lines.shift()
                              .split(",")
                              .map(h => h.replace(/"/g, "").trim());
        if (headers.length < 8) {
          alert("CSV invalide : entêtes manquantes.");
          return;
        }
        let livresActuels  = JSON.parse(localStorage.getItem("bibliotheque")) || [];
        let nouveauxAjoutes = 0;

        for (const line of lines) {
          const cols = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
          if (!cols || cols.length < 8) continue;
          const [titre, auteurs, statut, note, debut, fin, genre, resume] = cols
            .map(c => c.replace(/^"|"$/g, "").replace(/""/g, '"').trim());
          const existe = livresActuels.some(l =>
            l.title.toLowerCase() === titre.toLowerCase() &&
            l.authors.toLowerCase() === auteurs.toLowerCase()
          );
          if (existe) continue;

          // On essaie d’enrichir via Google Books
          const enrichi = await enrichirLivreViaAPI(titre, auteurs);
          const newBook = {
            title:       titre,
            authors:     auteurs,
            status:      statut || "À lire",
            note:        parseFloat(note) || 0,
            startDate:   debut || "",
            endDate:     fin || "",
            genre:       enrichi.genre || genre || "Inconnu",
            description: enrichi.description || resume || "Pas de résumé disponible.",
            cover:       enrichi.cover || ""
          };
          const ok = await manager.ajouterLivre(newBook);
          if (ok) {
            livresActuels.push(newBook);
            nouveauxAjoutes++;
          }
        }

        localStorage.setItem("bibliotheque", JSON.stringify(livresActuels));
        alert(`${nouveauxAjoutes} nouveau(x) livre(s) ajouté(s).`);
        manager.chargerLivres();
      } catch (err) {
        console.error("Erreur import CSV :", err);
        alert("Erreur lors de l’importation (voir console).");
      }
    };
    reader.readAsArrayBuffer(file);
  });

  // 4.f) Compléter les fiches manquantes (couverture/genre/description)
  const enrichBtn = document.getElementById("enrichir-fiches");
  enrichBtn.addEventListener("click", async () => {
    enrichBtn.disabled = true;
    for (let livre of manager.livres) {
      if (!livre.cover || livre.cover === "") {
        try {
          const enrichi = await enrichirLivreViaAPI(livre.title, livre.authors);
          if (enrichi.cover)       livre.cover       = enrichi.cover;
          if (enrichi.description) livre.description = enrichi.description;
          if (enrichi.genre)       livre.genre       = enrichi.genre;

          // Mettre à jour en base
          await fetch(`${API_BASE_URL}/modifier-livre.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              titre:      livre.title,
              auteur:     livre.authors,
              statut:     livre.status,
              note:       livre.note,
              date_debut: livre.startDate,
              date_fin:   livre.endDate
            })
          });
        } catch { /* on continue même en cas d’erreur */ }
      }
    }
    localStorage.setItem("bibliotheque", JSON.stringify(manager.livres));
    manager.afficherLivresFiltres(document.getElementById("filtre-statut").value || "Tous");
    enrichBtn.disabled = false;
    alert("Fiches complétées (si des données ont été trouvées).");
  });
}



// ─── 5) UTILITAIRE “ENRICHIR VIA GOOGLE BOOKS” ─────────────────────────────────
async function enrichirLivreViaAPI(titre, auteur) {
  try {
    const query = `${titre} ${auteur}`;
    const res   = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&langRestrict=fr&maxResults=1`);
    const data  = await res.json();
    const info  = data.items?.[0]?.volumeInfo;
    if (!info) return {};

    return {
      cover:       info.imageLinks?.thumbnail || "",
      description: info.description?.trim() || "Pas de résumé disponible.",
      genre:       Array.isArray(info.categories) && info.categories.length > 0
                    ? info.categories[0].trim()
                    : "Inconnu"
    };
  } catch (err) {
    console.error("Erreur enrichissement API :", err);
    return {};
  }
}

/**
 * Affiche dans la zone #derniers-livres les 5 livres "Terminé" 
 * les plus récents (triés par endDate décroissante).
 * Chaque carte montre couverture, titre, auteur, et date de fin (endDate).
 */
function afficherDernieresLectures(manager) {
  // 1) On ne garde que les livres terminés
  const livresTermines = manager.livres.filter(l => l.status === "Terminé");

  // 2) Tri par date de fin (endDate) décroissante
  livresTermines.sort((a, b) => {
    // Si l’un des deux n’a pas de endDate, on le pousse en fin de liste
    if (!a.endDate) return 1;
    if (!b.endDate) return -1;
    return new Date(b.endDate) - new Date(a.endDate);
  });

  // 3) On ne conserve que les 5 premiers (plus récents)
  const derniers = livresTermines.slice(0, 5);

  // 4) On vide l’élément HTML <div id="derniers-livres">
  const conteneur = document.getElementById("derniers-livres");
  if (!conteneur) return;  // si l’id n’existe pas, on arrête tout

  conteneur.innerHTML = "";

  // 5) S’il n’y a aucun livre terminé, on affiche un message
  if (derniers.length === 0) {
    conteneur.innerHTML = `
      <p style="color: var(--gray-600); text-align: center; width: 100%;">
        Vous n’avez pas encore terminé de livres.
      </p>
    `;
    return;
  }

  // 6) Pour chaque livre “Terminé”, on crée une “carte”
  derniers.forEach(livre => {
    // Créer l’élément <div class="grid-item"> pour la carte
    const card = document.createElement("div");
    card.classList.add("grid-item");

    // Construire le HTML de la carte en veillant à bien utiliser `livre.endDate || "–"`
    card.innerHTML = `
      <div class="cover-container">
        <img
          src="${livre.cover || ""}"
          alt="Couverture du livre"
          onerror="this.style.display='none'"
          class="book-cover"
        >
      </div>
      <div class="book-details">
        <p><strong class="label">Titre :</strong> ${livre.title}</p>
        <p><strong class="label">Auteur :</strong> ${livre.authors}</p>
        <p><strong class="label">Terminé le :</strong> ${livre.endDate || "–"}</p>
      </div>
    `;

  // Si vous souhaitez ouvrir la popup d’édition au clic sur la carte, décommentez :
    
    card.addEventListener("click", () => {
      // Pré-remplir la popup “Modifier” avec toutes les propriétés de “livre”
      document.getElementById("edit-cover").src           = livre.cover || "";
      document.getElementById("edit-title").textContent   = livre.title;
      document.getElementById("edit-authors").textContent = livre.authors;
      document.getElementById("edit-genre-text").textContent  = livre.genre;
      document.getElementById("edit-desc-text").textContent   = livre.description;
      document.getElementById("edit-status").value        = livre.status;
      document.getElementById("edit-note").value          = livre.note  || "";
      document.getElementById("edit-start").value         = livre.startDate  || "";
      document.getElementById("edit-end").value           = livre.endDate  || "";
      document.getElementById("edit-popup").style.display = "flex";
    });
    

    conteneur.appendChild(card);
  });
}
