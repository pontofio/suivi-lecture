//
// ─── script.js (Version Corrigée Complète) ────────────────────────────────────────
//
//  Ce fichier gère :
//   • recherche.php  → recherche Google Books + popup « Ajouter à ma bibliothèque »
//   • bibliotheque.php → affichage/filtre/tri + popup « Modifier un livre »
//   • index.php        → affichage dernières lectures + popup « Modifier un livre »
//


// ─── 0) DÉCLARATION UNIQUE DE LA BASE URL ─────────────────────────────────────────
// CORRECTION : Chemin relatif pour fonctionner localement ET en production
const API_BASE_URL = "."; 
let activeCharts = {}; // Pour stocker et détruire les anciens graphiques



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
      const res  = await fetch(`${API_BASE_URL}/api/get-livres.php`);
      const data = await res.json();
      console.log("→ Données brutes reçues de get-livre.php :", data.livres);

      if (!data.success) throw new Error(data.message);

      this.livres = data.livres.map(item => ({
          // CORRECTION : S'assurer que l'ID est bien récupéré
          id:          item.id, 
          title:       item.title,
          authors:     item.authors,
          status:      item.statut,
          note:        parseFloat(item.note) || 0,
          startDate:   item.startDate, 
          endDate:     item.endDate,
          genre:       item.genre,
          description: item.description,
          cover: item.cover || ""
        }));

      localStorage.setItem("bibliotheque", JSON.stringify(this.livres));

      // Si on est sur la page bibliotheque.php, on peut afficher immédiatement
      // (L'initialisation sur index.php se fait dans le DOMContentLoaded)
      if (window.location.pathname.includes("bibliotheque.php")) {
        this.afficherLivresFiltres("Tous");
      }
    } catch (err) {
      console.error("Erreur lors du chargement des livres :", err);
    }
  }
// Nouvelle méthode pour générer le HTML d'un livre (avec étoiles !)
  creerCarteLivre(livre) {
    const div = document.createElement("div");
    div.className = "grid-item";

    // 1. Gestion du résumé (nettoyage des balises HTML + raccourcissement)
    const rawDesc = livre.description || "Pas de résumé disponible.";
    // On retire les balises HTML éventuelles pour éviter de casser l'affichage
    const textDesc = rawDesc.replace(/<[^>]*>?/gm, ''); 
    const shortDesc = (textDesc.length > 150) 
      ? textDesc.substring(0, 150).trim() + "…" 
      : textDesc;

    // 2. Génération des étoiles
    let etoilesHtml = '<span style="color:var(--gray-400); font-size:0.9rem;">Non noté</span>';
    if (livre.note > 0) {
      etoilesHtml = "";
      for (let i = 1; i <= 5; i++) {
        // Couleur or si active, gris sinon
        const color = i <= livre.note ? "var(--warning-500)" : "var(--gray-300)";
        etoilesHtml += `<span style="color:${color}; font-size:1.2rem;">★</span>`;
      }
    }

    // 3. Construction du HTML
    div.innerHTML = `
      <div class="cover-container">
        <div class="cover-info-row">
          <img src="${livre.cover || ""}" alt="Couverture" onerror="this.style.display='none'" class="book-cover">
          <div class="title-author">
            <p class="book-title">${livre.title}</p>
            <p class="book-author">${livre.authors}</p>
          </div>
        </div>
        <button class="delete-button">Supprimer</button>
      </div>

      <div class="book-details">
        <p><strong class="label">Genre :</strong> ${livre.genre || 'N/A'}</p>
        <p style="display:flex; align-items:center; gap:5px;">
           <strong class="label">Note :</strong> ${etoilesHtml}
        </p>
        <p><strong class="label">Statut :</strong> ${livre.status}</p>
        <p class="description-text">${shortDesc}</p>
      </div>
    `;

    // 4. Ajout des événements (Click & Supprimer)
    div.addEventListener("click", () => this.ouvrirPopupEdit(livre));

    const deleteBtn = div.querySelector(".delete-button");
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      // On utilise votre nouvelle popup si vous voulez, ou le confirm classique
      if (confirm("Voulez-vous vraiment supprimer ce livre ?")) {
        this.supprimerLivre(livre);
      }
    });

    return div;
  }

  // Helper pour créer une carte de résultat (Recherche Google ou Suggestion)
  creerCarteGoogle(googleBookItem) {
    const info = googleBookItem.volumeInfo;
    const div = document.createElement("div");
    div.classList.add("result-item");

    // HTML de la carte
    div.innerHTML = `
      <div class="image-and-button">
        <img src="${info.imageLinks?.thumbnail || ""}" alt="Couverture" onerror="this.style.display='none'">
        <button class="add-button">Ajouter</button>
      </div>
      <div class="book-content">
        <h3>${info.title || "Titre inconnu"}</h3>
        <h4>${info.authors ? info.authors.join(", ") : "Auteur inconnu"}</h4>
        <p>${info.description ? info.description.substring(0, 200) + "…" : "Pas de résumé disponible."}</p>
      </div>
    `;

    // Gestion du clic "Ajouter"
    const btn = div.querySelector(".add-button");
    btn.addEventListener("click", () => {
      // Préparation de l'objet temporaire
      this.livreTemporaire = {
        title:       info.title || "Titre inconnu",
        authors:     info.authors ? info.authors.join(", ") : "Auteur inconnu",
        cover:       info.imageLinks?.thumbnail || "",
        description: info.description?.trim() || "Pas de résumé disponible.",
        genre:       Array.isArray(info.categories) && info.categories.length > 0
                      ? info.categories[0].trim() : "Inconnu",
        status:      "À lire",
        note:        "",
        startDate:   "",
        endDate:     ""
      };

      // Remplissage de la popup (On reprend votre logique existante)
      document.getElementById("popup-add-title").textContent   = this.livreTemporaire.title;
      document.getElementById("popup-add-authors").textContent = this.livreTemporaire.authors;
      
      const coverElt = document.getElementById("popup-add-cover-preview");
      if (this.livreTemporaire.cover) {
        coverElt.src = this.livreTemporaire.cover;
        coverElt.style.display = "block";
      } else {
        coverElt.style.display = "none";
      }

      document.getElementById("popup-add-genre").textContent       = this.livreTemporaire.genre;
      document.getElementById("popup-add-description").textContent = this.livreTemporaire.description;
      
      // Reset des champs
      document.getElementById("popup-add-status").value = "À lire";
      document.getElementById("popup-add-note").value   = "";
      
      // Appel de votre fonction magique pour griser les dates si besoin
      if (typeof activerGestionDatesIntelligente === "function") {
         document.getElementById("popup-add-end").value = ""; 
         activerGestionDatesIntelligente("popup-add-");
      }

      document.getElementById("popup-add").style.display = "flex";
    });

    return div;
  }

  // 1.b) Afficher / filtrer (statut) ← utilisé dans bibliotheque.php
  afficherLivresFiltres(statut) {
    
    const container = document.getElementById("library");

    if (!container) return; // N'existe que sur bibliotheque.php
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
      // On appelle notre nouvelle méthode unique
      const carte = this.creerCarteLivre(livre);
      container.appendChild(carte);
    });
  }

  // 1.c) Trier (critère) ← utilisé dans bibliotheque.php
  trierLivres(critere) {
    const container = document.getElementById("library");
    if (!container) return;

    const self = this;
    const statutFiltre = document.getElementById("filtre-statut").value;

    // On part des livres déjà filtrés
    let sorted;
    if (statutFiltre && statutFiltre !== "Tous") {
      sorted = this.livres.filter(l => l.status === statutFiltre);
    } else {
      sorted = [...this.livres];
    }

    switch (critere) {
      case "auteur":
        sorted.sort((a, b) => a.authors.localeCompare(b.authors));
        break;
      case "note":
        sorted.sort((a, b) => (b.note || 0) - (a.note || 0));
        break;
      case "genre":
        sorted.sort((a, b) => (a.genre || '').localeCompare(b.genre || ''));
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

    // On vide le conteneur et on ré-affiche les livres triés
    container.innerHTML = "";
    sorted.forEach(livre => {
      const carte = this.creerCarteLivre(livre);
      container.appendChild(carte);
    });
  }


  // 1.d) Ouvrir la popup « Modifier un livre » (utilisé sur index.php et bibliotheque.php)
  ouvrirPopupEdit(livre) {
    this.livreEnCours = livre;
    
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
    if (descElt)   descElt.innerHTML     = livre.description; // innerHTML au lieu de textContent pour les résumés

    if (statusElt) statusElt.value = livre.status;
    if (noteElt)   noteElt.value   = livre.note || "";
    if (startElt)  startElt.value  = livre.startDate || "";
    if (endElt)    endElt.value    = livre.endDate || "";

    popupElt.style.display = "flex";

    activerGestionDatesIntelligente(idPrefix);
  }


  // 1.e) Fermer la popup « Modifier » et réinitialiser
  fermerPopupEdit() {
    // CORRECTION : Gérer les deux ID de popup possibles
    const popupElt = document.getElementById("popup-edit") || document.getElementById("edit-popup");
    if (popupElt) {
      popupElt.style.display = "none";
    }
    this.livreEnCours = null;
  }


  
  // 1.f) Enregistrer les modifications d’un livre
  // CORRECTION : Fonction "async" pour attendre la réponse du serveur
  async enregistrerModifications() {
    if (!this.livreEnCours) return;

    // CORRECTION : Gérer les deux ID de popup possibles
    const idPrefix = document.getElementById("popup-edit") ? "popup-edit-" : "edit-";

    const statut    = document.getElementById(`${idPrefix}status`).value;
    const note      = document.getElementById(`${idPrefix}note`).value;
    const startDate = document.getElementById(`${idPrefix}start`).value;
    const endDate   = document.getElementById(`${idPrefix}end`).value;

    // CONTRAINTES MÉTIER
    if (statut === "À lire" && (startDate || endDate)) {
      afficherMessage("Un livre 'À lire' ne doit pas avoir de date de début ou de fin.");
      return;
    }
    if (statut === "En cours" && endDate) {
      afficherMessage("Un livre 'En cours' ne doit pas avoir de date de fin.");
      return;
    }
    if (statut === "Terminé" &&  !endDate) {
      afficherMessage("Un livre 'Terminé' doit avoir une date de fin.");
      return;
    }
    if (statut === "DNF" && endDate) {
      afficherMessage("Un livre 'DNF' ne doit pas avoir de date de fin.");
      return;
    }

    // Envoi vers le serveur pour mise à jour en base
    try {
      const res = await fetch(`${API_BASE_URL}/api/modifier-livre.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          livre_id:   this.livreEnCours.id, // L'ID est crucial
          statut:     statut,
          note:       note,
          date_debut: startDate,
          date_fin:   endDate
        })
      });
      const data = await res.json();
      
      // Si le serveur dit non, on alerte et on s'arrête
      if (!data.success) {
        console.warn("Erreur sur le serveur :", data.message);
        afficherMessage("Erreur serveur : " + data.message);
        return; 
      }

      // Le serveur a confirmé, MAINTENANT on met à jour l'objet local
      this.livreEnCours.status    = statut;
      this.livreEnCours.note      = parseInt(note) || 0;
      this.livreEnCours.startDate = startDate;
      this.livreEnCours.endDate   = endDate;
      
      localStorage.setItem("bibliotheque", JSON.stringify(this.livres));

      // ==========================================================
      // CORRECTION : Rafraîchir la bonne section de la bonne page
      // ==========================================================
      if (document.getElementById("library")) {
          // Si on est sur bibliotheque.php, rafraîchir la grille
          this.afficherLivresFiltres(document.getElementById("filtre-statut").value || "Tous");
      } 
      
      if (document.getElementById("derniers-livres")) {
          // Si on est sur index.php, rafraîchir TOUT le tableau de bord
          mettreAJourChallenge(this.livres);
          initialiserGraphiqueMois(this.livres);
          initialiserGraphiqueAnnee(this.livres);
          initialiserGraphiqueGenres(this.livres);
          afficherDernieresLectures(this); // 'this' est le 'manager'
      }
      // ==========================================================

      this.fermerPopupEdit();

    } catch (err) {
      console.error("Erreur communication serveur :", err);
      afficherMessage("Impossible de contacter le serveur. Vos modifications n'ont pas été enregistrées.");
    }
  }

  // 1.g) Ajouter un livre en base (pop « Ajouter ») ← utilisé sur recherche.php
  async ajouterLivre(bookData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ajouter-livre.php`, {
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
  * CORRECTION : Attend la réponse du serveur avant de mettre à jour l'interface.
  */
  async supprimerLivre(livre) {
    try {
      // 1) Appeler l’API D'ABORD
      const res = await fetch(`${API_BASE_URL}/api/supprimer-livre.php`, {
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
        afficherMessage("Le livre n'a pas pu être supprimé.");
        return;
      }

      // 2) SI C'EST OK, mettre à jour le JS
      this.livres = this.livres.filter(l => l.id !== livre.id);
      localStorage.setItem("bibliotheque", JSON.stringify(this.livres));

    } catch (err) {
      console.error("Erreur réseau suppression :", err);
      afficherMessage("Erreur de connexion lors de la suppression.");
    }

    // 3) Réafficher la liste mise à jour (en tenant compte du filtre actuel)
    const filtre = document.getElementById("filtre-statut")?.value || "Tous";
    this.afficherLivresFiltres(filtre);
  }
}



// ─── 2) INITIALISATION LORSQUE LE DOM EST CHARGÉ ─────────────────────────────────
// CORRECTION : Un seul écouteur pour gérer toutes les pages
document.addEventListener("DOMContentLoaded", async () => {
  
  // 1) Créer UNE SEULE instance du manager
  const manager = new BibliothequeManager();

  // 2) Charger le menu (attendre qu'il soit inséré)
  let menuLoadPromise = Promise.resolve();
  const menuPlaceholder = document.getElementById("menu-placeholder");
  if (menuPlaceholder) {
    fetch("includes/menu.html")
      .then(r => r.ok ? r.text() : Promise.reject("menu.html introuvable"))
      .then(html => {
        menuPlaceholder.innerHTML = html;
      })
      .catch(err => {
        console.warn("Impossible de charger menu.html :", err);
        menuPlaceholder.innerHTML = "<p>Menu non disponible.</p>";
      });
  }

  // 3) Charger les livres (une seule fois)
  await manager.chargerLivres();
  
  // 4) Attendre que le menu soit chargé avant d'initialiser les boutons
  await menuLoadPromise;
  
  // 5) Une fois les livres ET le menu chargés, initialiser les sections spécifiques
  const page = window.location.pathname;

  if (page.includes("index.php")) {
      // Si on est sur le tableau de bord
      initialiserPopupEdition(manager); // Attacher les écouteurs pour la popup
      
      // Mettre à jour tous les composants
      mettreAJourChallenge(manager.livres);
      initialiserGraphiqueMois(manager.livres);
      initialiserGraphiqueAnnee(manager.livres);
      initialiserGraphiqueGenres(manager.livres);
      afficherDernieresLectures(manager); // 'manager' est disponible ici
      
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
  
  // 6) Initialiser les boutons d'import/export du menu (disponibles partout)
  initialiserBoutonsMenu(manager);
});



async function chargerSuggestions(manager) {
  const resultDiv = document.getElementById("result");
  // On ne lance la suggestion que si la zone de résultat est vide (au chargement)
  if (!resultDiv || resultDiv.innerHTML.trim() !== "") return;

  // 1. Trouver les livres aimés (Terminé + Note >= 4)
  const favoris = manager.livres.filter(l => l.status === "Terminé" && l.note >= 4);

  if (favoris.length === 0) {
    resultDiv.innerHTML = `<p style="text-align:center; color:var(--gray-500); margin-top:2rem;">
      <em>Notez vos lectures terminées (4 ou 5 étoiles) pour voir apparaître ici des suggestions personnalisées !</em>
    </p>`;
    return;
  }

  // 2. En choisir un au hasard
  const livreInspirant = favoris[Math.floor(Math.random() * favoris.length)];
  const auteurCible = livreInspirant.authors.split(",")[0].trim(); // On prend le 1er auteur

  // 3. Afficher un message d'attente
  resultDiv.innerHTML = `<p style="text-align:center; color:var(--gray-500);">Recherche de pépites similaires à <strong>${livreInspirant.title}</strong>...</p>`;

  try {
    // 4. Interroger Google Books par auteur
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=inauthor:"${encodeURIComponent(auteurCible)}"&langRestrict=fr&maxResults=4`);
    const data = await res.json();

    resultDiv.innerHTML = ""; // On vide le loader

    if (data.items && data.items.length > 0) {
      // Titre de la section
      const titreSection = document.createElement("h2");
      titreSection.style.cssText = "font-size:1.5rem; text-align:center; margin-bottom:1.5rem; color:var(--primary-600);";
      titreSection.innerHTML = `Parce que vous avez aimé <span style="color:var(--gray-800)">${livreInspirant.title}</span>`;
      resultDiv.appendChild(titreSection);

      // Afficher les livres
      data.items.forEach(item => {
        // Éviter de proposer le livre qu'on a déjà lu
        const titreTrouve = (item.volumeInfo.title || "").toLowerCase();
        const dejaLu = manager.livres.some(l => l.title.toLowerCase() === titreTrouve);

        if (!dejaLu) {
          const carte = manager.creerCarteGoogle(item); // On utilise la nouvelle méthode helper
          resultDiv.appendChild(carte);
        }
      });
      
      if (resultDiv.childElementCount <= 1) {
          resultDiv.innerHTML += "<p style='text-align:center'>Pas d'autres suggestions trouvées pour cet auteur.</p>";
      }
    } else {
      resultDiv.innerHTML = "<p style='text-align:center'>Pas de suggestions trouvées pour le moment.</p>";
    }
  } catch (e) {
    console.error("Erreur suggestions", e);
    resultDiv.innerHTML = "";
  }
}

// ---------------------------------
// FONCTION HELPER pour la popup "Edit"
// (car elle est sur index.php ET bibliotheque.php)
// ---------------------------------
function initialiserPopupEdition(manager) {
    // S'assurer que la popup existe sur la page
    const popupId = document.getElementById("popup-edit") ? "popup-edit" : "edit-popup";
    const popupElt = document.getElementById(popupId);
    if (!popupElt) return;

    // Définir les préfixes d'ID en fonction de la popup trouvée
    const idPrefix = (popupId === "popup-edit") ? "popup-edit-" : "edit-";

    const popupEditClose  = document.getElementById(`${idPrefix}close`);
    const popupEditCancel = document.getElementById(`${idPrefix}cancel`);
    const popupEditSave   = document.getElementById(`${idPrefix}save`);

    // Fermer la popup via la croix
    if (popupEditClose) {
        popupEditClose.addEventListener("click", () => manager.fermerPopupEdit());
    }
    // Fermer via « Annuler »
    if (popupEditCancel) {
        popupEditCancel.addEventListener("click", () => manager.fermerPopupEdit());
    }
    // Enregistrer → appeler manager.enregistrerModifications()
    if (popupEditSave) {
        popupEditSave.addEventListener("click", async () => {
            console.log("🔔 clic sur Enregistrer détecté");
            await manager.enregistrerModifications();
        });
    }
}

// --- FONCTION UTILITAIRE POUR REMPLACER ALERT() ---
function afficherMessage(message, type = "info") {
  // 1. Vérifier si la popup existe déjà dans le DOM
  let popup = document.getElementById("custom-message-popup");

  // 2. Si non, on la crée dynamiquement
  if (!popup) {
    const div = document.createElement("div");
    div.id = "custom-message-popup";
    div.className = "popup"; // On réutilise votre classe CSS existante
    div.style.display = "none";
    div.innerHTML = `
      <div class="popup-content" style="max-width: 400px; text-align: center; padding: 30px;">
        <span class="close-button" id="msg-close" style="position: absolute; top: 10px; right: 10px;">&times;</span>
        <h2 id="msg-title" style="margin-top: 0; font-family: 'Playfair Display', serif;"></h2>
        <p id="msg-text" style="font-size: 1rem; color: var(--gray-700); margin: 20px 0; line-height: 1.5;"></p>
        <button id="msg-ok" style="margin: 0 auto;">Compris</button>
      </div>
    `;
    document.body.appendChild(div);
    popup = div;

    // Gestion des événements de fermeture
    const closeBtn = popup.querySelector("#msg-close");
    const okBtn = popup.querySelector("#msg-ok");
    const fermer = () => popup.style.display = "none";

    closeBtn.addEventListener("click", fermer);
    okBtn.addEventListener("click", fermer);
    popup.addEventListener("click", (e) => {
      if (e.target === popup) fermer();
    });
  }

  // 3. Configurer le contenu selon le type (erreur, succès, info)
  const titleEl = popup.querySelector("#msg-title");
  const textEl = popup.querySelector("#msg-text");
  const btnEl = popup.querySelector("#msg-ok");

  textEl.textContent = message;

  if (type === "erreur") {
    titleEl.textContent = "Attention";
    titleEl.style.color = "var(--error-500)";
    btnEl.style.background = "linear-gradient(135deg, var(--error-500), #dc2626)";
  } else if (type === "succes") {
    titleEl.textContent = "Succès !";
    titleEl.style.color = "var(--success-500)";
    btnEl.style.background = "linear-gradient(135deg, var(--success-500), #059669)";
  } else {
    titleEl.textContent = "Information";
    titleEl.style.color = "var(--primary-600)";
    btnEl.style.background = "linear-gradient(135deg, var(--primary-600), var(--primary-500))";
  }

  // 4. Afficher la popup
  popup.style.display = "flex";
}

// ─── 3) LOGIQUE « RECHERCHE + POPUP ADD » (pour recherche.php) ──────────────────
function initialiserRecherche(manager) {
  const searchForm = document.getElementById("search-form");
  const resultDiv  = document.getElementById("result");
  if (!searchForm) return; // S'arrêter si on n'est pas sur la bonne page

  chargerSuggestions(manager);

  // 3.a) Soumettre le formulaire → requête Google Books
  searchForm.addEventListener("submit", event => {
    event.preventDefault();
    const query = document.getElementById("search-input").value.trim();
    if (!query) {
      afficherMessage("Veuillez saisir un titre ou un auteur.");
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
          const carte = manager.creerCarteGoogle(item);
          resultDiv.appendChild(carte);
        });

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
            activerGestionDatesIntelligente("popup-add-")
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
      afficherMessage("Aucun livre chargé !");
      return;
    }
    const statut    = document.getElementById("popup-add-status").value;
    const note      = document.getElementById("popup-add-note").value.trim();
    const startDate = document.getElementById("popup-add-start").value;
    const endDate   = document.getElementById("popup-add-end").value;

    // Validations métier :
    if (statut === "À lire" && (startDate || endDate)) {
      afficherMessage("Un livre 'À lire' ne doit pas avoir de date.");
      return;
    }
    if (statut === "En cours" && endDate) {
      afficherMessage("Un livre 'En cours' ne doit pas avoir de date de fin.");
      return;
    }
    if (statut === "Terminé" && !endDate) {
      afficherMessage("Un livre 'Terminé' doit avoir une date et de fin.");
      return;
    }
    if (statut === "DNF" && endDate) {
      afficherMessage("Un livre 'DNF' ne doit pas avoir de date de fin.");
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
      startDate:   startDate, // Envoyer les dates telles quelles
      endDate:     endDate
    };

    const success = await manager.ajouterLivre(livreFinal);
    if (success) {
      afficherMessage("Livre ajouté avec succès !");
      closeAddPopup();
      manager.chargerLivres(); // Recharger la liste pour la synchro
    } else {
      afficherMessage("Erreur lors de l’ajout du livre (verifier la console).");
    }
  });
}



// ─── 4) LOGIQUE « BIBLIOTHÈQUE » (pour bibliotheque.php) ──────────
function initialiserBibliotheque(manager) {
  const selectFiltre = document.getElementById("filtre-statut");
  const selectTri    = document.getElementById("tri-critere");
  
  if (!selectFiltre) return; // S'arrêter si on n'est pas sur la bonne page

  // 4.a) Filtrer
  selectFiltre.addEventListener("change", e => {
    // On applique le filtre, puis on applique le tri actuel par-dessus
    manager.afficherLivresFiltres(e.target.value);
    manager.trierLivres(selectTri.value);
  });

  // 4.b) Trier
  selectTri.addEventListener("change", e => {
    // On trie (la fonction de tri tiendra compte du filtre)
    manager.trierLivres(e.target.value);
  });
  
  // 4.d) Exporter CSV
  // 4.d) Exporter CSV (Gère le bouton du menu ET celui de la page)
  const exportBtns = [document.getElementById("export-csv"), document.getElementById("page-export-csv")];
  
  exportBtns.forEach(btn => {
    if (btn) {
      btn.addEventListener("click", () => {
        const livres = manager.livres;
        if (livres.length === 0) {
          afficherMessage("Aucun livre à exporter.", "info");
          return;
        }
        // ... (Le reste du code d'export CSV reste identique : const header = ... etc) ...
        const header = ["Titre", "Auteur(s)", "Statut", "Note", "Début", "Fin", "Genre", "Résumé"];
        const rows = livres.map(l => [
            l.title, l.authors, l.status, l.note || "", l.startDate || "", l.endDate || "", l.genre || "", (l.description || "").replace(/"/g, '""')
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
  });

  // 4.e) Importer CSV
  const triggerPage = document.getElementById("page-import-trigger");
  const inputPage   = document.getElementById("page-import-csv");
  
  // Bouton de la page
  if (triggerPage && inputPage) {
    triggerPage.addEventListener("click", () => inputPage.click());
    inputPage.addEventListener("change", (e) => gerrerImportCSV(e, manager)); // On sortira la logique dans une fonction
  }
  const triggerMenu = document.getElementById("import-trigger");
  const inputMenu   = document.getElementById("import-csv");
  if (triggerMenu && inputMenu) {
    triggerMenu.addEventListener("click", () => inputMenu.click());
    inputMenu.addEventListener("change", (e) => gerrerImportCSV(e, manager));
  }
  if (importBtn) {
    importBtn.addEventListener("change", async event => {
      const file = event.target.files[0];
      if (!file) {
        afficherMessage("Aucun fichier sélectionné.");
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
            afficherMessage("Fichier CSV vide ou invalide.");
            return;
          }
          const headers = lines.shift()
                                .split(",")
                                .map(h => h.replace(/"/g, "").trim());
          if (headers.length < 8) {
            afficherMessage("CSV invalide : entêtes manquantes.");
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

          afficherMessage(`${nouveauxAjoutes} nouveau(x) livre(s) ajouté(s).`);
          // Recharger tout pour être synchro
          await manager.chargerLivres();
          manager.trierLivres(selectTri.value); // Ré-appliquer le tri

        } catch (err) {
          console.error("Erreur import CSV :", err);
          afficherMessage("Erreur lors de l’importation (voir console).");
        } finally {
          // Réinitialiser le champ pour pouvoir importer le même fichier 2x
          event.target.value = null;
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }

  // 4.f) Compléter les fiches manquantes (couverture/genre/description)
  const enrichBtn = document.getElementById("enrichir-fiches");
  if (enrichBtn) {
    enrichBtn.addEventListener("click", async () => {
      enrichBtn.disabled = true;
      enrichBtn.textContent = "Enrichissement...";
      
      for (let livre of manager.livres) {
        // On enrichit si la couverture manque ET que ce n'est pas un livre "A lire"
        // (pour éviter d'enrichir toute la wishlist d'un coup)
        if (!livre.cover && livre.status !== "À lire") {
          try {
            const enrichi = await enrichirLivreViaAPI(livre.title, livre.authors);
            
            // On vérifie que les données trouvées sont "meilleures"
            if (enrichi.cover) livre.cover = enrichi.cover;
            if (enrichi.description && livre.description === "Pas de résumé disponible.") livre.description = enrichi.description;
            if (enrichi.genre && livre.genre === "Inconnu") livre.genre = enrichi.genre;

            // Mettre à jour en base
            await fetch(`${API_BASE_URL}/api/modifier-livre.php`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                livre_id:   livre.id,
                statut:     livre.status,
                note:       livre.note,
                date_debut: livre.startDate,
                date_fin:   livre.endDate
                // Note : On ne modifie pas le titre/auteur ici
              })
            });
          } catch(err) { 
             console.warn("Erreur enrichissement pour", livre.title, err);
             /* on continue même en cas d’erreur */ 
          }
        }
      }
      
      // Mettre à jour l'état local et ré-afficher
      localStorage.setItem("bibliotheque", JSON.stringify(manager.livres));
      manager.afficherLivresFiltres(selectFiltre.value || "Tous");
      manager.trierLivres(selectTri.value);
      
      enrichBtn.disabled = false;
      enrichBtn.textContent = "Compléter";
      afficherMessage("Fiches complétées (si des données ont été trouvées).");
    });
  }
}



// --- FONCTION POUR GRISER LES DATES SELON LE STATUT ---
function activerGestionDatesIntelligente(idPrefix) {
  const selectStatut = document.getElementById(`${idPrefix}status`);
  const inputDebut   = document.getElementById(`${idPrefix}start`);
  const inputFin     = document.getElementById(`${idPrefix}end`);

  if (!selectStatut || !inputDebut || !inputFin) return;

  const mettreAJour = () => {
    const statut = selectStatut.value;

    // 1. Reset : on active tout par défaut
    inputDebut.disabled = false;
    inputFin.disabled   = false;
    inputDebut.parentElement.style.opacity = "1"; // Pour l'effet visuel
    inputFin.parentElement.style.opacity   = "1";

    // 2. Logique selon le statut
    if (statut === "À lire") {
      // Pas de dates pour "À lire"
      inputDebut.disabled = true;
      inputFin.disabled   = true;
      inputDebut.value    = "";
      inputFin.value      = "";
      inputDebut.parentElement.style.opacity = "0.4";
      inputFin.parentElement.style.opacity   = "0.4";
      
    } else if (statut === "En cours") {
      // Pas de date de fin pour "En cours"
      inputFin.disabled = true;
      inputFin.value    = "";
      inputFin.parentElement.style.opacity = "0.4";
      
    } else if (statut === "DNF") {
      // DNF : on garde le début, mais souvent pas de "fin de lecture" (selon votre logique précédente)
      inputFin.disabled = true;
      inputFin.value    = "";
      inputFin.parentElement.style.opacity = "0.4";
    }
    // "Terminé" : tout reste activé
  };

  // Écouter le changement
  selectStatut.addEventListener("change", mettreAJour);
  
  // Lancer une fois au démarrage pour appliquer l'état initial
  mettreAJour();
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
 */
function afficherDernieresLectures(manager) {
  const conteneur = document.getElementById("derniers-livres");
  if (!conteneur) return;  // S'arrêter si l'id n'existe pas (on n'est pas sur index.php)

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

  // 4) S’il n’y a aucun livre terminé, on affiche un message
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
    // Utilise les classes de style.css pour le dashboard
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

// Fonction intelligente pour traiter l'import (Compatible Goodreads & Format Perso)
// Fonction d'import avec barre de progression animée
async function gerrerImportCSV(event, manager) {
    const file = event.target.files[0];
    if (!file) return;

    // 1. Création dynamique de la popup de progression
    const loaderId = "import-loader-popup";
    let loaderPopup = document.getElementById(loaderId);
    
    if (!loaderPopup) {
        loaderPopup = document.createElement("div");
        loaderPopup.id = loaderId;
        loaderPopup.className = "popup"; // On garde votre style de base (fond flouté)
        loaderPopup.style.display = "flex"; // Flex pour centrer
        loaderPopup.style.zIndex = "2000";  // Au-dessus de tout
        loaderPopup.innerHTML = `
            <div class="popup-content loader-container">
                <h3 class="loader-title">Importation en cours...</h3>
                <div class="loader-bar-bg">
                    <div id="loader-fill" class="loader-bar-fill"></div>
                </div>
                <div id="loader-status" class="loader-text">Analyse du fichier...</div>
                <div id="loader-book" class="loader-details"></div>
            </div>
        `;
        document.body.appendChild(loaderPopup);
    } else {
        loaderPopup.style.display = "flex";
    }

    // Références aux éléments à mettre à jour
    const fillEl   = document.getElementById("loader-fill");
    const statusEl = document.getElementById("loader-status");
    const bookEl   = document.getElementById("loader-book");

    // Reset visuel
    fillEl.style.width = "0%";
    statusEl.textContent = "Lecture du fichier...";
    bookEl.textContent = "";

    const reader = new FileReader();
    reader.onload = async e => {
      try {
        const text  = new TextDecoder("utf-8").decode(e.target.result).normalize("NFC");
        const lines = text.trim().split(/\r\n|\n|\r/); // Découpage robuste

        if (lines.length <= 1) {
          loaderPopup.style.display = "none";
          afficherMessage("Fichier CSV vide ou invalide.", "erreur");
          return;
        }

        // Analyse entêtes
        const headersLine = lines.shift();
        const headers = parseCSVLine(headersLine).map(h => h.toLowerCase().trim());
        const isGoodreads = headers.includes("book id") && headers.includes("author");
        
        const totalLivres = lines.length;
        let livresTraites = 0;
        let nouveauxAjoutes = 0;
        let livresActuels = manager.livres;

        // Boucle sur chaque ligne
        for (const line of lines) {
            livresTraites++;
            
            // --- MISE À JOUR DE LA PROGRESSION ---
            const pourcentage = Math.round((livresTraites / totalLivres) * 100);
            fillEl.style.width = `${pourcentage}%`;
            statusEl.textContent = `Traitement : ${livresTraites} sur ${totalLivres}`;
            
            // --- LOGIQUE D'IMPORT (Identique à avant) ---
            const cols = parseCSVLine(line);
            if (cols.length < 3) continue;

            let titre, auteurs, statut, note, debut, fin, genre, resume;

            if (isGoodreads) {
                const idxTitle  = headers.indexOf("title");
                const idxAuthor = headers.indexOf("author");
                const idxRating = headers.indexOf("my rating");
                const idxReadAt = headers.indexOf("date read");
                const idxAdded  = headers.indexOf("date added");
                const idxShelf  = headers.indexOf("exclusive shelf");

                titre   = cols[idxTitle];
                auteurs = cols[idxAuthor];
                note    = parseInt(cols[idxRating]) || 0;
                
                const shelf = cols[idxShelf];
                if (shelf === "read") statut = "Terminé";
                else if (shelf === "currently-reading") statut = "En cours";
                else statut = "À lire";

                const formatDate = (d) => d ? d.replace(/\//g, "-") : "";
                fin   = formatDate(cols[idxReadAt]);
                debut = (statut === "En cours" || statut === "Terminé") ? formatDate(cols[idxAdded]) : "";
                
                genre = "Inconnu";
                resume = "";
            } else {
                [titre, auteurs, statut, note, debut, fin, genre, resume] = cols;
            }
            
            if (!titre || !auteurs) continue;

            // Afficher le titre du livre en cours pour l'effet "ça bosse"
            bookEl.textContent = titre;

            // Vérification doublon
            const existe = livresActuels.some(l =>
              l.title.toLowerCase() === titre.toLowerCase() &&
              l.authors.toLowerCase() === auteurs.toLowerCase()
            );

            if (!existe) {
                // Appel API (C'est ça qui prend du temps)
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
                if (ok) nouveauxAjoutes++;
            }
            
            // Petite pause pour laisser le temps au navigateur de rafraîchir l'UI
            // (sinon la boucle bloque tout et on ne voit pas l'anim)
            
        }

        await new Promise(r => setTimeout(r, 10)); 

        // FIN
        loaderPopup.style.display = "none";
        
        if (nouveauxAjoutes > 0) {
            afficherMessage(`Import terminé ! ${nouveauxAjoutes} livres ajoutés.`, "succes");
            await manager.chargerLivres();
             // Rafraichir le tri si on est sur la page bibliothèque
            const selectTri = document.getElementById("tri-critere");
            if(selectTri) manager.trierLivres(selectTri.value);
        } else {
            afficherMessage("Import terminé. Aucun nouveau livre (tous existent déjà).", "info");
        }

      } catch (err) {
        console.error("Erreur import CSV :", err);
        loaderPopup.style.display = "none";
        afficherMessage("Erreur lors de l’importation.", "erreur");
      } finally {
        event.target.value = null;
      }
    };
    reader.readAsArrayBuffer(file);
}

// Helper indispensable pour bien lire les CSV avec des virgules dans les titres (ex: "Moyes, Jojo")
function parseCSVLine(text) {
    const result = [];
    let cell = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(cell.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
            cell = '';
        } else {
            cell += char;
        }
    }
    // Pousser la dernière cellule
    result.push(cell.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
    return result;
}

//
// ─── 6) FONCTIONS DU TABLEAU DE BORD (INDEX.PHP) ───────────────────────────────────
//

/**
 * Met à jour le bloc "Challenge Lecture"
 */
function mettreAJourChallenge(livres) {
  const objectif = 30; // Vous pouvez changer l'objectif ici
  const conteneur = document.querySelector(".challenge-block");
  if (!conteneur) return; // S'arrêter si on n'est pas sur la bonne page

  const livresTermines = livres.filter(l => l.status === "Terminé").length;
  const pourcentage = objectif > 0 ? (livresTermines / objectif) * 100 : 0;

  document.getElementById("progress-numbers").textContent = `${livresTermines} / ${objectif}`;
  document.getElementById("progress-bar-fill").style.width = `${pourcentage}%`;
  document.getElementById("progress-percentage").textContent = `${Math.round(pourcentage)}%`;
}

/**
 * Crée ou met à jour le graphique "Livres lus par mois"
 * (Affiche les 12 derniers mois)
 */
function initialiserGraphiqueMois(livres) {
  const ctx = document.getElementById("graph-mois")?.getContext("2d");
  if (!ctx) return;

  const labelsMois = [];
  const anneeActuelle = new Date().getFullYear();
  const moisActuel = new Date().getMonth(); // 0-11

  // Noms des mois pour l'affichage
  const nomsMois = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];
  
  // Initialiser les 12 derniers mois à 0
  let dataMois = new Array(12).fill(0);

  // Générer les labels pour les 12 derniers mois
  for (let i = 0; i < 12; i++) {
    const moisIndex = (moisActuel - i + 12) % 12;
    labelsMois.push(nomsMois[moisIndex]);
  }
  labelsMois.reverse(); // Mettre dans le bon ordre chronologique


  livres.forEach(livre => {
    if (livre.status === "Terminé" && livre.endDate) {
      const dateFin = new Date(livre.endDate);
      const diffMois = (anneeActuelle - dateFin.getFullYear()) * 12 + (moisActuel - dateFin.getMonth());
      
      // Si le livre a été terminé dans les 11 derniers mois (0-11)
      if (diffMois >= 0 && diffMois < 12) {
        // L'index dans le tableau dataMois (0 = mois le plus ancien, 11 = mois actuel)
        const dataIndex = 11 - diffMois;
        dataMois[dataIndex]++;
      }
    }
  });

  // Détruire l'ancien graphique s'il existe
  if (activeCharts.mois) {
    activeCharts.mois.destroy();
  }

  activeCharts.mois = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labelsMois,
      datasets: [{
        label: "Livres lus",
        data: dataMois,
        backgroundColor: "#a78bfa",
        borderColor: "#8b5cf6",
        borderWidth: 1,
        borderRadius: 4,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });
}

/**
 * Crée ou met à jour le graphique "Livres lus par année"
 */
function initialiserGraphiqueAnnee(livres) {
  const ctx = document.getElementById("graph-annee")?.getContext("2d");
  if (!ctx) return;

  const annees = {};
  livres.forEach(livre => {
    if (livre.status === "Terminé" && livre.endDate) {
      const annee = new Date(livre.endDate).getFullYear();
      annees[annee] = (annees[annee] || 0) + 1;
    }
  });

  const labelsAnnees = Object.keys(annees).sort();
  const dataAnnees = labelsAnnees.map(annee => annees[annee]);

  if (activeCharts.annee) {
    activeCharts.annee.destroy();
  }

  activeCharts.annee = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labelsAnnees,
      datasets: [{
        label: "Livres lus",
        data: dataAnnees,
        backgroundColor: "#c4b5fd",
        borderColor: "#8b5cf6",
        borderWidth: 1,
        borderRadius: 4,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });
}

/**
 * Crée ou met à jour le graphique "Répartition des genres"
 */
function initialiserGraphiqueGenres(livres) {
  const ctx = document.getElementById("graph-genres")?.getContext("2d");
  if (!ctx) return;

  const genres = {};
  livres.forEach(livre => {
    // Regrouper les genres inconnus ou non définis
    const genre = livre.genre ? livre.genre.trim() : "Inconnu";
    genres[genre] = (genres[genre] || 0) + 1;
  });

  if (activeCharts.genres) {
    activeCharts.genres.destroy();
  }

  activeCharts.genres = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: Object.keys(genres),
      datasets: [{
        label: "Répartition",
        data: Object.values(genres),
        backgroundColor: [
          "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#e9d5ff",
          "#f3e8ff", "#d1d5db", "#9ca3af", "#6b7280"
        ],
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    }
  });
}