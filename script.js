//
// ─── script.js (Version Optimisée) ────────────────────────────────────────
//
//  Ce fichier gère :
//   • recherche.php  → recherche Google Books + popup « Ajouter à ma bibliothèque »
//   • bibliotheque.php → affichage/filtre/tri + popup « Modifier un livre »
//   • index.php        → affichage dernières lectures + popup « Modifier un livre »
//

// ─── 0) DÉCLARATION UNIQUE DE LA BASE URL ─────────────────────────────────────────
const API_BASE_URL = "."; 

// ─── 1) CLASSE GLOBALE POUR LA BIBLIOTHÈQUE ─────────────────────────────────────
class BibliothequeManager {
  constructor() {
    this.livres = [];            // liste de tous les livres
    this.livreTemporaire = null; // utilisé lors de la recherche Google Books → popup « Ajouter »
    this.livreEnCours    = null; // utilisé lors de la page Bibliothèque → popup « Modifier »
  }

  // 1.a) Charger la liste des livres depuis get-livre.php (et stocker en localStorage)
  async chargerLivres() {
    try {
      const res  = await fetch(`${API_BASE_URL}/get-livre.php`);
      const data = await res.json();
      console.log("→ Données brutes reçues de get-livre.php :", data.livres);

      if (!data.success) throw new Error(data.message);

      this.livres = data.livres.map(item => ({
          id:          item.id, 
          title:       item.title,
          authors:     item.authors,
          status:      item.statut,
          note:        parseFloat(item.note) || 0,
          startDate:   item.startDate, // Note: get-livre.php utilise déjà les bons noms
          endDate:     item.endDate,   //
          genre:       item.genre,
          description: item.description,
          cover: item.cover || ""
        }));

      localStorage.setItem("bibliotheque", JSON.stringify(this.livres));

      // Si on est sur la page bibliotheque.php, on peut afficher immédiatement
      if (window.location.pathname.includes("bibliotheque.php")) {
        // [OPTIMISÉ] Appelle la nouvelle fonction unifiée
        this.actualiserBibliotheque();
      }
    } catch (err) {
      console.error("Erreur lors du chargement des livres :", err);
    }
  }

  // 1.b) [OPTIMISÉ] Gérer le filtre ET le tri en une seule fois
  actualiserBibliotheque() {
    const container = document.getElementById("library");
    if (!container) return; // N'existe que sur bibliotheque.php
    
    // Récupérer les valeurs actuelles du filtre et du tri
    const statutFiltre = document.getElementById("filtre-statut").value;
    const critereTri = document.getElementById("tri-critere").value;

    // 1. Filtrer
    let livresAffiches;
    if (statutFiltre && statutFiltre !== "Tous") {
        livresAffiches = this.livres.filter(l => l.status === statutFiltre);
    } else {
        livresAffiches = [...this.livres];
    }

    // 2. Trier (logique de tri de l'ancien 'trierLivres')
    switch (critereTri) {
        case "auteur":
            livresAffiches.sort((a, b) => a.authors.localeCompare(b.authors));
            break;
        case "note":
            livresAffiches.sort((a, b) => (b.note || 0) - (a.note || 0));
            break;
        case "genre":
            livresAffiches.sort((a, b) => (a.genre || '').localeCompare(b.genre || ''));
            break;
        case "titre":
            livresAffiches.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case "date-croissant":
            livresAffiches.sort((a, b) => {
                if (!a.endDate) return -1;
                if (!b.endDate) return 1;
                return new Date(a.endDate) - new Date(b.endDate);
            });
            break;
        case "date-decroissant":
            livresAffiches.sort((a, b) => {
                if (!a.endDate) return 1;
                if (!b.endDate) return -1;
                return new Date(b.endDate) - new Date(a.endDate);
            });
            break;
        default:
            // Par défaut, tri par titre si "titre" est sélectionné ou si rien n'est
            if (critereTri === "titre") {
                livresAffiches.sort((a, b) => a.title.localeCompare(b.title));
            }
            break;
    }

    // 3. Afficher
    this._renderBibliotheque(livresAffiches);
  }

  // 1.c) [NOUVEAU] Fonction privée pour "dessiner" la grille (factorisée)
  _renderBibliotheque(livresArray) {
    const container = document.getElementById("library");
    if (!container) return; 
    container.innerHTML = "";
    
    const self = this; // Garder la référence

    if (livresArray.length === 0) {
        container.innerHTML = "<p>Aucun livre trouvé pour ces critères.</p>";
        return;
    }

    // C'est le bloc de code qui était dupliqué
    livresArray.forEach(livre => {
        const div = document.createElement("div");
        const fullDesc = livre.description || "Pas de résumé disponible.";
        const maxChars = 500;
        const shortDesc = (fullDesc.length > maxChars)
            ? fullDesc.substring(0, maxChars).trim() + "…"
            : fullDesc;

        div.className = "grid-item";
        // HTML repris de votre script original
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
              </div>
              <button class="delete-button">Supprimer</button>
            </div>

            <div class="book-details">
              <p><strong class="label">Genre :</strong> ${livre.genre || 'N/A'}</p>
              <p><strong class="label">Note :</strong> ${livre.note || "Non noté"}</p>
              <p><strong class="label">Statut :</strong> ${livre.status}</p>
              <p class="description-text">${shortDesc || "Pas de résumé disponible."}</p>
            </div>
        `;

        // Écouteurs (identiques à avant)
        div.addEventListener("click", () => {
            self.ouvrirPopupEdit(livre);
        });

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


  // 1.d) Ouvrir la popup « Modifier un livre » (utilisé sur index.php et bibliotheque.php)
  // Cette fonction gère CORRECTEMENT les deux ID différents
  ouvrirPopupEdit(livre) {
    this.livreEnCours = livre;
    
    // CORRECTION : L'ID de la popup "edit" est différent
    // On doit gérer les deux cas.
    const popupId = document.getElementById("popup-edit") ? "popup-edit" : "edit-popup";
    const popupElt = document.getElementById(popupId);
    if (!popupElt) return;

    // Définir les préfixes d'ID en fonction de la popup trouvée
    const idPrefix = (popupId === "popup-edit") ? "popup-edit-" : "edit-";

    const coverElt = document.getElementById(`${idPrefix}cover`);
    if (coverElt) {
      if (livre.cover) {
        coverElt.src = livre.cover;
        coverElt.style.display = "block";
      } else {
        coverElt.style.display = "none";
      }
    }

    const titleElt   = document.getElementById(`${idPrefix}title`);
    const authorElt  = document.getElementById(`${idPrefix}authors`);
    const genreElt   = document.getElementById(`${idPrefix}genre-text`);
    const descElt    = document.getElementById(`${idPrefix}desc-text`);
    const statusElt  = document.getElementById(`${idPrefix}status`);
    const noteElt    = document.getElementById(`${idPrefix}note`);
    const startElt   = document.getElementById(`${idPrefix}start`);
    const endElt     = document.getElementById(`${idPrefix}end`);

    if (titleElt)  titleElt.textContent  = livre.title;
    if (authorElt) authorElt.textContent = livre.authors;
    if (genreElt)  genreElt.textContent  = livre.genre;
    if (descElt)   descElt.innerHTML     = livre.description;

    if (statusElt) statusElt.value = livre.status;
    if (noteElt)   noteElt.value   = livre.note || "";
    if (startElt)  startElt.value  = livre.startDate || "";
    if (endElt)    endElt.value    = livre.endDate || "";

    popupElt.style.display = "flex";
  }


  // 1.e) Fermer la popup « Modifier » et réinitialiser
  fermerPopupEdit() {
    const popupElt = document.getElementById("popup-edit") || document.getElementById("edit-popup");
    if (popupElt) {
      popupElt.style.display = "none";
    }
    this.livreEnCours = null;
  }

  // 1.f) Enregistrer les modifications d’un livre
  async enregistrerModifications() {
    if (!this.livreEnCours) return;

    const idPrefix = document.getElementById("popup-edit") ? "popup-edit-" : "edit-";

    const statut    = document.getElementById(`${idPrefix}status`).value;
    const note      = document.getElementById(`${idPrefix}note`).value;
    const startDate = document.getElementById(`${idPrefix}start`).value;
    const endDate   = document.getElementById(`${idPrefix}end`).value;

    // CONTRAINTES MÉTIER
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

    // Envoi vers le serveur
    try {
      const res = await fetch(`${API_BASE_URL}/modifier-livre.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          livre_id:   this.livreEnCours.id,
          statut:     statut,
          note:       note,
          date_debut: startDate,
          date_fin:   endDate
        })
      });
      const data = await res.json();
      
      if (!data.success) {
        console.warn("Erreur sur le serveur :", data.message);
        alert("Erreur serveur : " + data.message);
        return; 
      }

      // Le serveur a confirmé, MAINTENANT on met à jour l'objet local
      // pour correspondre EXACTEMENT à ce qui a été envoyé à la BDD
      this.livreEnCours.status    = statut;
      // Si la note est une chaîne vide, on stocke 0 ou null (cohérent avec parseFloat)
      // Si c'est un nombre, on le parse.
      this.livreEnCours.note      = note ? parseFloat(note) : 0; 
      this.livreEnCours.startDate = startDate || null; // Stocke null si la date est vide
      this.livreEnCours.endDate   = endDate || null;   // Stocke null si la date est vide
      
      localStorage.setItem("bibliotheque", JSON.stringify(this.livres));

      // [OPTIMISÉ] Rafraîchir la bonne section
      if (document.getElementById("library")) {
          // Si on est sur bibliotheque.php, rafraîchir la grille
          this.actualiserBibliotheque();
      } 
      if (document.getElementById("derniers-livres")) {
          // Si on est sur index.php, rafraîchir les dernières lectures
          afficherDernieresLectures(this);
      }

      this.fermerPopupEdit();

    } catch (err) {
      console.error("Erreur communication serveur :", err);
      alert("Impossible de contacter le serveur. Vos modifications n'ont pas été enregistrées.");
    }
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
  * Supprime un livre.
  */
  async supprimerLivre(livre) {
    try {
      // 1) Appeler l’API D'ABORD
      const res = await fetch(`${API_BASE_URL}/supprimer-livre.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          livre_id: livre.id // On envoie l'ID
        })
      });
      const data = await res.json();

      if (!data.success) {
        console.warn("Erreur suppression serveur :", data.message);
        alert("Le livre n'a pas pu être supprimé.");
        return;
      }

      // 2) SI C'EST OK, mettre à jour le JS
      this.livres = this.livres.filter(l => l.id !== livre.id);
      localStorage.setItem("bibliotheque", JSON.stringify(this.livres));

    } catch (err) {
      console.error("Erreur réseau suppression :", err);
      alert("Erreur de connexion lors de la suppression.");
    }

    // 3) [OPTIMISÉ] Réafficher la liste mise à jour
    this.actualiserBibliotheque();
  }
}



// ─── 2) INITIALISATION LORSQUE LE DOM EST CHARGÉ ─────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  
  // 1) Créer UNE SEULE instance du manager
  const manager = new BibliothequeManager();

  // 2) Charger le menu (une seule fois)
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

  // 3) Charger les livres (une seule fois)
  manager.chargerLivres().then(() => {
      // 4) Une fois les livres chargés, initialiser les sections spécifiques
      const page = window.location.pathname;

      if (page.includes("index.php")) {
          // Si on est sur le tableau de bord
          afficherDernieresLectures(manager);
          initialiserPopupEdition(manager); // Attacher les écouteurs pour la popup
      }
      else if (page.includes("recherche.php")) {
          // Si on est sur la recherche
          initialiserRecherche(manager);
      }
      else if (page.includes("bibliotheque.php")) {
          // Si on est sur la bibliothèque
          initialiserBibliotheque(manager);
          initialiserPopupEdition(manager); // Attacher les écouteurs pour la popup
      }
  });
});

// ---------------------------------
// FONCTION HELPER pour la popup "Edit"
// (car elle est sur index.php ET bibliotheque.php)
// ---------------------------------
function initialiserPopupEdition(manager) {
    // Gère les deux ID possibles
    const popupId = document.getElementById("popup-edit") ? "popup-edit" : "edit-popup";
    const popupElt = document.getElementById(popupId);
    if (!popupElt) return;

    const idPrefix = (popupId === "popup-edit") ? "popup-edit-" : "edit-";

    const popupEditClose  = document.getElementById(`${idPrefix}close`);
    const popupEditCancel = document.getElementById(`${idPrefix}cancel`);
    const popupEditSave   = document.getElementById(`${idPrefix}save`);

    if (popupEditClose) {
        popupEditClose.addEventListener("click", () => manager.fermerPopupEdit());
    }
    if (popupEditCancel) {
        popupEditCancel.addEventListener("click", () => manager.fermerPopupEdit());
    }
    if (popupEditSave) {
        popupEditSave.addEventListener("click", async () => {
            console.log("🔔 clic sur Enregistrer détecté");
            await manager.enregistrerModifications();
        });
    }
}


// ─── 3) LOGIQUE « RECHERCHE + POPUP ADD » (pour recherche.php) ──────────────────
function initialiserRecherche(manager) {
  const searchForm = document.getElementById("search-form");
  const resultDiv  = document.getElementById("result");
  if (!searchForm) return; 

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
          bookDiv.innerHTML = `
            <div class="image-and-button">
              <img src="${book.imageLinks?.thumbnail || ""}" alt="Couverture" onerror="this.style.display='none'">
              <button class="add-button">Ajouter</button>
            </div>
            <div class="book-content">
              <h3>${book.title || "Titre inconnu"}</h3>
              <h4>${book.authors ? book.authors.join(", ") : "Auteur inconnu"}</h4>
              <p>${book.description ? book.description.substring(0, 200) + "…" : "Pas de résumé disponible."}</p>
            </div>
          `;
          resultDiv.appendChild(bookDiv);

          // 3.b) Clique sur le bouton « Ajouter »
          const addButton = bookDiv.querySelector(".add-button");
          addButton.addEventListener("click", () => {
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

            // Réinitialiser les champs
            document.getElementById("popup-add-status").value = "À lire";
            document.getElementById("popup-add-note").value   = "";
            document.getElementById("popup-add-start").value  = "";
            document.getElementById("popup-add-end").value    = "";

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

  // Gérer la fermeture
  const closeAddPopup = () => {
    popupAdd.style.display = "none";
    manager.livreTemporaire = null;
  };
  popupAddClose.addEventListener("click", closeAddPopup);
  popupAddCancel.addEventListener("click", closeAddPopup);

  // Gérer la validation
  popupAddSave.addEventListener("click", async () => {
    if (!manager.livreTemporaire) {
      alert("Aucun livre chargé !");
      return;
    }
    const statut    = document.getElementById("popup-add-status").value;
    const note      = document.getElementById("popup-add-note").value.trim();
    const startDate = document.getElementById("popup-add-start").value;
    const endDate   = document.getElementById("popup-add-end").value;

    // Validations métier
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

    // Construire l’objet définitif pour l’API
    const livreFinal = {
      title:       manager.livreTemporaire.title,
      authors:     manager.livreTemporaire.authors,
      cover:       manager.livreTemporaire.cover,
      description: manager.livreTemporaire.description,
      genre:       manager.livreTemporaire.genre,
      status:      statut,
      note:        parseInt(note) || 0,
      startDate:   startDate,
      endDate:     endDate
    };

    const success = await manager.ajouterLivre(livreFinal);
    if (success) {
      alert("Livre ajouté avec succès !");
      closeAddPopup();
      manager.chargerLivres(); // Recharger la liste pour la synchro
    } else {
      alert("Erreur lors de l’ajout du livre (verifier la console).");
    }
  });
}



// ─── 4) LOGIQUE « BIBLIOTHÈQUE » (pour bibliotheque.php) ──────────
function initialiserBibliotheque(manager) {
  const selectFiltre = document.getElementById("filtre-statut");
  const selectTri    = document.getElementById("tri-critere");
  
  if (!selectFiltre) return; // S'arrêter si on n'est pas sur la bonne page

  // 4.a) & 4.b) [OPTIMISÉ] Filtrer et Trier
  // Les deux appellent la même fonction qui gère tout
  selectFiltre.addEventListener("change", () => {
    manager.actualiserBibliotheque();
  });
  selectTri.addEventListener("change", () => {
    manager.actualiserBibliotheque();
  });
  
  // 4.d) Exporter CSV
  const exportBtn = document.getElementById("export-csv");
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      const livres = manager.livres; // Exporter la liste complète
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
  }

  // 4.e) Importer CSV
  const importBtn     = document.getElementById("import-csv");
  const importTrigger = document.getElementById("import-trigger");
  if (importTrigger) {
    importTrigger.addEventListener("click", () => importBtn.click());
  }
  if (importBtn) {
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
          if (lines.length <= 1) {
            alert("Fichier CSV vide ou invalide.");
            return;
          }
          const headers = lines.shift()
                                .split(",")
                                .map(h => h.replace(/"/g, "").trim());
          if (headers.length < 8) {
            alert("CSV invalide : entêtes manquantes.");
            return;
          }
          
          let nouveauxAjoutes = 0;
          let livresActuels = manager.livres; // Utiliser la liste en mémoire

          for (const line of lines) {
            const cols = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
            if (!cols || cols.length < 8) continue;
            const [titre, auteurs, statut, note, debut, fin, genre, resume] = cols
              .map(c => c.replace(/^"|"$/g, "").replace(/""/g, '"').trim());
            
            if (!titre || !auteurs) continue; // Titre et auteur min requis

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
              nouveauxAjoutes++;
            }
          }

          alert(`${nouveauxAjoutes} nouveau(x) livre(s) ajouté(s).`);
          // Recharger tout pour être synchro
          await manager.chargerLivres();
          // manager.trierLivres(selectTri.value); // ANCIEN
          manager.actualiserBibliotheque(); // NOUVEAU

        } catch (err) {
          console.error("Erreur import CSV :", err);
          alert("Erreur lors de l’importation (voir console).");
        } finally {
          event.target.value = null;
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }

  // 4.f) Compléter les fiches manquantes
  const enrichBtn = document.getElementById("enrichir-fiches");
  if (enrichBtn) {
    enrichBtn.addEventListener("click", async () => {
      enrichBtn.disabled = true;
      enrichBtn.textContent = "Enrichissement...";
      
      for (let livre of manager.livres) {
        if (!livre.cover && livre.status !== "À lire") {
          try {
            const enrichi = await enrichirLivreViaAPI(livre.title, livre.authors);
            
            if (enrichi.cover) livre.cover = enrichi.cover;
            if (enrichi.description && livre.description === "Pas de résumé disponible.") livre.description = enrichi.description;
            if (enrichi.genre && livre.genre === "Inconnu") livre.genre = enrichi.genre;

            // Mettre à jour en base
            await fetch(`${API_BASE_URL}/modifier-livre.php`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                livre_id:   livre.id,
                statut:     livre.status,
                note:       livre.note,
                date_debut: livre.startDate,
                date_fin:   livre.endDate
              })
            });
          } catch(err) { 
             console.warn("Erreur enrichissement pour", livre.title, err);
          }
        }
      }
      
      localStorage.setItem("bibliotheque", JSON.stringify(manager.livres));
      // manager.afficherLivresFiltres(selectFiltre.value || "Tous"); // ANCIEN
      // manager.trierLivres(selectTri.value); // ANCIEN
      manager.actualiserBibliotheque(); // NOUVEAU
      
      enrichBtn.disabled = false;
      enrichBtn.textContent = "Compléter";
      alert("Fiches complétées (si des données ont été trouvées).");
    });
  }
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
 * C'est cette fonction qui remplace 'get-dernier-livres.php'
 */
function afficherDernieresLectures(manager) {
  const conteneur = document.getElementById("derniers-livres");
  if (!conteneur) return;  

  // 1) On ne garde que les livres terminés
  const livresTermines = manager.livres.filter(l => l.status === "Terminé");

  // 2) Tri par date de fin (endDate) décroissante
  livresTermines.sort((a, b) => {
    if (!a.endDate) return 1;
    if (!b.endDate) return -1;
    return new Date(b.endDate) - new Date(a.endDate);
  });

  // 3) On ne conserve que les 5 premiers (plus récents)
  const derniers = livresTermines.slice(0, 5);

  conteneur.innerHTML = ""; // Vider

  if (derniers.length === 0) {
    conteneur.innerHTML = `
      <p style="color: var(--gray-600); text-align: center; width: 100%;">
        Vous n’avez pas encore terminé de livres.
      </p>
    `;
    return;
  }

  // 5) Pour chaque livre “Terminé”, on crée une “carte”
  derniers.forEach(livre => {
    const card = document.createElement("div");
    card.className = "grid-item"; 

    card.innerHTML = `
      <img
        src="${livre.cover || ""}"
        alt="Couverture"
        onerror="this.style.display='none'"
        style="width: 60px; height: 90px; border-radius: 8px; object-fit: cover;"
      >
      <div class="book-info">
        <p>${livre.title}</p>
        <p>${livre.authors}</p>
        <p>Terminé le : ${livre.endDate || "–"}</p>
      </div>
    `;

    // Rendre la carte cliquable pour ouvrir la popup d'édition
    card.addEventListener("click", () => {
      manager.ouvrirPopupEdit(livre);
    });
    
    conteneur.appendChild(card);
  });
}