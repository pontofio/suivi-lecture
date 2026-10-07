// ==========================================================================
// Book Tracker - Script Principal
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  initialiserNavigation();
  creerPopupsNotification();
  initialiserFermetureModales();
  migrerDonneesLivres();
  initialiserPage();
});

// --------------------------------------------------------------------------
// 1. Navigation & Modales Globales
// --------------------------------------------------------------------------

function initialiserNavigation() {
  const menuPlaceholder = document.getElementById("menu-placeholder");
  if (!menuPlaceholder) return;

  const currentPath = window.location.pathname.toLowerCase();
  
  const liens = [
    { href: "index.html", label: "Accueil", match: ["index.html", "/"] },
    { href: "bibliotheque.html", label: "Ma Bibliothèque", match: ["bibliotheque.html"] },
    { href: "pal.html", label: "PAL", match: ["pal.html"] },
    { href: "sagas.html", label: "Sagas", match: ["sagas.html"] },
    { href: "recherche.html", label: "Recherche", match: ["recherche.html"] },
  ];

  let activeIndex = 0;
  liens.forEach((lien, idx) => {
    if (lien.match.some((m) => currentPath.endsWith(m) || currentPath.includes(m))) {
      activeIndex = idx;
    }
  });

  menuPlaceholder.innerHTML = `
    <nav>
      ${liens
        .map(
          (lien, idx) =>
            `<a href="${lien.href}" class="${idx === activeIndex ? "active" : ""}">${lien.label}</a>`
        )
        .join("")}
    </nav>
  `;
}

function creerPopupsNotification() {
  if (document.getElementById("custom-alert-popup")) return;

  const div = document.createElement("div");
  div.innerHTML = `
    <div id="custom-alert-popup" class="popup" style="display: none;">
      <div class="popup-content popup-compact text-center">
        <h3 id="custom-alert-title">Information</h3>
        <p id="custom-alert-message" style="margin: 15px 0 20px 0; color: #4a5568;"></p>
        <button id="custom-alert-ok" style="min-width: 110px;">OK</button>
      </div>
    </div>

    <div id="custom-confirm-popup" class="popup" style="display: none;">
      <div class="popup-content popup-compact text-center">
        <h3 id="custom-confirm-title">Confirmation</h3>
        <p id="custom-confirm-message" style="margin: 15px 0 20px 0; color: #4a5568;"></p>
        <div class="modal-actions" style="justify-content: center;">
          <button id="custom-confirm-yes" style="min-width: 100px;">Confirmer</button>
          <button id="custom-confirm-no" class="btn-secondary" style="min-width: 100px;">Annuler</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(div);

  window.alert = function (message) {
    afficherNotification(message);
  };
}

function afficherNotification(message, titre = "Information") {
  const popup = document.getElementById("custom-alert-popup");
  const titreEl = document.getElementById("custom-alert-title");
  const msgEl = document.getElementById("custom-alert-message");
  const okBtn = document.getElementById("custom-alert-ok");
  if (!popup || !msgEl || !okBtn) return;

  titreEl.textContent = titre;
  msgEl.textContent = message;
  popup.style.display = "flex";

  okBtn.onclick = () => {
    popup.style.display = "none";
  };
}

function demanderConfirmation(message, callback, titre = "Confirmation") {
  const popup = document.getElementById("custom-confirm-popup");
  const titreEl = document.getElementById("custom-confirm-title");
  const msgEl = document.getElementById("custom-confirm-message");
  const yesBtn = document.getElementById("custom-confirm-yes");
  const noBtn = document.getElementById("custom-confirm-no");
  if (!popup) return;

  if (titreEl) titreEl.textContent = titre;
  msgEl.textContent = message;
  popup.style.display = "flex";

  yesBtn.onclick = () => {
    popup.style.display = "none";
    if (callback) callback();
  };

  noBtn.onclick = () => {
    popup.style.display = "none";
  };
}

// Fermeture des popups au clic sur le fond (backdrop) ou avec la touche Escape
function initialiserFermetureModales() {
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("popup")) {
      e.target.style.display = "none";
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".popup").forEach((pop) => {
        pop.style.display = "none";
      });
    }
  });
}

// --------------------------------------------------------------------------
// 2. Gestion des données (LocalStorage) & Utilitaires
// --------------------------------------------------------------------------

const PLACEHOLDER_COVER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgODAgMTAwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iODAiIGhlaWdodD0iMTAwIiBmaWxsPSIjZjBmMGYwIi8+CjxwYXRoIGQ9Ik0yNSAzMEg1NVYzNEgyNVYzMFpNMjUgNDBINTVWNDRIMjVWNDBaTTI1IDUwSDU1VjU0SDI1VjUwWiIgZmlsbD0iI2NjYyIvPgo8L3N2Zz4K";

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getLocalDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formaterDate(dateStr) {
  if (!dateStr) return "";
  const parties = dateStr.split("-");
  if (parties.length === 3) {
    return `${parties[2]}/${parties[1]}/${parties[0]}`;
  }
  return dateStr;
}

function formaterEtoiles(note) {
  const n = parseInt(note, 10);
  if (isNaN(n) || n < 1) return "";
  const etoilesPleines = "★".repeat(Math.min(n, 5));
  const etoilesVides = "☆".repeat(Math.max(0, 5 - n));
  return `${etoilesPleines}${etoilesVides} (${n}/5)`;
}

function normaliserChaine(str) {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function getBadgeClasse(status) {
  const s = normaliserChaine(status);
  if (s.includes("cours")) return "status-en-cours";
  if (s.includes("termin") || s === "read") return "status-termine";
  if (s.includes("abandon") || s === "dnf") return "status-abandonne";
  return "status-a-lire";
}

function migrerDonneesLivres() {
  try {
    const raw = localStorage.getItem("bibliotheque");
    if (!raw) return;
    const livres = JSON.parse(raw);
    if (!Array.isArray(livres)) return;

    let modifie = false;
    livres.forEach((livre, i) => {
      if (!livre.id) {
        livre.id = "book_" + Date.now() + "_" + i + "_" + Math.random().toString(36).substring(2, 7);
        modifie = true;
      }
      if (!livre.status) {
        livre.status = "À lire";
        modifie = true;
      }
    });

    if (modifie) {
      localStorage.setItem("bibliotheque", JSON.stringify(livres));
    }
  } catch (e) {
    console.error("Erreur migration livres :", e);
  }
}

function getLivres() {
  try {
    return JSON.parse(localStorage.getItem("bibliotheque")) || [];
  } catch (e) {
    return [];
  }
}

function sauvegarderLivres(livres) {
  localStorage.setItem("bibliotheque", JSON.stringify(livres));
}

function ajouterLivre(bookData) {
  const livres = getLivres();
  const titreNorm = normaliserChaine(bookData.title);
  const auteurNorm = normaliserChaine(bookData.authors);

  const existe = livres.some(
    (l) => normaliserChaine(l.title) === titreNorm && normaliserChaine(l.authors) === auteurNorm
  );

  if (existe) {
    afficherNotification("Ce livre est déjà présent dans votre bibliothèque.", "Livre déjà présent");
    return false;
  }

  const nouveauLivre = {
    ...bookData,
    id: bookData.id || "book_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
    status: bookData.status || "À lire",
    cover: bookData.cover || "",
    description: bookData.description || "Pas de résumé disponible.",
    genre: bookData.genre || "Inconnu",
  };

  livres.push(nouveauLivre);
  sauvegarderLivres(livres);
  return true;
}

function supprimerLivreParId(bookId) {
  let livres = getLivres();
  livres = livres.filter((l) => l.id !== bookId);
  sauvegarderLivres(livres);
}

// --------------------------------------------------------------------------
// 3. Affichage des cartes de livres & Pop-up d'édition
// --------------------------------------------------------------------------

function creerCarteLivre(bookData, options = {}) {
  const item = document.createElement("div");
  item.classList.add("grid-item");
  item.dataset.bookId = bookData.id || "";

  const noteFormatee = formaterEtoiles(bookData.note);
  const badgeClass = getBadgeClasse(bookData.status);

  let sagaBadgeHtml = "";
  if (bookData.sagaId) {
    const sagas = getSagas();
    const s = sagas.find((x) => x.id === bookData.sagaId);
    if (s) {
      const tomeTxt = bookData.sagaTome ? ` (Tome ${bookData.sagaTome})` : "";
      sagaBadgeHtml = `<span class="badge-saga-link">📚 ${escapeHtml(s.title)}${escapeHtml(tomeTxt)}</span>`;
    }
  }

  item.innerHTML = `
    <img src="${escapeHtml(bookData.cover) || PLACEHOLDER_COVER}" alt="Couverture de ${escapeHtml(bookData.title)}" loading="lazy">
    <div class="book-info">
      <p class="book-title" title="${escapeHtml(bookData.title)}">${escapeHtml(bookData.title)}</p>
      <p class="book-authors" title="${escapeHtml(bookData.authors)}">${escapeHtml(bookData.authors)}</p>
      <span class="status-badge ${badgeClass}">${escapeHtml(bookData.status || "À lire")}</span>
      ${sagaBadgeHtml}
      ${noteFormatee ? `<p class="book-rating">${noteFormatee}</p>` : ""}
      ${bookData.startDate ? `<p class="book-dates">Début : ${formaterDate(bookData.startDate)}</p>` : ""}
      ${bookData.endDate ? `<p class="book-dates">Fin : ${formaterDate(bookData.endDate)}</p>` : ""}
      <button class="delete-button" type="button">🗑 Supprimer</button>
    </div>
  `;

  // Écouteur suppression
  const deleteBtn = item.querySelector(".delete-button");
  deleteBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    demanderConfirmation(`Êtes-vous sûr de vouloir supprimer "${bookData.title}" ?`, () => {
      supprimerLivreParId(bookData.id);
      item.remove();
      if (options.onDelete) options.onDelete(bookData);
    });
  });

  // Clic carte -> pop-up d'édition
  item.addEventListener("click", () => {
    ouvrirPopupEdition(bookData.id, options.onUpdate);
  });

  return item;
}

let livreEnCoursEdition = null;

function ouvrirPopupEdition(bookId, onUpdateCallback) {
  const editPopup = document.getElementById("edit-popup");
  if (!editPopup) return;

  const livres = getLivres();
  const livre = livres.find((l) => l.id === bookId);
  if (!livre) return;

  livreEnCoursEdition = { ...livre };

  const titleEl = document.getElementById("edit-title");
  const authorsEl = document.getElementById("edit-authors");
  const genreEl = document.getElementById("edit-genre-text");
  const descEl = document.getElementById("edit-desc-text");
  const coverEl = document.getElementById("edit-cover-preview");
  const statusEl = document.getElementById("edit-status");
  const noteEl = document.getElementById("edit-note");
  const startEl = document.getElementById("edit-start");
  const endEl = document.getElementById("edit-end");

  if (titleEl) titleEl.textContent = livre.title;
  if (authorsEl) authorsEl.textContent = livre.authors;
  if (genreEl) genreEl.textContent = livre.genre || "Inconnu";
  if (descEl) descEl.textContent = livre.description || "Pas de résumé disponible.";
  if (coverEl) coverEl.src = livre.cover || PLACEHOLDER_COVER;
  if (statusEl) statusEl.value = livre.status || "À lire";
  if (noteEl) noteEl.value = livre.note || "";
  if (startEl) startEl.value = livre.startDate || "";
  if (endEl) endEl.value = livre.endDate || "";

  // Gestion de la saga associée
  const sagaEl = document.getElementById("edit-saga");
  const fieldSagaTome = document.getElementById("edit-field-saga-tome");
  const sagaTomeEl = document.getElementById("edit-saga-tome");
  const fieldNewSaga = document.getElementById("edit-field-new-saga");
  const newSagaTitleEl = document.getElementById("edit-new-saga-title");

  if (sagaEl) {
    const sagas = getSagas();
    sagaEl.innerHTML = `
      <option value="">-- Aucune saga --</option>
      ${sagas.map((s) => `<option value="${s.id}">${escapeHtml(s.title)} (${escapeHtml(s.author)})</option>`).join("")}
      <option value="__NEW__">➕ Créer une nouvelle saga...</option>
    `;
    sagaEl.value = livre.sagaId || "";

    if (sagaTomeEl) sagaTomeEl.value = livre.sagaTome || "";
    if (newSagaTitleEl) newSagaTitleEl.value = "";

    const ajusterChampsSaga = () => {
      const v = sagaEl.value;
      if (v === "__NEW__") {
        if (fieldNewSaga) fieldNewSaga.style.display = "block";
        if (fieldSagaTome) fieldSagaTome.style.display = "block";
        if (newSagaTitleEl && !newSagaTitleEl.value) newSagaTitleEl.value = livre.title;
        if (sagaTomeEl && !sagaTomeEl.value) sagaTomeEl.value = 1;
      } else if (v !== "") {
        if (fieldNewSaga) fieldNewSaga.style.display = "none";
        if (fieldSagaTome) fieldSagaTome.style.display = "block";
      } else {
        if (fieldNewSaga) fieldNewSaga.style.display = "none";
        if (fieldSagaTome) fieldSagaTome.style.display = "none";
      }
    };

    sagaEl.onchange = ajusterChampsSaga;
    ajusterChampsSaga();
  }

  // Auto-remplissage intelligent des dates au changement de statut
  if (statusEl) {
    statusEl.onchange = () => {
      const s = statusEl.value;
      if (s === "En cours" && !startEl.value) {
        startEl.value = getLocalDateString();
      } else if (s === "Terminé" && !endEl.value) {
        endEl.value = getLocalDateString();
      }
    };
  }

  // Écouteur Sauvegarder
  const saveBtn = document.getElementById("edit-save");
  if (saveBtn) {
    saveBtn.onclick = () => {
      if (!livreEnCoursEdition) return;

      const tous = getLivres();
      const index = tous.findIndex((l) => l.id === livreEnCoursEdition.id);
      if (index === -1) return;

      tous[index].status = statusEl ? statusEl.value : tous[index].status;
      tous[index].note = noteEl ? noteEl.value : tous[index].note;
      tous[index].startDate = startEl ? startEl.value : tous[index].startDate;
      tous[index].endDate = endEl ? endEl.value : tous[index].endDate;

      // Sauvegarde saga
      if (sagaEl) {
        const sagaVal = sagaEl.value;
        if (sagaVal === "__NEW__") {
          const nomNouvelle = (newSagaTitleEl ? newSagaTitleEl.value.trim() : "") || livreEnCoursEdition.title;
          const tomeNum = (sagaTomeEl && sagaTomeEl.value ? parseInt(sagaTomeEl.value, 10) : 1) || 1;
          const sagas = getSagas();
          const nouvelleSaga = {
            id: "saga_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
            title: nomNouvelle,
            author: livreEnCoursEdition.authors,
            genre: livreEnCoursEdition.genre || "",
            cover: livreEnCoursEdition.cover || "",
            sagaStatus: "Terminée",
            userStatus: (statusEl && statusEl.value === "Terminé") ? "En cours" : "À commencer",
            totalVolumes: Math.max(3, tomeNum),
            volumesRead: (statusEl && statusEl.value === "Terminé") ? 1 : 0,
            nextVolume: (statusEl && statusEl.value === "Terminé") ? `Tome ${tomeNum + 1}` : `Tome ${tomeNum}`,
            notes: "",
          };
          sagas.push(nouvelleSaga);
          sauvegarderSagas(sagas);

          tous[index].sagaId = nouvelleSaga.id;
          tous[index].sagaTome = tomeNum;
        } else if (sagaVal) {
          tous[index].sagaId = sagaVal;
          tous[index].sagaTome = (sagaTomeEl && sagaTomeEl.value) ? parseInt(sagaTomeEl.value, 10) : "";
        } else {
          tous[index].sagaId = "";
          tous[index].sagaTome = "";
        }
      }

      sauvegarderLivres(tous);
      editPopup.style.display = "none";
      livreEnCoursEdition = null;

      if (onUpdateCallback) onUpdateCallback(tous[index]);
    };
  }

  // Écouteur Annuler
  const cancelBtn = document.getElementById("edit-cancel");
  if (cancelBtn) {
    cancelBtn.onclick = () => {
      editPopup.style.display = "none";
      livreEnCoursEdition = null;
    };
  }

  // Écouteur Bouton X
  const closeBtn = document.getElementById("edit-close");
  if (closeBtn) {
    closeBtn.onclick = () => {
      editPopup.style.display = "none";
      livreEnCoursEdition = null;
    };
  }

  // Écouteur Supprimer depuis la modale
  const deleteModalBtn = document.getElementById("edit-delete");
  if (deleteModalBtn) {
    deleteModalBtn.onclick = () => {
      if (!livreEnCoursEdition) return;
      demanderConfirmation(`Supprimer "${livreEnCoursEdition.title}" ?`, () => {
        supprimerLivreParId(livreEnCoursEdition.id);
        editPopup.style.display = "none";
        livreEnCoursEdition = null;
        if (onUpdateCallback) onUpdateCallback(null);
      });
    };
  }

  editPopup.style.display = "flex";
}

// --------------------------------------------------------------------------
// 4. Initialisation par Page
// --------------------------------------------------------------------------

function initialiserPage() {
  if (document.getElementById("derniers-livres")) {
    initialiserDashboard();
  }
  if (document.getElementById("library")) {
    initialiserBibliotheque();
  }
  if (document.getElementById("wheel-canvas")) {
    initialiserPAL();
  }
  if (document.getElementById("search-form")) {
    initialiserRecherche();
  }
  if (document.getElementById("sagas-container")) {
    initialiserSagas();
  }
}

// ==========================================================================
// PAGE ACCUEIL / DASHBOARD
// ==========================================================================

let chartMoisInstance = null;
let chartAnneeInstance = null;

function initialiserDashboard() {
  function rafraichirDashboard() {
    const livres = getLivres();

    // 1. KPI Stats Cards
    const totalEl = document.getElementById("stat-total");
    const enCoursEl = document.getElementById("stat-en-cours");
    const palEl = document.getElementById("stat-pal");
    const terminesEl = document.getElementById("stat-termines");
    const moyenneEl = document.getElementById("stat-moyenne");

    const nbTotal = livres.length;
    const nbEnCours = livres.filter((l) => normaliserChaine(l.status).includes("cours")).length;
    const nbPal = livres.filter((l) => {
      const s = normaliserChaine(l.status);
      return (s.includes("lire") || s === "to-read") && !s.includes("termin") && !s.includes("cours");
    }).length;
    const termines = livres.filter((l) => normaliserChaine(l.status).includes("termin"));
    const nbTermines = termines.length;

    const livresNotes = livres.filter((l) => l.note && !isNaN(parseInt(l.note, 10)) && parseInt(l.note, 10) > 0);
    const moyenne =
      livresNotes.length > 0
        ? (
            livresNotes.reduce((acc, l) => acc + parseInt(l.note, 10), 0) / livresNotes.length
          ).toFixed(1) + " / 5"
        : "-";

    if (totalEl) totalEl.textContent = nbTotal;
    if (enCoursEl) enCoursEl.textContent = nbEnCours;
    if (palEl) palEl.textContent = nbPal;
    if (terminesEl) terminesEl.textContent = nbTermines;
    if (moyenneEl) moyenneEl.textContent = moyenne;

    // 2. Challenge de lecture (Année en cours)
    const anneeCourante = new Date().getFullYear().toString();
    const titreAnneeEl = document.getElementById("challenge-annee-titre");
    const labelAnneeEl = document.getElementById("challenge-annee-label");
    if (titreAnneeEl) titreAnneeEl.textContent = anneeCourante;
    if (labelAnneeEl) labelAnneeEl.textContent = anneeCourante;

    const terminesCetteAnnee = termines.filter((l) => l.endDate && l.endDate.startsWith(anneeCourante));
    const nbTerminesAnnee = terminesCetteAnnee.length;

    const objectifSauvegarde = parseInt(localStorage.getItem("challenge_objectif"), 10) || 30;
    const objTextEl = document.getElementById("challenge-objectif-text");
    const progEl = document.getElementById("progression-challenge");
    const pourcentEl = document.getElementById("challenge-pourcentage");
    const barEl = document.getElementById("challenge-bar");

    if (objTextEl) objTextEl.textContent = objectifSauvegarde;
    if (progEl) progEl.textContent = `${nbTerminesAnnee} livre${nbTerminesAnnee > 1 ? "s" : ""}`;

    const pourcentage = Math.min(100, Math.round((nbTerminesAnnee / objectifSauvegarde) * 100));
    if (pourcentEl) pourcentEl.textContent = `${pourcentage}%`;
    if (barEl) barEl.style.width = `${pourcentage}%`;

    // 3. Dernières lectures
    const container = document.getElementById("derniers-livres");
    if (container) {
      container.innerHTML = "";
      if (livres.length === 0) {
        container.innerHTML = `<p class="empty-state">Aucun livre pour le moment.<br><a href="recherche.html" style="color: var(--primary-dark); font-weight: 600;">Rechercher un livre</a></p>`;
      } else {
        const derniers = livres.slice(-10).reverse();
        derniers.forEach((livre) => {
          const carte = creerCarteLivre(livre, {
            onDelete: () => rafraichirDashboard(),
            onUpdate: () => rafraichirDashboard(),
          });
          container.appendChild(carte);
        });
      }
    }

    // 4. Graphiques Chart.js
    if (typeof Chart !== "undefined") {
      mettreAJourGraphiques(termines);
    }
  }

  // Gestion de la modification de l'objectif
  const btnModifier = document.getElementById("btn-modifier-challenge");
  const editBox = document.getElementById("challenge-edit-box");
  const inputObj = document.getElementById("input-challenge-objectif");
  const btnSaveObj = document.getElementById("btn-sauvegarder-challenge");

  if (btnModifier && editBox && inputObj && btnSaveObj) {
    btnModifier.onclick = () => {
      const current = parseInt(localStorage.getItem("challenge_objectif"), 10) || 30;
      inputObj.value = current;
      editBox.style.display = editBox.style.display === "none" ? "flex" : "none";
      if (editBox.style.display === "flex") inputObj.focus();
    };

    btnSaveObj.onclick = () => {
      const val = parseInt(inputObj.value, 10);
      if (val > 0) {
        localStorage.setItem("challenge_objectif", val);
        editBox.style.display = "none";
        rafraichirDashboard();
      }
    };
  }

  // Sélecteur d'année pour le graphe mensuel
  const selectAnnee = document.getElementById("select-annee-mois");
  if (selectAnnee) {
    selectAnnee.onchange = () => {
      const livres = getLivres();
      const termines = livres.filter((l) => normaliserChaine(l.status).includes("termin"));
      mettreAJourGraphiqueMois(termines, selectAnnee.value);
    };
  }

  rafraichirDashboard();
}

function mettreAJourGraphiques(livresTermines) {
  // Calculer toutes les années présentes
  const anneesMap = {};
  const currentYear = new Date().getFullYear().toString();

  livresTermines.forEach((l) => {
    if (l.endDate) {
      const annee = l.endDate.substring(0, 4);
      if (annee && !isNaN(annee)) {
        anneesMap[annee] = (anneesMap[annee] || 0) + 1;
      }
    }
  });

  const listeAnnees = Object.keys(anneesMap).sort();
  if (!listeAnnees.includes(currentYear)) {
    listeAnnees.push(currentYear);
    listeAnnees.sort();
  }

  // Remplir le sélecteur d'année
  const selectAnnee = document.getElementById("select-annee-mois");
  if (selectAnnee) {
    const valActuelle = selectAnnee.value || currentYear;
    selectAnnee.innerHTML = listeAnnees
      .map((a) => `<option value="${a}" ${a === valActuelle ? "selected" : ""}>${a}</option>`)
      .join("");
  }

  const anneeSelectionnee = selectAnnee ? selectAnnee.value || currentYear : currentYear;
  mettreAJourGraphiqueMois(livresTermines, anneeSelectionnee);
  mettreAJourGraphiqueAnnee(anneesMap);
}

function mettreAJourGraphiqueMois(livresTermines, anneeCible) {
  const graphMoisEl = document.getElementById("graph-mois");
  if (!graphMoisEl) return;

  const moisStats = new Array(12).fill(0);
  livresTermines.forEach((l) => {
    if (l.endDate && l.endDate.startsWith(anneeCible)) {
      const date = new Date(l.endDate);
      const mois = date.getMonth();
      if (!isNaN(mois) && mois >= 0 && mois < 12) {
        moisStats[mois]++;
      }
    }
  });

  const labels = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

  if (chartMoisInstance) {
    chartMoisInstance.destroy();
  }

  chartMoisInstance = new Chart(graphMoisEl, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: `Livres lus en ${anneeCible}`,
          data: moisStats,
          backgroundColor: "#c9a0ff",
          borderRadius: 6,
          hoverBackgroundColor: "#b48eff",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1, precision: 0 },
        },
      },
      plugins: {
        legend: { display: false },
      },
    },
  });
}

function mettreAJourGraphiqueAnnee(anneesMap) {
  const graphAnneeEl = document.getElementById("graph-annee");
  if (!graphAnneeEl) return;

  const annees = Object.keys(anneesMap).sort();
  const counts = annees.map((a) => anneesMap[a]);

  if (chartAnneeInstance) {
    chartAnneeInstance.destroy();
  }

  chartAnneeInstance = new Chart(graphAnneeEl, {
    type: "bar",
    data: {
      labels: annees.length > 0 ? annees : ["Aucune donnée"],
      datasets: [
        {
          label: "Livres lus",
          data: counts.length > 0 ? counts : [0],
          backgroundColor: "#b48eff",
          borderRadius: 6,
          hoverBackgroundColor: "#8a3ab9",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1, precision: 0 },
        },
      },
      plugins: {
        legend: { display: false },
      },
    },
  });
}

// ==========================================================================
// PAGE BIBLIOTHÈQUE
// ==========================================================================

function initialiserBibliotheque() {
  const container = document.getElementById("library");
  const selectFiltre = document.getElementById("filtre-statut");
  const inputRecherche = document.getElementById("filtre-texte");

  function afficherLivresFiltres() {
    if (!container) return;
    container.innerHTML = "";

    const livres = getLivres();
    const statutFiltre = selectFiltre ? selectFiltre.value : "Tous";
    const texteRecherche = inputRecherche ? normaliserChaine(inputRecherche.value) : "";

    const livresFiltres = livres.filter((l) => {
      // Filtre statut
      if (statutFiltre !== "Tous") {
        const s = normaliserChaine(l.status);
        const cible = normaliserChaine(statutFiltre);
        if (cible.includes("lire") && (!s.includes("lire") || s.includes("termin") || s.includes("cours"))) return false;
        if (cible.includes("cours") && !s.includes("cours")) return false;
        if (cible.includes("termin") && !s.includes("termin")) return false;
        if (cible.includes("abandon") && !s.includes("abandon")) return false;
      }

      // Filtre texte
      if (texteRecherche) {
        const titre = normaliserChaine(l.title);
        const auteurs = normaliserChaine(l.authors);
        if (!titre.includes(texteRecherche) && !auteurs.includes(texteRecherche)) return false;
      }

      return true;
    });

    if (livresFiltres.length === 0) {
      container.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1;">Aucun livre trouvé correspondant aux critères.</div>`;
      return;
    }

    livresFiltres.forEach((livre) => {
      const carte = creerCarteLivre(livre, {
        onDelete: () => afficherLivresFiltres(),
        onUpdate: () => afficherLivresFiltres(),
      });
      container.appendChild(carte);
    });
  }

  if (selectFiltre) selectFiltre.addEventListener("change", afficherLivresFiltres);
  if (inputRecherche) inputRecherche.addEventListener("input", afficherLivresFiltres);

  afficherLivresFiltres();

  // EXPORT CSV
  const exportBtn = document.getElementById("export-csv");
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      const livres = getLivres();
      if (livres.length === 0) {
        afficherNotification("Votre bibliothèque est vide, aucun livre à exporter.");
        return;
      }

      const entetes = ["Titre", "Auteur(s)", "Statut", "Note", "Date debut", "Date fin", "Genre", "Resume"];
      const lignes = livres.map((l) =>
        [
          l.title || "",
          l.authors || "",
          l.status || "À lire",
          l.note || "",
          l.startDate || "",
          l.endDate || "",
          l.genre || "",
          (l.description || "").replace(/\r?\n/g, " ").replace(/"/g, '""'),
        ]
          .map((val) => `"${val}"`)
          .join(";")
      );

      // Préfixe UTF-8 BOM (\uFEFF) pour un affichage impeccable des accents dans Excel
      const csvContent = "\uFEFF" + [entetes.join(";"), ...lignes].join("\r\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `ma_bibliotheque_${getLocalDateString()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  }

  // IMPORT CSV
  const importInput = document.getElementById("import-csv");
  if (importInput) {
    importInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function (event) {
        try {
          const contenu = event.target.result;
          const rows = parserCSV(contenu);

          if (!rows || rows.length < 2) {
            afficherNotification("Le fichier CSV semble vide ou invalide.", "Erreur d'import");
            return;
          }

          const entetes = rows[0].map((h) => normaliserChaine(h));
          const isGoodreads = entetes.some((h) => h.includes("book id") || h.includes("exclusive shelf"));

          let colTitre = entetes.findIndex((h) => h.includes("titre") || h.includes("title"));
          let colAuteur = entetes.findIndex((h) => h.includes("auteur") || h.includes("author"));
          let colStatut = entetes.findIndex((h) => h.includes("statut") || h.includes("exclusive shelf") || h.includes("shelf"));
          let colNote = entetes.findIndex((h) => h.includes("my rating") || h.includes("note") || h.includes("rating"));
          let colDebut = entetes.findIndex((h) => h.includes("date added") || h.includes("debut") || h.includes("start"));
          let colFin = entetes.findIndex((h) => h.includes("date read") || h.includes("fin") || h.includes("end"));
          let colGenre = entetes.findIndex((h) => h.includes("genre"));
          let colResume = entetes.findIndex((h) => h.includes("resume") || h.includes("description"));

          if (colTitre === -1) colTitre = isGoodreads ? 1 : 0;
          if (colAuteur === -1) colAuteur = isGoodreads ? 2 : 1;

          const livres = getLivres();
          let ajouts = 0;
          let misesAJour = 0;

          for (let i = 1; i < rows.length; i++) {
            const vals = rows[i];
            const titre = (vals[colTitre] || "").trim();
            const auteur = (vals[colAuteur] || "").trim();
            if (!titre) continue;

            let statut = "À lire";
            if (colStatut !== -1 && vals[colStatut]) {
              const rawStatut = normaliserChaine(vals[colStatut]);
              if (rawStatut === "read" || rawStatut.includes("termin")) statut = "Terminé";
              else if (rawStatut === "currently-reading" || rawStatut.includes("cours")) statut = "En cours";
              else if (rawStatut.includes("dnf") || rawStatut.includes("abandon")) statut = "Abandonné";
            }

            let note = "";
            if (colNote !== -1 && vals[colNote]) {
              const n = parseFloat(vals[colNote]);
              if (!isNaN(n) && n > 0) note = Math.round(n).toString();
            }

            const normaliserDateStr = (str) => {
              if (!str) return "";
              const nettoye = str.replace(/\//g, "-").trim();
              if (/^\d{4}-\d{2}-\d{2}$/.test(nettoye)) return nettoye;
              return "";
            };

            const dateDebut = colDebut !== -1 ? normaliserDateStr(vals[colDebut]) : "";
            const dateFin = colFin !== -1 ? normaliserDateStr(vals[colFin]) : "";
            const genre = colGenre !== -1 && vals[colGenre] ? vals[colGenre].trim() : "Inconnu";
            const resume = colResume !== -1 && vals[colResume] ? vals[colResume].trim() : "Pas de résumé disponible.";

            const titreNorm = normaliserChaine(titre);
            const auteurNorm = normaliserChaine(auteur);
            const existant = livres.find(
              (l) => normaliserChaine(l.title) === titreNorm && (!auteur || normaliserChaine(l.authors) === auteurNorm)
            );

            if (existant) {
              if (statut) existant.status = statut;
              if (note) existant.note = note;
              if (dateDebut) existant.startDate = dateDebut;
              if (dateFin) existant.endDate = dateFin;
              if (genre && genre !== "Inconnu" && existant.genre === "Inconnu") existant.genre = genre;
              misesAJour++;
            } else {
              livres.push({
                id: "book_" + Date.now() + "_" + i + "_" + Math.random().toString(36).substring(2, 6),
                title: titre,
                authors: auteur || "Auteur inconnu",
                status: statut,
                note: note,
                startDate: dateDebut,
                endDate: dateFin,
                genre: genre,
                description: resume,
                cover: "",
              });
              ajouts++;
            }
          }

          sauvegarderLivres(livres);
          afficherNotification(
            `Import terminé avec succès : ${ajouts} nouveau(x) livre(s) ajouté(s), ${misesAJour} mis à jour.`,
            "Import réussi"
          );
          afficherLivresFiltres();
        } catch (err) {
          console.error("Erreur parsing CSV :", err);
          afficherNotification("Une erreur est survenue lors de la lecture du fichier CSV.", "Erreur d'import");
        } finally {
          importInput.value = "";
        }
      };
      reader.readAsText(file);
    });
  }

  // ENRICHISSEMENT API
  const enrichirBtn = document.getElementById("enrichir-fiches");
  const chargementDiv = document.getElementById("chargement-enrichissement");
  const stopBtn = document.getElementById("enrichir-stop");
  const enrichirTexte = document.getElementById("enrichissement-texte");

  let enrichissementEnCours = false;

  if (enrichirBtn && chargementDiv) {
    if (stopBtn) {
      stopBtn.onclick = () => {
        enrichissementEnCours = false;
        if (enrichirTexte) enrichirTexte.textContent = "Arrêt de l'enrichissement demandé...";
      };
    }

    enrichirBtn.addEventListener("click", async () => {
      const livres = getLivres();
      const aTraiter = livres.filter(
        (l) => !l.cover || l.description === "Pas de résumé disponible." || l.genre === "Inconnu"
      );

      if (aTraiter.length === 0) {
        afficherNotification("Tous vos livres ont déjà une couverture et une fiche complète !");
        return;
      }

      chargementDiv.style.display = "flex";
      enrichirBtn.disabled = true;
      enrichissementEnCours = true;
      let enrichis = 0;

      for (let i = 0; i < aTraiter.length; i++) {
        if (!enrichissementEnCours) break;

        const livre = aTraiter[i];
        if (enrichirTexte) {
          enrichirTexte.textContent = `🔄 Enrichissement : ${i + 1} / ${aTraiter.length} (${livre.title})`;
        }

        const donnees = await enrichirLivreViaAPI(livre.title, livre.authors);

        if (donnees === "LIMIT") {
          afficherNotification(
            "Quota Google temporairement atteint. Vos données actuelles sont sauvegardées.",
            "Quota atteint"
          );
          break;
        }

        if (donnees) {
          let modifie = false;
          if (donnees.cover && !livre.cover) {
            livre.cover = donnees.cover;
            modifie = true;
          }
          if (
            donnees.description &&
            donnees.description !== "Pas de résumé disponible." &&
            (!livre.description || livre.description === "Pas de résumé disponible.")
          ) {
            livre.description = donnees.description;
            modifie = true;
          }
          if (donnees.genre && donnees.genre !== "Inconnu" && (!livre.genre || livre.genre === "Inconnu")) {
            livre.genre = donnees.genre;
            modifie = true;
          }

          if (modifie) {
            enrichis++;
            sauvegarderLivres(livres);
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 600));
      }

      enrichissementEnCours = false;
      chargementDiv.style.display = "none";
      enrichirBtn.disabled = false;
      afficherNotification(`${enrichis} livre(s) enrichi(s) sur ${aTraiter.length} analysé(s).`, "Enrichissement terminé");
      afficherLivresFiltres();
    });
  }
}

// Parser CSV robuste gérant virgules, points-virgules et retours à la ligne entre guillemets
function parserCSV(texte) {
  const premiereLigne = texte.slice(0, texte.indexOf("\n") !== -1 ? texte.indexOf("\n") : texte.length);
  const countVirgule = (premiereLigne.match(/,/g) || []).length;
  const countPointVirgule = (premiereLigne.match(/;/g) || []).length;
  const separateur = countPointVirgule > countVirgule ? ";" : ",";

  const lignes = [];
  let ligneCourante = [];
  let champCourant = "";
  let dansGuillemets = false;

  for (let i = 0; i < texte.length; i++) {
    const char = texte[i];
    const nextChar = texte[i + 1];

    if (char === '"') {
      if (dansGuillemets && nextChar === '"') {
        champCourant += '"';
        i++;
      } else {
        dansGuillemets = !dansGuillemets;
      }
    } else if (char === separateur && !dansGuillemets) {
      ligneCourante.push(champCourant.trim());
      champCourant = "";
    } else if ((char === "\r" || char === "\n") && !dansGuillemets) {
      if (char === "\r" && nextChar === "\n") i++;
      ligneCourante.push(champCourant.trim());
      if (ligneCourante.some((v) => v.length > 0)) {
        lignes.push(ligneCourante);
      }
      ligneCourante = [];
      champCourant = "";
    } else {
      champCourant += char;
    }
  }

  if (champCourant.length > 0 || ligneCourante.length > 0) {
    ligneCourante.push(champCourant.trim());
    if (ligneCourante.some((v) => v.length > 0)) {
      lignes.push(ligneCourante);
    }
  }

  return lignes;
}

async function enrichirLivreViaAPI(titre, auteur) {
  let res = await chercherGoogleBooks(titre, auteur);
  if (!res || res === "LIMIT" || !res.cover) {
    const resOL = await chercherOpenLibrary(titre, auteur);
    if (resOL && (resOL.cover || resOL.description !== "Pas de résumé disponible.")) {
      return resOL;
    }
  }
  return res === "LIMIT" ? null : res;
}

async function chercherGoogleBooks(titre, auteur) {
  try {
    const query = `${titre} ${auteur}`.trim();
    const keyParam = typeof GOOGLE_API_KEY !== "undefined" && GOOGLE_API_KEY ? `&key=${GOOGLE_API_KEY}` : "";
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1${keyParam}`
    );

    if (response.status === 429) return "LIMIT";
    if (!response.ok) return null;

    const data = await response.json();
    const book = data.items?.[0]?.volumeInfo;
    if (!book) return null;

    return {
      cover: book.imageLinks?.thumbnail ? book.imageLinks.thumbnail.replace("http://", "https://") : "",
      description: book.description ? book.description.trim() : "Pas de résumé disponible.",
      genre: Array.isArray(book.categories) && book.categories.length > 0 ? book.categories[0].trim() : "Inconnu",
    };
  } catch (e) {
    return null;
  }
}

async function chercherOpenLibrary(titre, auteur) {
  try {
    const query = `${titre} ${auteur}`.trim();
    const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=1`);
    if (!response.ok) return null;

    const data = await response.json();
    const book = data.docs?.[0];
    if (!book) return null;

    return {
      cover: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : "",
      description: "Pas de résumé disponible.",
      genre: Array.isArray(book.subject) && book.subject.length > 0 ? book.subject[0] : "Inconnu",
    };
  } catch (e) {
    return null;
  }
}

// ==========================================================================
// PAGE PILE À LIRE (PAL) & ROULETTE
// ==========================================================================

function initialiserPAL() {
  const palContainer = document.getElementById("pal-library");
  const countElement = document.getElementById("pal-count");
  const canvas = document.getElementById("wheel-canvas");
  const ctx = canvas ? canvas.getContext("2d") : null;
  const spinBtn = document.getElementById("spin-btn");
  const modal = document.getElementById("confirm-pal-modal");
  const modalTitre = document.getElementById("modal-livre-titre");
  const btnValider = document.getElementById("btn-valider-lecture");
  const btnAnnuler = document.getElementById("btn-annuler-lecture");
  const messageElement = document.getElementById("pal-selection-message");

  let livresPal = [];
  let livreSelectionne = null;
  let currentAngle = 0;
  let isSpinning = false;

  const couleurs = ["#ffd1dc", "#e0bbff", "#c9a0ff", "#b48eff", "#d8b4f8", "#ffcbf2", "#bde0fe", "#a2d2ff"];

  function getLivresPal() {
    const tous = getLivres();
    return tous.filter((l) => {
      const s = normaliserChaine(l.status);
      return (s.includes("lire") || s === "to-read") && !s.includes("termin") && !s.includes("cours");
    });
  }

  function rafraichirAffichage() {
    livresPal = getLivresPal();
    if (countElement) countElement.textContent = livresPal.length;

    if (palContainer) {
      palContainer.innerHTML = "";
      if (livresPal.length === 0) {
        palContainer.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1;">Votre PAL est actuellement vide !<br>Ajoutez des livres au statut "À lire" depuis la page Recherche.</div>`;
      } else {
        livresPal.forEach((livre) => {
          const carte = creerCarteLivre(livre, {
            onDelete: () => rafraichirAffichage(),
            onUpdate: () => rafraichirAffichage(),
          });
          palContainer.appendChild(carte);
        });
      }
    }

    if (spinBtn) {
      spinBtn.disabled = livresPal.length === 0;
      if (livresPal.length === 0) {
        spinBtn.title = "Ajoutez des livres à lire pour lancer la roue.";
      } else {
        spinBtn.title = "Tirer au sort ma prochaine lecture";
      }
    }

    dessinerRoue(currentAngle);
  }

  function dessinerRoue(angleDecalage) {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const nbLivres = livresPal.length;
    const centreX = canvas.width / 2;
    const centreY = canvas.height / 2;
    const rayon = centreX - 10;

    if (nbLivres === 0) {
      ctx.beginPath();
      ctx.arc(centreX, centreY, rayon, 0, 2 * Math.PI);
      ctx.fillStyle = "#f7fafc";
      ctx.fill();
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#a0aec0";
      ctx.font = "bold 15px 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("PAL vide", centreX, centreY);
      return;
    }

    const arc = (2 * Math.PI) / nbLivres;

    for (let i = 0; i < nbLivres; i++) {
      const start = angleDecalage + i * arc;
      const end = start + arc;

      ctx.beginPath();
      ctx.moveTo(centreX, centreY);
      ctx.arc(centreX, centreY, rayon, start, end);
      ctx.fillStyle = couleurs[i % couleurs.length];
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.translate(centreX, centreY);
      ctx.rotate(start + arc / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#2d3748";
      ctx.font = "bold 11px 'Segoe UI', sans-serif";

      let titre = livresPal[i].title;
      if (titre.length > 16) titre = titre.substring(0, 14) + "...";
      ctx.fillText(titre, rayon - 12, 4);
      ctx.restore();
    }

    // Cercle décoratif central (axe)
    ctx.beginPath();
    ctx.arc(centreX, centreY, 18, 0, 2 * Math.PI);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.strokeStyle = "#c9a0ff";
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  if (spinBtn) {
    spinBtn.addEventListener("click", () => {
      if (isSpinning) return;

      if (livresPal.length === 0) {
        afficherNotification("Votre PAL est vide ! Ajoutez des livres à lire pour pouvoir utiliser la roue.");
        return;
      }

      if (messageElement) messageElement.textContent = "";

      isSpinning = true;
      spinBtn.disabled = true;

      const tau = 2 * Math.PI;
      const toursComplets = (Math.floor(Math.random() * 4) + 4) * tau;
      const angleAleatoire = Math.random() * tau;
      const angleCible = currentAngle + toursComplets + angleAleatoire;
      const duree = 4000;
      const depart = performance.now();
      const debutAngle = currentAngle;

      function animer(temps) {
        const ecoule = temps - depart;
        const progression = Math.min(ecoule / duree, 1);
        const easeOut = 1 - Math.pow(1 - progression, 3);

        currentAngle = debutAngle + (angleCible - debutAngle) * easeOut;
        dessinerRoue(currentAngle);

        if (progression < 1) {
          requestAnimationFrame(animer);
        } else {
          isSpinning = false;
          spinBtn.disabled = false;
          currentAngle = currentAngle % tau;

          // Calcul mathématique précis du secteur sous la flèche (haut = 3*PI/2)
          const arc = tau / livresPal.length;
          const diff = ((3 * Math.PI / 2 - currentAngle) % tau + tau) % tau;
          const indexGagnant = Math.floor(diff / arc) % livresPal.length;

          livreSelectionne = livresPal[indexGagnant];

          if (messageElement) {
            messageElement.textContent = `🎯 Tirage au sort : ${livreSelectionne.title} !`;
          }

          if (modal && modalTitre) {
            modalTitre.textContent = `${livreSelectionne.title} — ${livreSelectionne.authors}`;
            modal.style.display = "flex";
          }
        }
      }

      requestAnimationFrame(animer);
    });
  }

  if (btnAnnuler) {
    btnAnnuler.addEventListener("click", () => {
      if (modal) modal.style.display = "none";
      livreSelectionne = null;
    });
  }

  if (btnValider) {
    btnValider.addEventListener("click", () => {
      if (!livreSelectionne) return;

      const dateAujourdhui = getLocalDateString();
      const tous = getLivres();
      const index = tous.findIndex((l) => l.id === livreSelectionne.id);

      if (index !== -1) {
        tous[index].status = "En cours";
        if (!tous[index].startDate) tous[index].startDate = dateAujourdhui;
        sauvegarderLivres(tous);
        afficherNotification(
          `"${livreSelectionne.title}" est maintenant passé au statut "En cours". Bonne lecture !`,
          "Lecture lancée"
        );
      }

      if (modal) modal.style.display = "none";
      livreSelectionne = null;
      rafraichirAffichage();
    });
  }

  rafraichirAffichage();
}

// ==========================================================================
// PAGE RECHERCHE (Google Books & Open Library)
// ==========================================================================

function initialiserRecherche() {
  const searchForm = document.getElementById("search-form");
  const searchInput = document.getElementById("search-input");
  const searchBtn = document.getElementById("search-btn");
  const resultDiv = document.getElementById("result");

  // Pop-up Infos
  const infoPopup = document.getElementById("info-popup");
  const infoClose = document.getElementById("info-close");
  const infoCancel = document.getElementById("info-cancel");
  const infoTitle = document.getElementById("info-title");
  const infoAuthors = document.getElementById("info-authors");
  const infoGenre = document.getElementById("info-genre");
  const infoDate = document.getElementById("info-date");
  const infoDescription = document.getElementById("info-description");
  const infoCover = document.getElementById("info-cover");
  const infoAddBtn = document.getElementById("info-add-btn");

  // Pop-up Ajout
  const addPopup = document.getElementById("add-popup");
  const addClose = document.getElementById("add-close");
  const addCancel = document.getElementById("add-cancel");
  const addSave = document.getElementById("add-save");
  const addBookTitle = document.getElementById("add-book-title");
  const addStatus = document.getElementById("add-status");
  const fieldStart = document.getElementById("field-start");
  const fieldEnd = document.getElementById("field-end");
  const fieldNote = document.getElementById("field-note");
  const addStart = document.getElementById("add-start");
  const addEnd = document.getElementById("add-end");
  const addNote = document.getElementById("add-note");

  let livreSelectionneRecherche = null;

  function ajusterChampsStatut() {
    if (!addStatus) return;
    const s = addStatus.value;
    if (s === "À lire") {
      fieldStart.style.display = "none";
      fieldEnd.style.display = "none";
      fieldNote.style.display = "none";
    } else if (s === "En cours") {
      fieldStart.style.display = "block";
      fieldEnd.style.display = "none";
      fieldNote.style.display = "none";
      if (!addStart.value) addStart.value = getLocalDateString();
    } else if (s === "Terminé") {
      fieldStart.style.display = "block";
      fieldEnd.style.display = "block";
      fieldNote.style.display = "block";
      if (!addEnd.value) addEnd.value = getLocalDateString();
    } else if (s === "Abandonné") {
      fieldStart.style.display = "block";
      fieldEnd.style.display = "block";
      fieldNote.style.display = "none";
    }
  }

  if (addStatus) {
    addStatus.addEventListener("change", ajusterChampsStatut);
  }

  function ouvrirPopupAjout(book) {
    livreSelectionneRecherche = { ...book };
    if (addBookTitle) addBookTitle.textContent = `${book.title} — ${book.authors}`;
    if (addStatus) addStatus.value = "À lire";
    if (addStart) addStart.value = "";
    if (addEnd) addEnd.value = "";
    if (addNote) addNote.value = "";
    ajusterChampsStatut();
    if (infoPopup) infoPopup.style.display = "none";
    if (addPopup) addPopup.style.display = "flex";
  }

  function ouvrirPopupInfos(book) {
    livreSelectionneRecherche = { ...book };
    if (infoTitle) infoTitle.textContent = book.title;
    if (infoAuthors) infoAuthors.textContent = book.authors;
    if (infoGenre) infoGenre.textContent = book.genre || "Inconnu";
    if (infoDate) infoDate.textContent = book.publishedDate || "Non renseignée";
    if (infoDescription) infoDescription.textContent = book.description || "Pas de résumé disponible.";
    if (infoCover) infoCover.src = book.cover || PLACEHOLDER_COVER;
    if (infoPopup) infoPopup.style.display = "flex";
  }

  if (infoClose) infoClose.onclick = () => (infoPopup.style.display = "none");
  if (infoCancel) infoCancel.onclick = () => (infoPopup.style.display = "none");
  if (addClose) addClose.onclick = () => (addPopup.style.display = "none");
  if (addCancel) addCancel.onclick = () => (addPopup.style.display = "none");

  if (infoAddBtn) {
    infoAddBtn.onclick = () => {
      if (livreSelectionneRecherche) ouvrirPopupAjout(livreSelectionneRecherche);
    };
  }

  if (addSave) {
    addSave.onclick = () => {
      if (!livreSelectionneRecherche) return;
      const livreAEnregistrer = {
        ...livreSelectionneRecherche,
        status: addStatus ? addStatus.value : "À lire",
        note: addNote ? addNote.value : "",
        startDate: addStart ? addStart.value : "",
        endDate: addEnd ? addEnd.value : "",
      };

      const succes = ajouterLivre(livreAEnregistrer);
      if (succes) {
        if (addPopup) addPopup.style.display = "none";
        livreSelectionneRecherche = null;
        afficherNotification("Le livre a été ajouté à votre bibliothèque !", "Livre ajouté");
      }
    };
  }

  function filtrerEtFormaterLivres(items) {
    if (!items || items.length === 0) return [];
    const motsArchives = [
      "journal des débats",
      "revue des",
      "bulletin de",
      "gazette",
      "annales",
      "procès-verbal",
      "assemblée nationale",
    ];
    const vus = new Set();

    return items
      .map((item) => {
        const b = item.volumeInfo || {};
        const titreComplet = b.subtitle ? `${b.title} : ${b.subtitle}` : b.title || "Titre inconnu";
        const annee = parseInt(b.publishedDate?.substring(0, 4), 10) || 0;
        const aAuteur = Array.isArray(b.authors) && b.authors.length > 0;
        const auteurNom = aAuteur ? b.authors.join(", ") : "Auteur inconnu";

        return {
          id: item.id || "gb_" + Math.random().toString(36).substring(2, 8),
          title: titreComplet,
          authors: auteurNom,
          cover: b.imageLinks?.thumbnail ? b.imageLinks.thumbnail.replace("http://", "https://") : "",
          description: b.description ? b.description.trim() : "Pas de résumé disponible.",
          genre: Array.isArray(b.categories) && b.categories.length > 0 ? b.categories[0].trim() : "Inconnu",
          publishedDate: b.publishedDate || "",
          annee: annee,
        };
      })
      .filter((b) => {
        const cleUnique = `${normaliserChaine(b.title)}|${normaliserChaine(b.authors)}`;
        if (vus.has(cleUnique)) return false;
        vus.add(cleUnique);

        const t = b.title.toLowerCase();
        if (motsArchives.some((m) => t.includes(m))) return false;
        if (b.authors === "Auteur inconnu" && !b.cover) return false;
        return true;
      });
  }

  if (searchForm) {
    searchForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const query = searchInput ? searchInput.value.trim() : "";
      if (!query) {
        afficherNotification("Veuillez saisir un titre, un auteur ou un ISBN.");
        return;
      }

      resultDiv.innerHTML = `<p class="search-hint">🔍 Recherche en cours pour <strong>"${escapeHtml(query)}"</strong>...</p>`;
      if (searchBtn) searchBtn.disabled = true;

      let livresTrouves = [];

      try {
        const keyParam = typeof GOOGLE_API_KEY !== "undefined" && GOOGLE_API_KEY ? `&key=${GOOGLE_API_KEY}` : "";
        const url1 = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&printType=books&maxResults=30${keyParam}`;

        const resGoogle = await fetch(url1);
        if (resGoogle.ok) {
          const data = await resGoogle.json();
          if (data.items) {
            livresTrouves = filtrerEtFormaterLivres(data.items);
          }
        }
      } catch (err) {
        console.warn("Erreur Google Books :", err);
      }

      // Repli Open Library si 0 résultat ou échec Google
      if (livresTrouves.length === 0) {
        try {
          const resOL = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20`);
          if (resOL.ok) {
            const dataOL = await resOL.json();
            if (dataOL.docs && dataOL.docs.length > 0) {
              livresTrouves = dataOL.docs
                .filter((b) => b.author_name && b.author_name.length > 0)
                .map((b) => ({
                  id: "ol_" + (b.key || Math.random().toString(36).substring(2, 8)),
                  title: b.title || "Titre inconnu",
                  authors: b.author_name.join(", "),
                  cover: b.cover_i ? `https://covers.openlibrary.org/b/id/${b.cover_i}-M.jpg` : "",
                  description: "Pas de résumé disponible.",
                  genre: Array.isArray(b.subject) && b.subject.length > 0 ? b.subject[0] : "Inconnu",
                  publishedDate: b.first_publish_year ? b.first_publish_year.toString() : "",
                  annee: b.first_publish_year || 0,
                }));
            }
          }
        } catch (err) {
          console.error("Erreur Open Library :", err);
        }
      }

      if (searchBtn) searchBtn.disabled = false;
      resultDiv.innerHTML = "";

      if (livresTrouves.length === 0) {
        resultDiv.innerHTML = `<div class="empty-state">Aucun livre trouvé pour "${escapeHtml(query)}". Essayez avec d'autres mots-clés.</div>`;
        return;
      }

      // Tri par pertinence
      const motsCles = query.toLowerCase().split(/\s+/).filter((m) => m.length > 1);
      livresTrouves.sort((a, b) => {
        const titreA = a.title.toLowerCase();
        const titreB = b.title.toLowerCase();
        const scoreA = motsCles.filter((m) => titreA.includes(m)).length;
        const scoreB = motsCles.filter((m) => titreB.includes(m)).length;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return b.annee - a.annee;
      });

      livresTrouves.forEach((book) => {
        const item = document.createElement("div");
        item.classList.add("result-item");

        const anneeStr = book.publishedDate ? ` (${book.publishedDate.substring(0, 4)})` : "";
        const descCourte =
          book.description.length > 200 ? book.description.substring(0, 200) + "..." : book.description;

        item.innerHTML = `
          <div class="image-and-button">
            <img src="${escapeHtml(book.cover) || PLACEHOLDER_COVER}" alt="Couverture de ${escapeHtml(book.title)}" loading="lazy">
            <button class="add-button" type="button">+ Ajouter</button>
          </div>
          <div class="book-content">
            <h3>${escapeHtml(book.title)}${escapeHtml(anneeStr)}</h3>
            <h4>${escapeHtml(book.authors)}</h4>
            <p>${escapeHtml(descCourte)}</p>
          </div>
        `;

        item.addEventListener("click", (evt) => {
          if (evt.target.classList.contains("add-button")) return;
          ouvrirPopupInfos(book);
        });

        const btnAjouter = item.querySelector(".add-button");
        btnAjouter.addEventListener("click", (evt) => {
          evt.stopPropagation();
          ouvrirPopupAjout(book);
        });

        resultDiv.appendChild(item);
      });
    });
  }
}

// ==========================================================================
// PAGE SUIVI DES SAGAS
// ==========================================================================

function getSagas() {
  try {
    return JSON.parse(localStorage.getItem("sagas")) || [];
  } catch (e) {
    return [];
  }
}

function sauvegarderSagas(sagas) {
  localStorage.setItem("sagas", JSON.stringify(sagas));
}

function initialiserSagas() {
  const container = document.getElementById("sagas-container");
  const btnNouveau = document.getElementById("btn-nouvelle-saga");
  const selectFiltre = document.getElementById("filtre-saga-statut");
  const inputRecherche = document.getElementById("filtre-saga-texte");

  // Modale Saga principale
  const modal = document.getElementById("saga-modal");
  const modalTitle = document.getElementById("saga-modal-title");
  const modalClose = document.getElementById("saga-modal-close");
  const form = document.getElementById("saga-form");
  const selectLivreSource = document.getElementById("saga-select-livre-source");
  const inputTitre = document.getElementById("saga-input-titre");
  const inputAuteur = document.getElementById("saga-input-auteur");
  const inputGenre = document.getElementById("saga-input-genre");
  const inputCover = document.getElementById("saga-input-cover");
  const inputStatutSaga = document.getElementById("saga-input-statut-saga");
  const inputStatutPerso = document.getElementById("saga-input-statut-perso");
  const inputTotal = document.getElementById("saga-input-total-tomes");
  const inputLus = document.getElementById("saga-input-lus-tomes");
  const inputProchain = document.getElementById("saga-input-prochain");
  const inputNotes = document.getElementById("saga-input-notes");
  const btnSupprimer = document.getElementById("saga-btn-supprimer");
  const btnAnnuler = document.getElementById("saga-btn-annuler");

  // Modale Association d'un livre existant
  const modalAssocier = document.getElementById("associer-livre-modal");
  const associerModalClose = document.getElementById("associer-modal-close");
  const associerSagaNom = document.getElementById("associer-saga-nom");
  const associerSelect = document.getElementById("associer-select-livre");
  const associerInputTome = document.getElementById("associer-input-tome");
  const associerForm = document.getElementById("associer-livre-form");
  const associerBtnAnnuler = document.getElementById("associer-btn-annuler");

  let sagaEnEditionId = null;
  let sagaCibleAssocier = null;

  function mettreAJourKPIs(sagas) {
    const totalEl = document.getElementById("stat-sagas-total");
    const enCoursEl = document.getElementById("stat-sagas-en-cours");
    const aCommencerEl = document.getElementById("stat-sagas-a-commencer");
    const termineesEl = document.getElementById("stat-sagas-terminees");
    const tomesRestantsEl = document.getElementById("stat-tomes-restants");

    const nbTotal = sagas.length;
    const nbEnCours = sagas.filter((s) => normaliserChaine(s.userStatus).includes("cours")).length;
    const nbACommencer = sagas.filter((s) => normaliserChaine(s.userStatus).includes("commencer")).length;
    const nbTerminees = sagas.filter((s) => normaliserChaine(s.userStatus).includes("termin")).length;

    const tomesRestants = sagas.reduce((acc, s) => {
      const u = normaliserChaine(s.userStatus);
      if (u.includes("termin") || u.includes("abandon")) return acc;
      const total = parseInt(s.totalVolumes, 10) || 0;
      const lus = parseInt(s.volumesRead, 10) || 0;
      return acc + Math.max(0, total - lus);
    }, 0);

    if (totalEl) totalEl.textContent = nbTotal;
    if (enCoursEl) enCoursEl.textContent = nbEnCours;
    if (aCommencerEl) aCommencerEl.textContent = nbACommencer;
    if (termineesEl) termineesEl.textContent = nbTerminees;
    if (tomesRestantsEl) tomesRestantsEl.textContent = tomesRestants;
  }

  function rafraichirSagas() {
    if (!container) return;
    const sagas = getSagas();
    mettreAJourKPIs(sagas);

    container.innerHTML = "";

    const filtreStatut = selectFiltre ? selectFiltre.value : "Tous";
    const texteRecherche = inputRecherche ? normaliserChaine(inputRecherche.value) : "";

    const sagasFiltrees = sagas.filter((s) => {
      if (filtreStatut !== "Tous") {
        const u = normaliserChaine(s.userStatus);
        const cible = normaliserChaine(filtreStatut);
        if (cible.includes("commencer") && !u.includes("commencer")) return false;
        if (cible.includes("cours") && !u.includes("cours")) return false;
        if (cible.includes("termin") && !u.includes("termin")) return false;
        if (cible.includes("pause") && !u.includes("pause")) return false;
        if (cible.includes("abandon") && !u.includes("abandon")) return false;
      }

      if (texteRecherche) {
        const t = normaliserChaine(s.title);
        const a = normaliserChaine(s.author);
        const g = normaliserChaine(s.genre);
        if (!t.includes(texteRecherche) && !a.includes(texteRecherche) && !g.includes(texteRecherche)) {
          return false;
        }
      }

      return true;
    });

    if (sagasFiltrees.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          ${sagas.length === 0 
            ? `Vous n'avez pas encore ajouté de saga.<br><button id="btn-empty-add" class="btn-primary" style="margin-top: 15px;">Ajouter ma première saga</button>`
            : `Aucune saga ne correspond à vos critères de recherche.`}
        </div>
      `;
      const emptyAddBtn = document.getElementById("btn-empty-add");
      if (emptyAddBtn) {
        emptyAddBtn.onclick = () => ouvrirModalSaga(null);
      }
      return;
    }

    const tousLivres = getLivres();

    sagasFiltrees.forEach((saga) => {
      const card = document.createElement("div");
      card.classList.add("saga-card");

      const tomesLus = parseInt(saga.volumesRead, 10) || 0;
      const totalTomes = Math.max(1, parseInt(saga.totalVolumes, 10) || 1);
      const tomesRestants = Math.max(0, totalTomes - tomesLus);
      const pourcentage = Math.min(100, Math.round((tomesLus / totalTomes) * 100));

      const coverHtml = saga.cover
        ? `<img src="${escapeHtml(saga.cover)}" alt="Couverture de ${escapeHtml(saga.title)}" class="saga-cover" onerror="this.onerror=null; this.src='${PLACEHOLDER_COVER}';">`
        : `<div class="saga-cover-placeholder">📚</div>`;

      const statutBadgeClass = getBadgeClasse(saga.userStatus);

      // Livres de la bibliothèque associés à cette saga
      const livresAssocies = tousLivres
        .filter((l) => l.sagaId === saga.id)
        .sort((a, b) => (parseInt(a.sagaTome, 10) || 0) - (parseInt(b.sagaTome, 10) || 0));

      card.innerHTML = `
        <div class="saga-card-header">
          ${coverHtml}
          <div class="saga-header-info">
            <h3 class="saga-title">${escapeHtml(saga.title)}</h3>
            <p class="saga-author">${escapeHtml(saga.author)}</p>
            <div class="saga-badges">
              <span class="badge-saga-status">📖 ${escapeHtml(saga.sagaStatus || "En cours")}</span>
              <span class="status-badge ${statutBadgeClass}">${escapeHtml(saga.userStatus || "À commencer")}</span>
              ${saga.genre ? `<span class="badge-genre">${escapeHtml(saga.genre)}</span>` : ""}
            </div>
          </div>
        </div>

        <div class="saga-progress-section">
          <div class="saga-progress-header">
            <span class="saga-tomes-count">Tomes lus : <strong>${tomesLus}</strong> / ${totalTomes}</span>
            <span class="saga-percent">${pourcentage}%</span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill" style="width: ${pourcentage}%;"></div>
          </div>
          <div class="saga-tomes-remaining">
            ${tomesRestants === 0 
              ? "🎉 Tous les tomes sont lus !" 
              : `Il vous reste : <strong>${tomesRestants}</strong> livre${tomesRestants > 1 ? "s" : ""} à lire`}
          </div>
        </div>

        <div class="saga-next-box">
          <span class="saga-next-icon">🎯</span>
          <div>
            <div class="saga-next-text">${tomesRestants === 0 ? "Statut de lecture :" : "Prochain tome à lire :"}</div>
            <div class="saga-next-title">${escapeHtml(tomesRestants === 0 ? "Saga complète lue !" : (saga.nextVolume || `Tome ${tomesLus + 1}`))}</div>
          </div>
        </div>

        <div class="saga-linked-section">
          <div class="saga-linked-header">
            <span class="saga-linked-title">📚 Livres dans ma bibliothèque (${livresAssocies.length})</span>
            <button type="button" class="btn-add-linked" title="Associer un livre de ma bibliothèque à cette saga">➕ Associer un livre</button>
          </div>
          ${livresAssocies.length > 0 ? `
            <div class="saga-linked-list">
              ${livresAssocies.map((l) => `
                <div class="saga-linked-item">
                  <div class="saga-linked-info">
                    <span class="saga-tome-tag">${l.sagaTome ? `T.${l.sagaTome}` : "Tome ?"}</span>
                    <span class="saga-linked-name" title="${escapeHtml(l.title)}">${escapeHtml(l.title)}</span>
                    <span class="status-badge ${getBadgeClasse(l.status)}" style="font-size: 0.7rem; padding: 1px 5px;">${escapeHtml(l.status)}</span>
                  </div>
                  <button type="button" class="saga-unlink-btn" data-book-id="${l.id}" title="Dissocier de la saga">✖</button>
                </div>
              `).join("")}
            </div>
          ` : `<p style="font-size: 0.78rem; color: #94a3b8; margin: 0; font-style: italic;">Aucun livre encore associé à cette saga.</p>`}
        </div>

        ${saga.notes ? `<p style="font-size: 0.85rem; color: #718096; margin: 0; font-style: italic;">📝 ${escapeHtml(saga.notes)}</p>` : ""}

        <div class="saga-actions">
          <button type="button" class="btn-quick-read" ${tomesLus >= totalTomes ? "disabled" : ""} title="Marquer un tome supplémentaire comme lu">
            ➕ 1 Tome lu
          </button>
          <div class="saga-card-buttons">
            <button type="button" class="btn-text btn-edit" title="Modifier la saga">✏️</button>
            <button type="button" class="btn-text delete-button" title="Supprimer la saga">🗑</button>
          </div>
        </div>
      `;

      // Clic rapide +1 Tome lu
      const btnQuick = card.querySelector(".btn-quick-read");
      if (btnQuick) {
        btnQuick.onclick = (e) => {
          e.stopPropagation();
          const liste = getSagas();
          const target = liste.find((s) => s.id === saga.id);
          if (!target) return;

          const lusActuel = parseInt(target.volumesRead, 10) || 0;
          const totalActuel = Math.max(1, parseInt(target.totalVolumes, 10) || 1);

          if (lusActuel < totalActuel) {
            target.volumesRead = lusActuel + 1;
            if (target.volumesRead >= totalActuel) {
              target.userStatus = "Terminée";
              target.nextVolume = "Saga terminée !";
            } else {
              if (target.userStatus === "À commencer") target.userStatus = "En cours";
              if (!target.nextVolume || target.nextVolume.toLowerCase().startsWith("tome")) {
                target.nextVolume = `Tome ${target.volumesRead + 1}`;
              }
            }
            sauvegarderSagas(liste);
            rafraichirSagas();
            afficherNotification(`Super ! Vous avez avancé au tome ${target.volumesRead} de "${target.title}".`, "Progression enregistrée");
          }
        };
      }

      // Clic Modifier
      const btnEdit = card.querySelector(".btn-edit");
      if (btnEdit) {
        btnEdit.onclick = (e) => {
          e.stopPropagation();
          ouvrirModalSaga(saga.id);
        };
      }

      // Clic Supprimer
      const btnDelete = card.querySelector(".delete-button");
      if (btnDelete) {
        btnDelete.onclick = (e) => {
          e.stopPropagation();
          demanderConfirmation(`Voulez-vous vraiment supprimer la saga "${saga.title}" ?`, () => {
            let liste = getSagas();
            liste = liste.filter((s) => s.id !== saga.id);
            sauvegarderSagas(liste);
            rafraichirSagas();
            afficherNotification(`La saga "${saga.title}" a été supprimée.`, "Saga supprimée");
          });
        };
      }

      // Clic Associer un livre existant
      const btnAddLinked = card.querySelector(".btn-add-linked");
      if (btnAddLinked) {
        btnAddLinked.onclick = (e) => {
          e.stopPropagation();
          ouvrirModalAssocierLivre(saga);
        };
      }

      // Clic Dissocier un livre
      card.querySelectorAll(".saga-unlink-btn").forEach((unlinkBtn) => {
        unlinkBtn.onclick = (e) => {
          e.stopPropagation();
          const bookId = unlinkBtn.dataset.bookId;
          const livres = getLivres();
          const livre = livres.find((l) => l.id === bookId);
          if (livre) {
            livre.sagaId = "";
            livre.sagaTome = "";
            sauvegarderLivres(livres);
            rafraichirSagas();
            afficherNotification(`Le livre "${livre.title}" a été dissocié de la saga.`);
          }
        };
      });

      container.appendChild(card);
    });
  }

  function ouvrirModalSaga(sagaId = null) {
    if (!modal) return;
    sagaEnEditionId = sagaId;

    const livres = getLivres();
    if (selectLivreSource) {
      if (sagaId === null) {
        selectLivreSource.parentElement.style.display = "block";
        selectLivreSource.innerHTML = `
          <option value="">-- Choisir un livre existant (optionnel) --</option>
          ${livres.map((l) => `<option value="${l.id}">${escapeHtml(l.title)} — ${escapeHtml(l.authors)}</option>`).join("")}
        `;
        selectLivreSource.value = "";
        selectLivreSource.onchange = () => {
          const lId = selectLivreSource.value;
          if (!lId) return;
          const livreTrouve = livres.find((l) => l.id === lId);
          if (livreTrouve) {
            if (inputTitre) inputTitre.value = livreTrouve.title;
            if (inputAuteur) inputAuteur.value = livreTrouve.authors;
            if (inputGenre && livreTrouve.genre && livreTrouve.genre !== "Inconnu") inputGenre.value = livreTrouve.genre;
            if (inputCover && livreTrouve.cover) inputCover.value = livreTrouve.cover;
          }
        };
      } else {
        selectLivreSource.parentElement.style.display = "none";
      }
    }

    if (sagaId === null) {
      if (modalTitle) modalTitle.textContent = "Ajouter une saga";
      if (form) form.reset();
      if (inputStatutSaga) inputStatutSaga.value = "Terminée";
      if (inputStatutPerso) inputStatutPerso.value = "À commencer";
      if (inputTotal) inputTotal.value = "3";
      if (inputLus) inputLus.value = "0";
      if (inputProchain) inputProchain.value = "Tome 1";
      if (btnSupprimer) btnSupprimer.style.display = "none";
    } else {
      if (modalTitle) modalTitle.textContent = "Modifier la saga";
      const sagas = getSagas();
      const saga = sagas.find((s) => s.id === sagaId);
      if (!saga) return;

      if (inputTitre) inputTitre.value = saga.title || "";
      if (inputAuteur) inputAuteur.value = saga.author || "";
      if (inputGenre) inputGenre.value = saga.genre || "";
      if (inputCover) inputCover.value = saga.cover || "";
      if (inputStatutSaga) inputStatutSaga.value = saga.sagaStatus || "Terminée";
      if (inputStatutPerso) inputStatutPerso.value = saga.userStatus || "En cours";
      if (inputTotal) inputTotal.value = saga.totalVolumes || 1;
      if (inputLus) inputLus.value = saga.volumesRead || 0;
      if (inputProchain) inputProchain.value = saga.nextVolume || "";
      if (inputNotes) inputNotes.value = saga.notes || "";
      if (btnSupprimer) btnSupprimer.style.display = "inline-flex";
    }

    modal.style.display = "flex";
    if (inputTitre) inputTitre.focus();
  }

  function ouvrirModalAssocierLivre(saga) {
    if (!modalAssocier) return;
    sagaCibleAssocier = saga;

    if (associerSagaNom) associerSagaNom.textContent = `${saga.title} (${saga.author})`;

    const livres = getLivres();
    const nbAssocies = livres.filter((l) => l.sagaId === saga.id).length;
    if (associerInputTome) associerInputTome.value = nbAssocies + 1;

    if (associerSelect) {
      associerSelect.innerHTML = `
        <option value="">-- Choisir un livre --</option>
        ${livres.map((l) => {
          let extra = "";
          if (l.sagaId === saga.id) extra = " (Déjà dans cette saga)";
          else if (l.sagaId) extra = " (Déjà dans une autre saga)";
          return `<option value="${l.id}">${escapeHtml(l.title)} — ${escapeHtml(l.authors)}${extra}</option>`;
        }).join("")}
      `;
    }

    modalAssocier.style.display = "flex";
  }

  if (associerForm) {
    associerForm.onsubmit = (e) => {
      e.preventDefault();
      if (!sagaCibleAssocier) return;

      const bookId = associerSelect ? associerSelect.value : "";
      if (!bookId) {
        afficherNotification("Veuillez sélectionner un livre à associer.");
        return;
      }

      const tomeNum = (associerInputTome && associerInputTome.value ? parseInt(associerInputTome.value, 10) : 1) || 1;
      const livres = getLivres();
      const livre = livres.find((l) => l.id === bookId);
      if (!livre) return;

      livre.sagaId = sagaCibleAssocier.id;
      livre.sagaTome = tomeNum;
      sauvegarderLivres(livres);

      modalAssocier.style.display = "none";
      const nomSaga = sagaCibleAssocier.title;
      sagaCibleAssocier = null;
      rafraichirSagas();
      afficherNotification(`"${livre.title}" a été associé comme Tome ${tomeNum} de "${nomSaga}" !`, "Livre associé");
    };
  }

  if (associerModalClose) associerModalClose.onclick = () => (modalAssocier.style.display = "none");
  if (associerBtnAnnuler) associerBtnAnnuler.onclick = () => (modalAssocier.style.display = "none");

  // Aide automatique sur le statut et le prochain tome
  if (inputLus && inputTotal && inputStatutPerso && inputProchain) {
    const ajusterSuggestionProchain = () => {
      const lus = parseInt(inputLus.value, 10) || 0;
      const total = parseInt(inputTotal.value, 10) || 1;

      if (lus >= total) {
        inputStatutPerso.value = "Terminée";
        if (!inputProchain.value || inputProchain.value.toLowerCase().startsWith("tome")) {
          inputProchain.value = "Saga terminée !";
        }
      } else if (lus > 0) {
        if (inputStatutPerso.value === "À commencer" || inputStatutPerso.value === "Terminée") {
          inputStatutPerso.value = "En cours";
        }
        if (!inputProchain.value || inputProchain.value.toLowerCase().startsWith("tome") || inputProchain.value === "Saga terminée !") {
          inputProchain.value = `Tome ${lus + 1}`;
        }
      } else {
        if (inputStatutPerso.value === "Terminée" || inputStatutPerso.value === "En cours") {
          inputStatutPerso.value = "À commencer";
        }
        if (!inputProchain.value || inputProchain.value.toLowerCase().startsWith("tome") || inputProchain.value === "Saga terminée !") {
          inputProchain.value = "Tome 1";
        }
      }
    };

    inputLus.addEventListener("input", ajusterSuggestionProchain);
    inputTotal.addEventListener("input", ajusterSuggestionProchain);
  }

  if (btnNouveau) btnNouveau.onclick = () => ouvrirModalSaga(null);
  if (modalClose) modalClose.onclick = () => (modal.style.display = "none");
  if (btnAnnuler) btnAnnuler.onclick = () => (modal.style.display = "none");

  // Supprimer depuis la modale
  if (btnSupprimer) {
    btnSupprimer.onclick = () => {
      if (!sagaEnEditionId) return;
      const sagas = getSagas();
      const target = sagas.find((s) => s.id === sagaEnEditionId);
      const nom = target ? target.title : "cette saga";

      demanderConfirmation(`Supprimer "${nom}" ?`, () => {
        const liste = sagas.filter((s) => s.id !== sagaEnEditionId);
        sauvegarderSagas(liste);
        modal.style.display = "none";
        sagaEnEditionId = null;
        rafraichirSagas();
        afficherNotification(`La saga a été supprimée.`, "Saga supprimée");
      });
    };
  }

  // Enregistrer (Création / Modification)
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const titre = inputTitre ? inputTitre.value.trim() : "";
      const auteur = inputAuteur ? inputAuteur.value.trim() : "";
      if (!titre || !auteur) {
        afficherNotification("Veuillez renseigner au minimum le titre et l'auteur de la saga.");
        return;
      }

      const totalTomes = Math.max(1, parseInt(inputTotal.value, 10) || 1);
      let tomesLus = Math.max(0, parseInt(inputLus.value, 10) || 0);
      if (tomesLus > totalTomes) tomesLus = totalTomes;

      let prochainTome = inputProchain ? inputProchain.value.trim() : "";
      if (!prochainTome) {
        prochainTome = tomesLus >= totalTomes ? "Saga terminée !" : `Tome ${tomesLus + 1}`;
      }

      const sagas = getSagas();

      if (sagaEnEditionId === null) {
        // Nouvelle saga
        const nouvelleSaga = {
          id: "saga_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
          title: titre,
          author: auteur,
          genre: inputGenre ? inputGenre.value.trim() : "",
          cover: inputCover ? inputCover.value.trim() : "",
          sagaStatus: inputStatutSaga ? inputStatutSaga.value : "Terminée",
          userStatus: inputStatutPerso ? inputStatutPerso.value : "À commencer",
          totalVolumes: totalTomes,
          volumesRead: tomesLus,
          nextVolume: prochainTome,
          notes: inputNotes ? inputNotes.value.trim() : "",
        };
        sagas.push(nouvelleSaga);

        // Si un livre source a été sélectionné, l'associer automatiquement comme Tome 1
        if (selectLivreSource && selectLivreSource.value) {
          const srcId = selectLivreSource.value;
          const livres = getLivres();
          const srcBook = livres.find((l) => l.id === srcId);
          if (srcBook) {
            srcBook.sagaId = nouvelleSaga.id;
            srcBook.sagaTome = 1;
            sauvegarderLivres(livres);
          }
        }

        afficherNotification(`La saga "${titre}" a été ajoutée avec succès !`, "Saga ajoutée");
      } else {
        // Modification d'une saga existante
        const index = sagas.findIndex((s) => s.id === sagaEnEditionId);
        if (index !== -1) {
          sagas[index] = {
            ...sagas[index],
            title: titre,
            author: auteur,
            genre: inputGenre ? inputGenre.value.trim() : "",
            cover: inputCover ? inputCover.value.trim() : "",
            sagaStatus: inputStatutSaga ? inputStatutSaga.value : "Terminée",
            userStatus: inputStatutPerso ? inputStatutPerso.value : "En cours",
            totalVolumes: totalTomes,
            volumesRead: tomesLus,
            nextVolume: prochainTome,
            notes: inputNotes ? inputNotes.value.trim() : "",
          };
          afficherNotification(`La saga "${titre}" a été mise à jour !`, "Saga modifiée");
        }
      }

      sauvegarderSagas(sagas);
      modal.style.display = "none";
      sagaEnEditionId = null;
      rafraichirSagas();
    });
  }

  if (selectFiltre) selectFiltre.addEventListener("change", rafraichirSagas);
  if (inputRecherche) inputRecherche.addEventListener("input", rafraichirSagas);

  rafraichirSagas();
}