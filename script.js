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
  if (typeof synchroniserToutesLesSagas === "function") {
    synchroniserToutesLesSagas(livres);
  }
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
            totalVolumes: Math.max(1, tomeNum),
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

          const hMap = creerMapEntetesCSV(rows[0]);
          const livres = getLivres();
          const sagas = getSagas();
          let ajouts = 0;
          let misesAJour = 0;

          for (let i = 1; i < rows.length; i++) {
            const parsed = parserLivreGoodreadsCSV(hMap, rows[i]);
            if (!parsed || !parsed.title) continue;

            const existant = livres.find((l) =>
              sontLivresEquivalents(l.title, l.authors, parsed.title, parsed.authors)
            );

            let livreActuel = null;

            if (existant) {
              if (parsed.status) {
                existant.status = parsed.status;
                if (parsed.status === "À lire") {
                  existant.endDate = "";
                  existant.startDate = "";
                } else if (parsed.status === "En cours") {
                  existant.endDate = "";
                  if (parsed.startDate && !existant.startDate) existant.startDate = parsed.startDate;
                } else if (parsed.status === "Terminé") {
                  if (parsed.endDate) existant.endDate = parsed.endDate;
                  if (parsed.startDate && !existant.startDate) existant.startDate = parsed.startDate;
                }
              }
              if (parsed.note && (!existant.note || existant.note === "")) existant.note = parsed.note;
              if (parsed.cover && (!existant.cover || existant.cover === PLACEHOLDER_COVER)) existant.cover = parsed.cover;
              if (parsed.genre && (!existant.genre || existant.genre === "Inconnu")) existant.genre = parsed.genre;
              if (parsed.description && (!existant.description || existant.description === "Pas de résumé disponible.")) existant.description = parsed.description;
              livreActuel = existant;
              misesAJour++;
            } else {
              livreActuel = {
                id: "book_" + Date.now() + "_" + i + "_" + Math.random().toString(36).substring(2, 6),
                title: parsed.title,
                authors: parsed.authors,
                status: parsed.status,
                note: parsed.note,
                startDate: parsed.startDate,
                endDate: parsed.endDate,
                genre: parsed.genre,
                description: parsed.description,
                cover: parsed.cover || "",
                sagaId: "",
                sagaTome: "",
              };
              livres.push(livreActuel);
              ajouts++;
            }

            // Association de saga automatique si détectée
            if (parsed.saga && livreActuel && !livreActuel.sagaId) {
              const sagaNomNorm = normaliserChaine(parsed.saga);
              let sagaTrouvee = sagas.find((s) => normaliserChaine(s.title) === sagaNomNorm);
              if (!sagaTrouvee) {
                sagaTrouvee = {
                  id: "saga_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
                  title: parsed.saga,
                  author: parsed.authors,
                  genre: parsed.genre || "",
                  cover: parsed.cover || "",
                  sagaStatus: "Terminée",
                  userStatus: parsed.status === "Terminé" ? "En cours" : "À commencer",
                  totalVolumes: Math.max(1, parsed.tome || 1),
                  volumesRead: parsed.status === "Terminé" ? parsed.tome || 1 : 0,
                  nextVolume: parsed.status === "Terminé" ? `Tome ${(parsed.tome || 1) + 1}` : `Tome ${parsed.tome || 1}`,
                  notes: `Créée automatiquement lors de l'import CSV.`,
                };
                sagas.push(sagaTrouvee);
              }
              livreActuel.sagaId = sagaTrouvee.id;
              livreActuel.sagaTome = parsed.tome || 1;
            }
          }

          sauvegarderSagas(sagas);

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

  // Initialisation de la synchronisation Goodreads
  initialiserGoodreadsSync(afficherLivresFiltres);
}

// --------------------------------------------------------------------------
// Synchronisation & Parsing Goodreads (via RSS / JSON)
// --------------------------------------------------------------------------

function extraireGoodreadsUserId(input) {
  if (!input) return null;
  const s = input.trim();
  const match = s.match(/(?:user\/show\/|review\/list\/|review\/list_rss\/|friend\/user\/)(\d+)/i) ||
                s.match(/goodreads\.com\/.*?(\d{4,})/i) ||
                s.match(/^(\d{4,})/);
  return match ? match[1] : null;
}

function extraireInfosSagaEtTome(titreLivre) {
  if (!titreLivre) return { titreSaga: "", tomeDetecte: 1, nomSousTitre: "" };

  const brut = titreLivre.trim();

  // Pattern 1 : "The Way of Kings (The Stormlight Archive, #1)" ou "Mockingjay (The Hunger Games #3)"
  let match = brut.match(/^(.*?)\s*\((.*?)(?:,\s*#?|\s*#)([0-9.]+)\)$/i);
  if (match) {
    return {
      titreSaga: match[2].trim(),
      tomeDetecte: parseInt(match[3], 10) || 1,
      nomSousTitre: match[1].trim(),
    };
  }

  // Pattern 2 : "Harry Potter, Tome 1 : L'école des sorciers" ou "Dune, tome 2" ou "Percy Jackson - Tome 1"
  match = brut.match(/^(.*?)(?:,\s*|\s*-\s*|\s*:\s*)(?:tome|vol(?:ume)?\.?)\s*(\d+)(?:\s*[:\-]\s*(.*))?$/i);
  if (match) {
    return {
      titreSaga: match[1].trim(),
      tomeDetecte: parseInt(match[2], 10) || 1,
      nomSousTitre: match[3] ? match[3].trim() : "",
    };
  }

  // Pattern 3 : "(Harry Potter #4)"
  match = brut.match(/\(([^#)]+)#(\d+)\)/);
  if (match) {
    return {
      titreSaga: match[1].trim(),
      tomeDetecte: parseInt(match[2], 10) || 1,
      nomSousTitre: "",
    };
  }

  // Pattern 4 : "Tome 1 : Le Voleur de Foudre"
  match = brut.match(/^tome\s*(\d+)\s*[:\-]?\s*(.*)$/i);
  if (match) {
    return {
      titreSaga: match[2] ? match[2].trim() : brut,
      tomeDetecte: parseInt(match[1], 10) || 1,
      nomSousTitre: "",
    };
  }

  // Pattern 5 : Présence d'un "Tome X" n'importe où
  match = brut.match(/tome\s*(\d+)/i);
  if (match) {
    return {
      titreSaga: brut,
      tomeDetecte: parseInt(match[1], 10) || 1,
      nomSousTitre: "",
    };
  }

  return { titreSaga: brut, tomeDetecte: 1, nomSousTitre: "" };
}

function parserItemGoodreads(item, defaultShelf = "read") {
  if (!item) return null;
  const desc = item.description || "";

  // 1. Titre & Saga
  let rawTitle = (item.title || "").trim();
  let cleanTitle = rawTitle;
  let detectedSaga = "";
  let detectedTome = 1;

  // Format Goodreads classique : "The Way of Kings (The Stormlight Archive, #1)"
  const sagaMatch = rawTitle.match(/^(.*?)\s*\((.*?)(?:,\s*#?|\s*#)([0-9.]+)\)$/);
  if (sagaMatch) {
    cleanTitle = sagaMatch[1].trim();
    detectedSaga = sagaMatch[2].trim();
    detectedTome = parseInt(sagaMatch[3], 10) || 1;
  } else {
    const infoTome = extraireInfosSagaEtTome(rawTitle);
    if (infoTome && infoTome.nomSousTitre) {
      cleanTitle = rawTitle;
      detectedSaga = infoTome.titreSaga;
      detectedTome = infoTome.tomeDetecte;
    }
  }

  // 2. Auteur
  let author = "";
  const authorMatch = desc.match(/author:\s*([^<]+)/i);
  if (authorMatch) {
    author = authorMatch[1].trim();
  } else if (item.author) {
    author = item.author.trim();
  }
  if (!author) author = "Auteur inconnu";

  // 3. Couverture
  let cover = "";
  const imgMatch = desc.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch) {
    let src = imgMatch[1];
    // Supprimer le suffixe thumbnail de Goodreads pour obtenir la haute résolution
    src = src.replace(/\._S[XY]\d+_/g, "").replace(/\._SX\d+_SY\d+_/g, "");
    if (!src.includes("nophoto")) {
      cover = src;
    }
  }

  // 4. Note
  let note = "";
  const ratingMatch = desc.match(/rating:\s*(\d+)/i);
  if (ratingMatch) {
    const val = parseInt(ratingMatch[1], 10);
    if (!isNaN(val) && val > 0) note = val.toString();
  }

  // 5. Dates
  let readAt = "";
  const readMatch = desc.match(/read at:\s*([0-9/]+)/i);
  if (readMatch) {
    readAt = readMatch[1].replace(/\//g, "-").trim();
  }

  let dateAdded = "";
  const addedMatch = desc.match(/date added:\s*([0-9/]+)/i);
  if (addedMatch) {
    dateAdded = addedMatch[1].replace(/\//g, "-").trim();
  }

  // 6. Rayons / Shelves & Statut
  let shelves = "";
  const shelfMatch = desc.match(/shelves:\s*([^<]+)/i);
  if (shelfMatch) {
    shelves = shelfMatch[1].toLowerCase();
  }

  const shelfList = shelves
    ? shelves.split(",").map((s) => s.trim().toLowerCase())
    : [];

  const isToRead = defaultShelf === "to-read" || shelfList.includes("to-read") || /\bto-read\b/.test(shelves);
  const isCurrentlyReading = defaultShelf === "currently-reading" || shelfList.includes("currently-reading") || /\bcurrently-reading\b/.test(shelves);
  const isDnf = shelfList.some((s) => s.includes("dnf") || s.includes("abandon") || s.includes("didntfinish"));
  // "read" doit être le mot exact dans shelfList et ne pas confondre avec "to-read"
  const isRead = defaultShelf === "read" || shelfList.includes("read") || (readAt && !isToRead && !isCurrentlyReading);

  let status = "À lire";
  if (isDnf) {
    status = "Abandonné";
  } else if (isToRead) {
    status = "À lire";
  } else if (isCurrentlyReading) {
    status = "En cours";
  } else if (isRead) {
    status = "Terminé";
  } else {
    if (defaultShelf === "currently-reading") status = "En cours";
    else if (defaultShelf === "read") status = "Terminé";
    else status = "À lire";
  }

  // 7. Genre
  let genre = "Inconnu";
  if (shelves) {
    const tags = shelves.split(",").map((t) => t.trim()).filter((t) => !["read", "currently-reading", "to-read", "favorites", "books-i-own", "owned"].includes(t.toLowerCase()));
    if (tags.length > 0) {
      genre = tags.slice(0, 2).map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join(", ");
    }
  }

  // 8. Description / Avis
  let resume = "Pas de résumé disponible.";
  const reviewMatch = desc.match(/review:\s*<br\s*\/?>([\s\S]*)$/i);
  if (reviewMatch && reviewMatch[1]) {
    const cleanReview = reviewMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (cleanReview && cleanReview.length > 10) {
      resume = cleanReview;
    }
  }

  return {
    title: cleanTitle,
    authors: author,
    cover: cover,
    note: note,
    startDate: status === "En cours" ? (dateAdded || getLocalDateString()) : "",
    endDate: status === "Terminé" ? (readAt || dateAdded || getLocalDateString()) : "",
    status: status,
    genre: genre,
    description: resume,
    saga: detectedSaga,
    tome: detectedTome,
  };
}

// Comparaison textuelle avancée pour éliminer tout risque de faux positif / faux négatif
function normaliserTexteComparaison(str) {
  if (!str) return "";
  let s = str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  s = s.replace(/\(.*?\)/g, " ");
  s = s.replace(/\[.*?\]/g, " ");
  s = s.replace(/[:\-–—].*$/, " ");
  s = s.replace(/\b(le|la|les|l'|l|un|une|des|the|a|an)\b/g, " ");
  s = s.replace(/[^a-z0-9]/g, " ");
  return s.replace(/\s+/g, " ").trim();
}

function sontLivresEquivalents(titre1, auteur1, titre2, auteur2) {
  if (!titre1 || !titre2) return false;
  const t1 = normaliserTexteComparaison(titre1);
  const t2 = normaliserTexteComparaison(titre2);
  if (!t1 || !t2) return false;

  const memeTitre = (t1 === t2) || (t1.length >= 4 && t2.length >= 4 && (t1.includes(t2) || t2.includes(t1)));
  if (!memeTitre) return false;

  if (auteur1 && auteur2) {
    const a1 = normaliserChaine(auteur1);
    const a2 = normaliserChaine(auteur2);
    if (a1 && a2 && a1 !== "inconnu" && a2 !== "inconnu" && a1 !== "auteur inconnu" && a2 !== "auteur inconnu") {
      const motsA1 = a1.split(/\s+/).filter((m) => m.length >= 3);
      const motsA2 = a2.split(/\s+/).filter((m) => m.length >= 3);
      const commun = motsA1.some((m) => motsA2.includes(m)) || a1.includes(a2) || a2.includes(a1);
      if (!commun) return false;
    }
  }

  return true;
}

// Construction de la map des en-têtes d'un fichier CSV (gère Goodreads et export local)
function creerMapEntetesCSV(headersRow) {
  const map = {};
  headersRow.forEach((h, idx) => {
    const norm = normaliserChaine(h);
    if (norm.includes("book id")) map.bookId = idx;
    else if (norm.includes("title") || norm.includes("titre")) {
      if (map.title === undefined) map.title = idx;
    } else if (norm.includes("author l f")) map.authorLf = idx;
    else if (norm.includes("author") || norm.includes("auteur")) {
      if (map.author === undefined) map.author = idx;
    } else if (norm.includes("exclusive shelf")) map.exclusiveShelf = idx;
    else if (norm.includes("bookshelves")) map.bookshelves = idx;
    else if (norm.includes("shelf") || norm.includes("statut")) {
      if (map.status === undefined) map.status = idx;
    } else if (norm.includes("my rating") || norm.includes("rating") || norm.includes("note")) {
      if (map.myRating === undefined) map.myRating = idx;
    } else if (norm.includes("date read") || norm.includes("date fin") || norm.includes("fin")) {
      if (map.dateRead === undefined) map.dateRead = idx;
    } else if (norm.includes("date added") || norm.includes("date debut") || norm.includes("debut")) {
      if (map.dateAdded === undefined) map.dateAdded = idx;
    } else if (norm.includes("isbn13")) map.isbn13 = idx;
    else if (norm.includes("isbn")) {
      if (map.isbn === undefined) map.isbn = idx;
    } else if (norm.includes("my review") || norm.includes("review") || norm.includes("resume") || norm.includes("description")) {
      if (map.myReview === undefined) map.myReview = idx;
    } else if (norm.includes("genre")) map.genre = idx;
    else if (norm.includes("saga")) map.saga = idx;
    else if (norm.includes("tome")) map.tome = idx;
  });

  if (map.title === undefined) map.title = 1;
  if (map.author === undefined) map.author = 2;

  return map;
}

// Parser un livre depuis une ligne CSV
function parserLivreGoodreadsCSV(hMap, vals) {
  const getVal = (col) => (col !== undefined && col !== -1 && vals[col]) ? vals[col].trim() : "";

  let rawTitle = getVal(hMap.title);
  if (!rawTitle) return null;

  if (rawTitle.startsWith('="') && rawTitle.endsWith('"')) {
    rawTitle = rawTitle.slice(2, -1);
  }

  // 1. Titre, Saga et Tome
  let cleanTitle = rawTitle;
  let detectedSaga = getVal(hMap.saga) || "";
  let detectedTome = parseInt(getVal(hMap.tome), 10) || 1;

  if (!detectedSaga) {
    const sagaMatch = rawTitle.match(/^(.*?)\s*\((.*?)(?:,\s*#?|\s*#)([0-9.]+)\)$/i);
    if (sagaMatch) {
      cleanTitle = sagaMatch[1].trim();
      detectedSaga = sagaMatch[2].trim();
      detectedTome = parseInt(sagaMatch[3], 10) || 1;
    } else {
      const infoTome = extraireInfosSagaEtTome(rawTitle);
      if (infoTome && infoTome.nomSousTitre) {
        cleanTitle = rawTitle;
        detectedSaga = infoTome.titreSaga;
        detectedTome = infoTome.tomeDetecte;
      }
    }
  }

  // 2. Auteur
  let author = getVal(hMap.author);
  if (!author && hMap.authorLf) author = getVal(hMap.authorLf);
  if (!author) author = "Auteur inconnu";

  // 3. Statut
  const exclShelf = getVal(hMap.exclusiveShelf).toLowerCase();
  const rawStatus = getVal(hMap.status).toLowerCase();
  const bookshelves = getVal(hMap.bookshelves).toLowerCase();

  let status = "À lire";
  if (
    bookshelves.includes("dnf") ||
    bookshelves.includes("abandon") ||
    bookshelves.includes("did-not-finish") ||
    rawStatus.includes("dnf") ||
    rawStatus.includes("abandon")
  ) {
    status = "Abandonné";
  } else if (exclShelf === "read" || rawStatus === "read" || rawStatus.includes("termin")) {
    status = "Terminé";
  } else if (exclShelf === "currently-reading" || rawStatus === "currently-reading" || rawStatus.includes("cours")) {
    status = "En cours";
  } else if (exclShelf === "to-read" || rawStatus === "to-read" || rawStatus.includes("lire")) {
    status = "À lire";
  }

  // 4. Note
  let note = "";
  const rawNote = parseFloat(getVal(hMap.myRating));
  if (!isNaN(rawNote) && rawNote > 0) {
    note = Math.round(rawNote).toString();
  }

  // 5. Dates
  const cleanDate = (d) => {
    if (!d) return "";
    let s = d.replace(/\//g, "-").trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    return "";
  };

  const dateRead = cleanDate(getVal(hMap.dateRead));
  const dateAdded = cleanDate(getVal(hMap.dateAdded));

  let startDate = "";
  let endDate = "";
  if (status === "En cours") {
    startDate = dateAdded || getLocalDateString();
  } else if (status === "Terminé") {
    endDate = dateRead || dateAdded || getLocalDateString();
    startDate = dateAdded;
  }

  // 6. Genre
  let genre = getVal(hMap.genre) || "Inconnu";
  if (genre === "Inconnu" && bookshelves) {
    const tags = bookshelves
      .split(",")
      .map((t) => t.trim())
      .filter((t) => !["read", "currently-reading", "to-read", "favorites", "books-i-own", "owned"].includes(t.toLowerCase()));
    if (tags.length > 0) {
      genre = tags.slice(0, 2).map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join(", ");
    }
  }

  // 7. Résumé
  const review = getVal(hMap.myReview);
  const resume = review && review.length > 5 ? review : "Pas de résumé disponible.";

  // 8. Couverture via ISBN (Open Library)
  const rawIsbn13 = getVal(hMap.isbn13).replace(/[^0-9X]/gi, "");
  const rawIsbn = getVal(hMap.isbn).replace(/[^0-9X]/gi, "");
  const validIsbn = rawIsbn13 && rawIsbn13.length >= 10 ? rawIsbn13 : rawIsbn && rawIsbn.length >= 10 ? rawIsbn : "";
  const cover = validIsbn ? `https://covers.openlibrary.org/b/isbn/${validIsbn}-M.jpg` : "";

  return {
    title: cleanTitle,
    authors: author,
    status: status,
    note: note,
    startDate: startDate,
    endDate: endDate,
    genre: genre,
    description: resume,
    cover: cover,
    saga: detectedSaga,
    tome: detectedTome,
    isbn: validIsbn,
  };
}

async function enrichirCouverturesEnFond(livresSansCouverture, callback) {
  if (!livresSansCouverture || livresSansCouverture.length === 0) return;
  for (const livre of livresSansCouverture) {
    try {
      const data = await enrichirLivreViaAPI(livre.title, livre.authors);
      if (data && data.cover) {
        livre.cover = data.cover;
        if (data.genre && livre.genre === "Inconnu") livre.genre = data.genre;
      }
      await new Promise((r) => setTimeout(r, 200));
    } catch (e) {}
  }
  const tous = getLivres();
  sauvegarderLivres(tous);
  if (callback) callback();
}

async function recupererFluxGoodreads(userId, etagere, page) {
  const targetRss = `https://www.goodreads.com/review/list_rss/${userId}?shelf=${etagere}&page=${page}`;

  // 1. Essai primaire via rss2json
  try {
    const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(targetRss)}`;
    const res = await fetch(proxyUrl);
    if (res.ok) {
      const data = await res.json();
      if (data && data.status === "ok" && Array.isArray(data.items) && data.items.length > 0) {
        return data.items;
      }
    }
  } catch (err) {
    console.warn("rss2json indisponible pour la page " + page, err);
  }

  // 2. Essai de secours via allorigins.win avec timeout
  try {
    const fallbackUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetRss)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(fallbackUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const json = await res.json();
      if (json && json.contents) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(json.contents, "text/xml");
        const items = xmlDoc.querySelectorAll("item");
        if (items && items.length > 0) {
          return Array.from(items).map((item) => {
            const desc = item.querySelector("description") ? item.querySelector("description").textContent : "";
            const bookDesc = item.querySelector("book_description") ? item.querySelector("book_description").textContent : "";
            return {
              title: item.querySelector("title") ? item.querySelector("title").textContent : "",
              author: item.querySelector("author_name") ? item.querySelector("author_name").textContent : "",
              description: desc || bookDesc || "",
              link: item.querySelector("link") ? item.querySelector("link").textContent : "",
            };
          });
        }
      }
    }
  } catch (err) {
    console.warn("allorigins indisponible pour la page " + page, err);
  }

  return [];
}

function initialiserGoodreadsSync(onUpdateCallback) {
  const btnSync = document.getElementById("btn-sync-goodreads");
  const modal = document.getElementById("goodreads-modal");
  const closeBtn = document.getElementById("goodreads-modal-close");
  const annulerBtns = modal ? modal.querySelectorAll(".goodreads-btn-annuler, #goodreads-btn-annuler") : [];

  // Onglets CSV et Lien
  const tabBtnCsv = document.getElementById("goodreads-tab-btn-csv");
  const tabBtnUrl = document.getElementById("goodreads-tab-btn-url");
  const tabViewCsv = document.getElementById("goodreads-tab-view-csv");
  const tabViewUrl = document.getElementById("goodreads-tab-view-url");

  // Éléments Onglet CSV
  const dropzone = document.getElementById("goodreads-dropzone");
  const dropzoneIdle = document.getElementById("dropzone-idle");
  const fileInput = document.getElementById("goodreads-file-input");
  const fileSelectedBox = document.getElementById("goodreads-file-selected");
  const fileNameSpan = document.getElementById("goodreads-file-name");
  const fileSizeSpan = document.getElementById("goodreads-file-size");
  const fileRemoveBtn = document.getElementById("goodreads-file-remove");
  const btnLancerCsv = document.getElementById("goodreads-btn-lancer-csv");
  const checkCsvSagas = document.getElementById("goodreads-csv-check-sagas");
  const checkCsvNettoyerPal = document.getElementById("goodreads-csv-check-nettoyer-pal");
  const checkCsvCovers = document.getElementById("goodreads-csv-check-covers");
  const csvStatusBox = document.getElementById("goodreads-csv-sync-status");
  const csvSyncStep = document.getElementById("goodreads-csv-sync-step");
  const csvSyncDetails = document.getElementById("goodreads-csv-sync-details");

  // Éléments Onglet Lien RSS
  const form = document.getElementById("goodreads-form");
  const inputUrl = document.getElementById("goodreads-input-url");
  const selectShelf = document.getElementById("goodreads-select-shelf");
  const selectLimit = document.getElementById("goodreads-select-limit");
  const checkSagas = document.getElementById("goodreads-check-sagas");
  const checkNettoyerPal = document.getElementById("goodreads-check-nettoyer-pal");
  const statusBox = document.getElementById("goodreads-sync-status");
  const syncStep = document.getElementById("goodreads-sync-step");
  const syncDetails = document.getElementById("goodreads-sync-details");
  const btnLancer = document.getElementById("goodreads-btn-lancer");

  // Modal Nettoyage PAL (Livres retirés de Goodreads)
  const modalNettoyage = document.getElementById("modal-nettoyage-pal");
  const nettoyageCloseBtn = document.getElementById("nettoyage-pal-close");
  const nettoyageCountBadge = document.getElementById("nettoyage-count-badge");
  const nettoyageBooksList = document.getElementById("nettoyage-books-list");
  const nettoyageBtnGarder = document.getElementById("nettoyage-btn-garder");
  const nettoyageBtnSupprimer = document.getElementById("nettoyage-btn-supprimer");
  const nettoyageBtnToutCocher = document.getElementById("nettoyage-btn-tout-cocher");
  const nettoyageBtnToutDecocher = document.getElementById("nettoyage-btn-tout-decocher");
  const nettoyageSelCountSpan = document.getElementById("nettoyage-sel-count");

  let fichierCsvSelectionne = null;

  if (!btnSync || !modal) return;

  function selectionnerFichierCsv(file) {
    if (!file || !file.name.toLowerCase().endsWith(".csv")) {
      afficherNotification("Veuillez sélectionner un fichier valide au format CSV (.csv).", "Fichier invalide");
      return;
    }
    fichierCsvSelectionne = file;
    if (fileNameSpan) fileNameSpan.textContent = file.name;
    if (fileSizeSpan) {
      const ko = (file.size / 1024).toFixed(1);
      fileSizeSpan.textContent = `${ko} Ko`;
    }
    if (dropzoneIdle) dropzoneIdle.style.display = "none";
    if (fileSelectedBox) fileSelectedBox.style.display = "flex";
    if (btnLancerCsv) btnLancerCsv.disabled = false;
  }

  function reinitialiserFichierCsv() {
    fichierCsvSelectionne = null;
    if (fileInput) fileInput.value = "";
    if (dropzoneIdle) dropzoneIdle.style.display = "block";
    if (fileSelectedBox) fileSelectedBox.style.display = "none";
    if (btnLancerCsv) btnLancerCsv.disabled = true;
  }

  // Gestion des onglets
  if (tabBtnCsv && tabBtnUrl && tabViewCsv && tabViewUrl) {
    tabBtnCsv.onclick = () => {
      tabBtnCsv.classList.add("active");
      tabBtnUrl.classList.remove("active");
      tabViewCsv.style.display = "block";
      tabViewUrl.style.display = "none";
    };
    tabBtnUrl.onclick = () => {
      tabBtnUrl.classList.add("active");
      tabBtnCsv.classList.remove("active");
      tabViewUrl.style.display = "block";
      tabViewCsv.style.display = "none";
    };
  }

  // Drag & Drop / Clic sur la zone Dropzone CSV
  if (dropzone && fileInput) {
    dropzone.addEventListener("click", (e) => {
      if (e.target !== fileRemoveBtn && !fileRemoveBtn?.contains(e.target) && !fichierCsvSelectionne) {
        fileInput.click();
      }
    });

    fileInput.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (file) selectionnerFichierCsv(file);
    });

    dropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropzone.classList.add("dragover");
    });

    dropzone.addEventListener("dragleave", () => {
      dropzone.classList.remove("dragover");
    });

    dropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropzone.classList.remove("dragover");
      const file = e.dataTransfer?.files?.[0];
      if (file) selectionnerFichierCsv(file);
    });
  }

  if (fileRemoveBtn) {
    fileRemoveBtn.onclick = (e) => {
      e.stopPropagation();
      reinitialiserFichierCsv();
    };
  }

  btnSync.onclick = () => {
    modal.style.display = "flex";
    if (statusBox) statusBox.style.display = "none";
    if (csvStatusBox) csvStatusBox.style.display = "none";
    if (btnLancer) btnLancer.disabled = false;
    reinitialiserFichierCsv();
    if (tabBtnCsv) tabBtnCsv.click();
  };

  if (closeBtn) closeBtn.onclick = () => (modal.style.display = "none");
  annulerBtns.forEach((btn) => {
    btn.onclick = () => (modal.style.display = "none");
  });

  // Modal Nettoyage PAL (Sécurisée)
  function afficherModalNettoyagePal(livresDisparus, callback, messageSucces) {
    if (!modalNettoyage || !nettoyageBooksList) {
      afficherNotification(messageSucces, "Synchronisation réussie");
      return;
    }

    nettoyageBooksList.innerHTML = "";

    if (nettoyageCountBadge) {
      nettoyageCountBadge.textContent = `${livresDisparus.length} livre(s) introuvable(s) sur Goodreads`;
    }

    function actualiserCompteurSelection() {
      const coches = nettoyageBooksList.querySelectorAll(".nettoyage-book-checkbox:checked");
      if (nettoyageSelCountSpan) {
        nettoyageSelCountSpan.textContent = coches.length.toString();
      }
    }

    livresDisparus.forEach((livre) => {
      const item = document.createElement("label");
      item.classList.add("nettoyage-book-item");

      const coverHtml = livre.cover
        ? `<img src="${escapeHtml(livre.cover)}" alt="${escapeHtml(livre.title)}" class="nettoyage-book-cover" onerror="this.onerror=null; this.src='${PLACEHOLDER_COVER}';">`
        : `<div class="nettoyage-book-cover" style="display:flex; align-items:center; justify-content:center; font-size:1.2rem;">📖</div>`;

      item.innerHTML = `
        <input type="checkbox" class="nettoyage-book-checkbox" value="${livre.id}" />
        ${coverHtml}
        <div class="nettoyage-book-info">
          <p class="nettoyage-book-title" title="${escapeHtml(livre.title)}">${escapeHtml(livre.title)}</p>
          <p class="nettoyage-book-author">${escapeHtml(livre.authors || "Auteur inconnu")}</p>
        </div>
        <span class="nettoyage-book-tag">Absent de Goodreads</span>
      `;

      const cb = item.querySelector(".nettoyage-book-checkbox");
      if (cb) {
        cb.addEventListener("change", actualiserCompteurSelection);
      }

      nettoyageBooksList.appendChild(item);
    });

    actualiserCompteurSelection();

    if (nettoyageBtnToutCocher) {
      nettoyageBtnToutCocher.onclick = () => {
        nettoyageBooksList.querySelectorAll(".nettoyage-book-checkbox").forEach((cb) => {
          cb.checked = true;
        });
        actualiserCompteurSelection();
      };
    }

    if (nettoyageBtnToutDecocher) {
      nettoyageBtnToutDecocher.onclick = () => {
        nettoyageBooksList.querySelectorAll(".nettoyage-book-checkbox").forEach((cb) => {
          cb.checked = false;
        });
        actualiserCompteurSelection();
      };
    }

    if (nettoyageBtnGarder) {
      nettoyageBtnGarder.onclick = () => {
        modalNettoyage.style.display = "none";
        afficherNotification(messageSucces + "\n\n• Tous vos livres de la PAL locale ont été conservés.", "Synchronisation terminée");
      };
    }

    if (nettoyageCloseBtn) {
      nettoyageCloseBtn.onclick = () => {
        modalNettoyage.style.display = "none";
        afficherNotification(messageSucces, "Synchronisation terminée");
      };
    }

    if (nettoyageBtnSupprimer) {
      nettoyageBtnSupprimer.onclick = () => {
        const checkboxes = nettoyageBooksList.querySelectorAll(".nettoyage-book-checkbox:checked");
        const idsASupprimer = Array.from(checkboxes).map((cb) => cb.value);

        if (idsASupprimer.length === 0) {
          afficherNotification("Aucun livre sélectionné. Vos livres ont tous été conservés.", "Aucune suppression");
          modalNettoyage.style.display = "none";
          return;
        }

        let tous = getLivres();
        tous = tous.filter((l) => !idsASupprimer.includes(l.id));
        sauvegarderLivres(tous);

        modalNettoyage.style.display = "none";
        if (callback) callback();

        afficherNotification(
          `${messageSucces}\n\n🧹 ${idsASupprimer.length} livre(s) retiré(s) de votre PAL locale suite à votre confirmation.`,
          "PAL mise à jour"
        );
      };
    }

    modalNettoyage.style.display = "flex";
  }

  // ------------------------------------------------------------------------
  // IMPORT FICHIER EXPORT GOODREADS (.CSV) — 100% COMPLET & SANS LIMITE
  // ------------------------------------------------------------------------
  if (btnLancerCsv) {
    btnLancerCsv.onclick = async () => {
      if (!fichierCsvSelectionne) return;

      if (csvStatusBox) csvStatusBox.style.display = "flex";
      if (btnLancerCsv) btnLancerCsv.disabled = true;

      try {
        const texte = await fichierCsvSelectionne.text();
        const rows = parserCSV(texte);
        if (!rows || rows.length < 2) {
          afficherNotification("Le fichier CSV est vide ou ne contient aucune ligne de données.", "Fichier vide");
          return;
        }

        const hMap = creerMapEntetesCSV(rows[0]);
        const tousLivres = getLivres();
        const sagasExistantes = getSagas();

        const autoSagas = checkCsvSagas ? checkCsvSagas.checked : true;
        const autoNettoyerPal = checkCsvNettoyerPal ? checkCsvNettoyerPal.checked : true;
        const autoCovers = checkCsvCovers ? checkCsvCovers.checked : true;

        // Sauvegarder la liste des livres de la PAL locale (« À lire ») avant import
        const palInitialeLocale = tousLivres.filter((l) => {
          const s = normaliserChaine(l.status);
          return (s.includes("lire") || s === "to-read") && !s.includes("termin") && !s.includes("cours");
        });

        const livresGoodreadsRecus = [];
        let ajouts = 0;
        let misesAJour = 0;
        let sagasCreees = 0;
        const livresSansCouverture = [];

        if (csvSyncStep) csvSyncStep.textContent = "Analyse et import des livres...";
        if (csvSyncDetails) csvSyncDetails.textContent = `${rows.length - 1} livres en cours de traitement...`;

        for (let i = 1; i < rows.length; i++) {
          const parsed = parserLivreGoodreadsCSV(hMap, rows[i]);
          if (!parsed || !parsed.title) continue;

          livresGoodreadsRecus.push(parsed);

          // Recherche correspondance robuste anti-doublons
          const existant = tousLivres.find((l) =>
            sontLivresEquivalents(l.title, l.authors, parsed.title, parsed.authors)
          );

          let livreActuel = null;

          if (existant) {
            if (parsed.status) {
              existant.status = parsed.status;
              if (parsed.status === "À lire") {
                existant.endDate = "";
                existant.startDate = "";
              } else if (parsed.status === "En cours") {
                existant.endDate = "";
                if (parsed.startDate && !existant.startDate) existant.startDate = parsed.startDate;
              } else if (parsed.status === "Terminé") {
                if (parsed.endDate) existant.endDate = parsed.endDate;
                if (parsed.startDate && !existant.startDate) existant.startDate = parsed.startDate;
              }
            }
            if (parsed.note && (!existant.note || existant.note === "")) existant.note = parsed.note;
            if (parsed.cover && (!existant.cover || existant.cover === PLACEHOLDER_COVER)) existant.cover = parsed.cover;
            if (parsed.genre && (!existant.genre || existant.genre === "Inconnu")) existant.genre = parsed.genre;
            if (parsed.description && (!existant.description || existant.description === "Pas de résumé disponible.")) existant.description = parsed.description;
            livreActuel = existant;
            misesAJour++;
          } else {
            livreActuel = {
              id: "book_" + Date.now() + "_" + i + "_" + Math.random().toString(36).substring(2, 6),
              title: parsed.title,
              authors: parsed.authors,
              status: parsed.status,
              note: parsed.note,
              startDate: parsed.startDate,
              endDate: parsed.endDate,
              genre: parsed.genre,
              description: parsed.description,
              cover: parsed.cover || "",
              sagaId: "",
              sagaTome: "",
            };
            tousLivres.push(livreActuel);
            ajouts++;
          }

          if (autoCovers && (!livreActuel.cover || livreActuel.cover === PLACEHOLDER_COVER)) {
            livresSansCouverture.push(livreActuel);
          }

          // Détection et association de saga
          if (autoSagas && parsed.saga && livreActuel && !livreActuel.sagaId) {
            const sagaNomNorm = normaliserChaine(parsed.saga);
            let sagaTrouvee = sagasExistantes.find((s) => normaliserChaine(s.title) === sagaNomNorm);

            if (!sagaTrouvee) {
              sagaTrouvee = {
                id: "saga_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
                title: parsed.saga,
                author: parsed.authors,
                genre: parsed.genre || "",
                cover: parsed.cover || "",
                sagaStatus: "Terminée",
                userStatus: parsed.status === "Terminé" ? "En cours" : "À commencer",
                totalVolumes: Math.max(1, parsed.tome || 1),
                volumesRead: parsed.status === "Terminé" ? parsed.tome || 1 : 0,
                nextVolume: parsed.status === "Terminé" ? `Tome ${(parsed.tome || 1) + 1}` : `Tome ${parsed.tome || 1}`,
                notes: `Créée automatiquement depuis Goodreads pour "${parsed.title}".`,
              };
              sagasExistantes.push(sagaTrouvee);
              sagasCreees++;
            }

            livreActuel.sagaId = sagaTrouvee.id;
            livreActuel.sagaTome = parsed.tome || 1;
          }
        }

        sauvegarderLivres(tousLivres);
        if (autoSagas) sauvegarderSagas(sagasExistantes);

        modal.style.display = "none";
        if (onUpdateCallback) onUpdateCallback();

        let messageSucces = `Import Goodreads terminé avec succès !\n\n`;
        messageSucces += `• ${livresGoodreadsRecus.length} livre(s) importé(s) depuis votre fichier\n`;
        messageSucces += `• ${ajouts} nouveau(x) livre(s) ajouté(s)\n`;
        messageSucces += `• ${misesAJour} livre(s) mis à jour`;
        if (sagasCreees > 0) {
          messageSucces += `\n• ${sagasCreees} nouvelle(s) saga(s) créée(s) automatiquement`;
        }

        // Nettoyage de la PAL fiable et sécurisé avec l'export 100% complet
        let livresDisparus = [];
        if (autoNettoyerPal && palInitialeLocale.length > 0) {
          livresDisparus = palInitialeLocale.filter((locLivre) => {
            return !livresGoodreadsRecus.some((gLivre) =>
              sontLivresEquivalents(locLivre.title, locLivre.authors, gLivre.title, gLivre.authors)
            );
          });
        }

        if (livresDisparus.length > 0 && modalNettoyage && nettoyageBooksList) {
          afficherModalNettoyagePal(livresDisparus, onUpdateCallback, messageSucces);
        } else {
          afficherNotification(messageSucces, "Import Goodreads réussi");
        }

        // Tâche de fond pour enrichir les couvertures si souhaité
        if (autoCovers && livresSansCouverture.length > 0) {
          enrichirCouverturesEnFond(livresSansCouverture.slice(0, 30), onUpdateCallback);
        }
      } catch (err) {
        console.error("Erreur import CSV Goodreads :", err);
        afficherNotification("Une erreur est survenue lors de la lecture du fichier CSV Goodreads.", "Erreur d'import");
      } finally {
        if (csvStatusBox) csvStatusBox.style.display = "none";
        if (btnLancerCsv) btnLancerCsv.disabled = false;
      }
    };
  }

  // ------------------------------------------------------------------------
  // SYNCHRONISATION VIA FLUX PUBLIC RSS
  // ------------------------------------------------------------------------
  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      const rawInput = inputUrl ? inputUrl.value.trim() : "";
      const userId = extraireGoodreadsUserId(rawInput);

      if (!userId) {
        afficherNotification(
          "Impossible de détecter un identifiant utilisateur Goodreads valide.\n\n" +
          "Exemples acceptés :\n" +
          "• https://www.goodreads.com/user/show/12345678-pseudo\n" +
          "• https://www.goodreads.com/review/list/12345678\n" +
          "• Ou simplement votre ID numérique : 12345678\n\n" +
          "💡 Astuce : Vous pouvez aussi utiliser l'onglet '📁 Fichier Export (.csv)' pour une importation complète et sans aucune limitation !",
          "Lien invalide"
        );
        return;
      }

      if (statusBox) statusBox.style.display = "flex";
      if (btnLancer) btnLancer.disabled = true;

      try {
        const shelfChoisie = selectShelf ? selectShelf.value : "all";
        const maxLivres = parseInt(selectLimit ? selectLimit.value : "1000", 10) || 1000;
        const autoSagas = checkSagas ? checkSagas.checked : true;
        const autoNettoyerPal = checkNettoyerPal ? checkNettoyerPal.checked : true;

        const etageres = shelfChoisie === "all" ? ["read", "currently-reading", "to-read"] : [shelfChoisie];
        const tousLivres = getLivres();
        const sagasExistantes = getSagas();

        // Sauvegarder la liste des livres de la PAL locale (« À lire ») avant la synchro
        const palInitialeLocale = tousLivres.filter((l) => {
          const s = normaliserChaine(l.status);
          return (s.includes("lire") || s === "to-read") && !s.includes("termin") && !s.includes("cours");
        });

        const livresGoodreadsRecus = [];
        let ajouts = 0;
        let misesAJour = 0;
        let sagasCreees = 0;
        let totalTraites = 0;
        let fluxTronqueDetecte = false;

        for (const etagere of etageres) {
          const maxParEtagere = etagere === "to-read" && autoNettoyerPal ? Math.max(maxLivres, 500) : maxLivres;
          let totalEtagere = 0;
          let page = 1;
          let plusDeResultats = false;

          while (!plusDeResultats && totalTraites < maxLivres && totalEtagere < maxParEtagere) {
            if (syncStep) {
              const nomEtagere = etagere === "read" ? "Livres lus" : etagere === "currently-reading" ? "En cours" : "À lire / PAL";
              syncStep.textContent = `Récupération de "${nomEtagere}" (Page ${page})...`;
            }
            if (syncDetails) {
              syncDetails.textContent = `${totalTraites} livre(s) analysé(s)...`;
            }

            const items = await recupererFluxGoodreads(userId, etagere, page);

            if (!items || items.length === 0) {
              if (page > 1) {
                fluxTronqueDetecte = true;
              }
              plusDeResultats = true;
              break;
            }

            for (const item of items) {
              if (totalTraites >= maxLivres && !(etagere === "to-read" && autoNettoyerPal)) break;

              const parsed = parserItemGoodreads(item, etagere);
              if (!parsed || !parsed.title) continue;

              totalTraites++;
              totalEtagere++;
              livresGoodreadsRecus.push(parsed);

              // Correspondance robuste
              const existant = tousLivres.find((l) =>
                sontLivresEquivalents(l.title, l.authors, parsed.title, parsed.authors)
              );

              let livreActuel = null;

              if (existant) {
                if (parsed.status) {
                  existant.status = parsed.status;
                  if (parsed.status === "À lire") {
                    existant.endDate = "";
                    existant.startDate = "";
                  } else if (parsed.status === "En cours") {
                    existant.endDate = "";
                    if (parsed.startDate && !existant.startDate) existant.startDate = parsed.startDate;
                  } else if (parsed.status === "Terminé") {
                    if (parsed.endDate) existant.endDate = parsed.endDate;
                  }
                }
                if (parsed.note && !existant.note) existant.note = parsed.note;
                if (parsed.cover && (!existant.cover || existant.cover === PLACEHOLDER_COVER)) existant.cover = parsed.cover;
                if (parsed.genre && (!existant.genre || existant.genre === "Inconnu")) existant.genre = parsed.genre;
                if (parsed.description && (!existant.description || existant.description === "Pas de résumé disponible.")) existant.description = parsed.description;
                livreActuel = existant;
                misesAJour++;
              } else {
                livreActuel = {
                  id: "book_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
                  title: parsed.title,
                  authors: parsed.authors,
                  status: parsed.status,
                  note: parsed.note,
                  startDate: parsed.startDate,
                  endDate: parsed.endDate,
                  genre: parsed.genre,
                  description: parsed.description,
                  cover: parsed.cover,
                  sagaId: "",
                  sagaTome: "",
                };
                tousLivres.push(livreActuel);
                ajouts++;
              }

              // Sagas
              if (autoSagas && parsed.saga && livreActuel && !livreActuel.sagaId) {
                const sagaNomNorm = normaliserChaine(parsed.saga);
                let sagaTrouvee = sagasExistantes.find((s) => normaliserChaine(s.title) === sagaNomNorm);

                if (!sagaTrouvee) {
                  sagaTrouvee = {
                    id: "saga_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
                    title: parsed.saga,
                    author: parsed.authors,
                    genre: parsed.genre || "",
                    cover: parsed.cover || "",
                    sagaStatus: "Terminée",
                    userStatus: parsed.status === "Terminé" ? "En cours" : "À commencer",
                    totalVolumes: Math.max(1, parsed.tome || 1),
                    volumesRead: parsed.status === "Terminé" ? parsed.tome || 1 : 0,
                    nextVolume: parsed.status === "Terminé" ? `Tome ${(parsed.tome || 1) + 1}` : `Tome ${parsed.tome || 1}`,
                    notes: `Créée automatiquement depuis Goodreads pour "${parsed.title}".`,
                  };
                  sagasExistantes.push(sagaTrouvee);
                  sagasCreees++;
                }

                livreActuel.sagaId = sagaTrouvee.id;
                livreActuel.sagaTome = parsed.tome || 1;
              }
            }

            if (items.length < 10) {
              plusDeResultats = true;
            } else {
              page++;
              await new Promise((resolve) => setTimeout(resolve, 600));
            }
          }
        }

        if (totalTraites === 0) {
          afficherNotification(
            "Aucun livre n'a pu être synchronisé depuis votre compte Goodreads via ce lien.\n\n" +
            "💡 Pour importer 100% de vos livres sans aucun blocage, utilisez l'onglet '📁 Fichier Export (.csv)' dans cette même fenêtre !",
            "Aucun livre trouvé"
          );
          return;
        }

        sauvegarderLivres(tousLivres);
        if (autoSagas) sauvegarderSagas(sagasExistantes);

        modal.style.display = "none";
        if (onUpdateCallback) onUpdateCallback();

        let messageSucces = `Synchronisation effectuée avec Goodreads !\n\n`;
        messageSucces += `• ${totalTraites} livre(s) analysé(s)\n`;
        messageSucces += `• ${ajouts} nouveau(x) livre(s) ajouté(s)\n`;
        messageSucces += `• ${misesAJour} livre(s) mis à jour`;
        if (sagasCreees > 0) {
          messageSucces += `\n• ${sagasCreees} nouvelle(s) saga(s) créée(s) automatiquement`;
        }

        // GARDE-FOU STRICT POUR LE NETTOYAGE DE LA PAL :
        // Si le flux RSS a retourné <= 10 livres alors que la PAL locale en contient plus,
        // c'est la limite du proxy RSS public. On NE DOIT EN AUCUN CAS proposer la suppression de la PAL !
        const estFluxSuspect = totalTraites <= 10 && palInitialeLocale.length > 5;
        const verifierNettoyage = autoNettoyerPal && (shelfChoisie === "all" || shelfChoisie === "to-read") && !estFluxSuspect && !fluxTronqueDetecte;

        if (estFluxSuspect || fluxTronqueDetecte) {
          messageSucces += `\n\n🛡 Sécurité PAL : Seuls ${totalTraites} livre(s) ont été reçus via le flux public (limite de requête Goodreads). Aucun livre n'a été retiré de votre PAL pour protéger votre bibliothèque.\n\n👉 Pour nettoyer votre PAL et synchroniser tous vos livres sans limite, utilisez l'onglet « Fichier Export (.csv) ».`;
          afficherNotification(messageSucces, "Synchronisation terminée");
        } else if (verifierNettoyage && palInitialeLocale.length > 0) {
          const livresDisparus = palInitialeLocale.filter((localLivre) => {
            return !livresGoodreadsRecus.some((g) =>
              sontLivresEquivalents(localLivre.title, localLivre.authors, g.title, g.authors)
            );
          });

          if (livresDisparus.length > 0 && modalNettoyage && nettoyageBooksList) {
            afficherModalNettoyagePal(livresDisparus, onUpdateCallback, messageSucces);
          } else {
            afficherNotification(messageSucces, "Synchronisation réussie");
          }
        } else {
          afficherNotification(messageSucces, "Synchronisation réussie");
        }
      } catch (errGlobal) {
        console.error("Erreur synchronisation Goodreads :", errGlobal);
        afficherNotification(
          "Une erreur est survenue lors de la synchronisation avec Goodreads.\n\n💡 Conseil : Utilisez l'onglet « Fichier Export (.csv) » pour un import garanti sans coupure réseau.",
          "Erreur"
        );
      } finally {
        if (statusBox) statusBox.style.display = "none";
        if (btnLancer) btnLancer.disabled = false;
      }
    };
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

  initialiserGoodreadsSync(rafraichirAffichage);
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

// Dictionnaire des sagas ultra-populaires pour une détection instantanée et fiable à 100%
const SAGAS_POPULAIRES_TOMES = {
  // Fantasy & Sci-Fi classiques
  "harry potter": 7,
  "le seigneur des anneaux": 3,
  "lord of the rings": 3,
  "le trone de fer": 5,
  "a song of ice and fire": 5,
  "game of thrones": 5,
  "dune": 6,
  "hunger games": 3,
  "the hunger games": 3,
  "percy jackson": 5,
  "heros de lolympe": 5,
  "the heroes of olympus": 5,
  "les chroniques de narnia": 7,
  "the chronicles of narnia": 7,
  "narnia": 7,
  "le labyrinthe": 3,
  "the maze runner": 3,
  "divergente": 3,
  "divergent": 3,
  "twilight": 4,
  "la passe miroir": 4,
  "eragon": 4,
  "l heritage": 4,
  "the inheritance cycle": 4,
  "gardiens des cites perdues": 9,
  "keeper of the lost cities": 9,
  "six of crows": 2,
  "grisha": 3,
  "shadowhunters": 6,
  "la cite des tenebres": 6,
  "the mortal instruments": 6,
  "la roue du temps": 14,
  "the wheel of time": 14,
  "lassassin royal": 13,
  "the farseer trilogy": 3,
  "le sorceleur": 8,
  "the witcher": 8,
  "outlander": 9,
  // Romantasy & Romance
  "un palais depines et de roses": 5,
  "a court of thorns and roses": 5,
  "acotar": 5,
  "crescent city": 3,
  "fourth wing": 3,
  "the empyrean": 3,
  "empyrean": 3,
  "heartstopper": 5,
  "after": 5,
  "cinquante nuances": 3,
  "fifty shades": 3,
  "mountain men matchmaker": 4,
  "mountain men": 4,
  "twisted": 4,
  "twisted series": 4,
  "king of sin": 7,
  "off campus": 5,
  "briar u": 4,
  "la chronique des bridgerton": 8,
  "bridgerton": 8,
  "the folk of the air": 3,
  "le peuple de lair": 3,
  "prince cruel": 3,
  "shatter me": 6,
  "insaisissable": 6,
  "caraval": 3,
  "once upon a broken heart": 3,
  "il etait une fois un coeur brise": 3,
  "red rising": 6,
  "vampire academy": 6,
  "bloodlines": 6,
  "the selection": 5,
  "la selection": 5,
  "captive": 2,
};

async function chercherNombreTomesSaga(titreSaga, auteur = "") {
  if (!titreSaga) return null;
  const titreNorm = normaliserChaine(titreSaga).toLowerCase();

  // 1. Dictionnaire des sagas populaires
  for (const [cle, nb] of Object.entries(SAGAS_POPULAIRES_TOMES)) {
    if (titreNorm === cle || titreNorm.includes(cle) || cle.includes(titreNorm)) {
      return nb;
    }
  }

  // 2. Recherche en ligne Google Books API
  const detectedNumbers = [];
  const cleanTitle = titreSaga.replace(/[\(\[\{].*?[\)\]\}]/g, "").replace(/tome\s*\d+/gi, "").trim();
  const cleanAuthor = (auteur || "").replace(/[\(\[\{].*?[\)\]\}]/g, "").trim();
  const keyParam = typeof GOOGLE_API_KEY !== "undefined" && GOOGLE_API_KEY ? `&key=${GOOGLE_API_KEY}` : "";

  try {
    const q = encodeURIComponent(`"${cleanTitle}" ${cleanAuthor}`.trim());
    const url = `https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=25&printType=books${keyParam}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        data.items.forEach((item) => {
          const vi = item.volumeInfo || {};
          const fullText = `${vi.title || ""} ${vi.subtitle || ""} ${vi.description || ""}`;

          // Regex Tome / Book / Volume #X
          const matches = fullText.matchAll(/(?:tome|volume|vol\.?|book|livre|#)\s*([0-9]{1,2})\b/gi);
          for (const m of matches) {
            const val = parseInt(m[1], 10);
            if (val > 0 && val <= 50) detectedNumbers.push(val);
          }

          // Regex Boxset ou intégrale 1-X
          const matchesBox = fullText.matchAll(/(?:books?|tomes?|vols?)\s*1\s*[-–àa]\s*([0-9]{1,2})\b/gi);
          for (const m of matchesBox) {
            const val = parseInt(m[1], 10);
            if (val > 1 && val <= 50) detectedNumbers.push(val);
          }

          // Mots-clés de longueur
          if (/\bduologie\b|\bduology\b/i.test(fullText)) detectedNumbers.push(2);
          if (/\btrilogie\b|\btrilogy\b/i.test(fullText)) detectedNumbers.push(3);
          if (/\btétralogie\b|\btetralogy\b|\bquadrilogie\b/i.test(fullText)) detectedNumbers.push(4);
          if (/\bpentalogie\b|\bpentalogy\b/i.test(fullText)) detectedNumbers.push(5);
          if (/\bhexalogie\b|\bhexalogy\b/i.test(fullText)) detectedNumbers.push(6);
          if (/\bheptalogie\b|\bheptalogy\b/i.test(fullText)) detectedNumbers.push(7);
        });
      }
    }
  } catch (err) {
    console.warn("Erreur recherche Google Books pour tomes de saga :", err);
  }

  // 3. Repli Open Library API si aucun numéro détecté
  if (detectedNumbers.length === 0) {
    try {
      const qOl = encodeURIComponent(`${cleanTitle} ${cleanAuthor}`.trim());
      const resOl = await fetch(`https://openlibrary.org/search.json?q=${qOl}&limit=15`);
      if (resOl.ok) {
        const dataOl = await resOl.json();
        if (dataOl.docs && dataOl.docs.length > 0) {
          dataOl.docs.forEach((doc) => {
            const fullText = `${doc.title || ""} ${doc.subtitle || ""}`;
            const matches = fullText.matchAll(/(?:tome|volume|vol\.?|book|livre|#)\s*([0-9]{1,2})\b/gi);
            for (const m of matches) {
              const val = parseInt(m[1], 10);
              if (val > 0 && val <= 50) detectedNumbers.push(val);
            }
          });
        }
      }
    } catch (err) {
      console.warn("Erreur recherche Open Library pour tomes de saga :", err);
    }
  }

  // 4. Vérifier aussi les tomes existants dans la bibliothèque locale de l'utilisateur
  try {
    const livresLocaux = getLivres();
    livresLocaux.forEach((l) => {
      const memeSaga = (l.saga && normaliserChaine(l.saga) === titreNorm) || normaliserChaine(l.title || "").includes(titreNorm);
      if (memeSaga) {
        const tNum = parseInt(l.sagaTome, 10) || extraireInfosSagaEtTome(l.title).tomeDetecte || 0;
        if (tNum > 0 && tNum <= 50) detectedNumbers.push(tNum);
      }
    });
  } catch (e) {}

  if (detectedNumbers.length > 0) {
    const maxTome = Math.max(...detectedNumbers);
    if (maxTome > 0) return maxTome;
  }

  return null;
}

function synchroniserStatistiquesSaga(saga, tousLivres = null) {
  if (!saga) return saga;
  if (!tousLivres) tousLivres = getLivres();

  const sagaTitreNorm = normaliserChaine(saga.title || "");

  // 1. Livres associés par sagaId ou correspondance de nom de saga
  const livresAssocies = tousLivres.filter((l) => {
    if (l.sagaId && l.sagaId === saga.id) return true;
    if (l.saga && normaliserChaine(l.saga) === sagaTitreNorm && sagaTitreNorm.length > 2) return true;
    return false;
  }).sort((a, b) => (parseInt(a.sagaTome, 10) || 0) - (parseInt(b.sagaTome, 10) || 0));

  // Raccrocher le sagaId si manquant
  livresAssocies.forEach((l) => {
    if (!l.sagaId && saga.id) l.sagaId = saga.id;
  });

  // 2. Extraire tomes et statuts
  const tomesLusUniques = new Set();
  const tomesEnCoursUniques = new Set();
  const tomesPossedesTous = new Set();
  let maxTomeLivre = 0;

  livresAssocies.forEach((l) => {
    const tomeNum = parseInt(l.sagaTome, 10) || extraireInfosSagaEtTome(l.title).tomeDetecte || 1;
    if (tomeNum > 0) {
      tomesPossedesTous.add(tomeNum);
      if (tomeNum > maxTomeLivre) maxTomeLivre = tomeNum;

      if (l.status === "Terminé") {
        tomesLusUniques.add(tomeNum);
      } else if (l.status === "En cours") {
        tomesEnCoursUniques.add(tomeNum);
      }
    }
  });

  // 3. Tomes lus effectifs
  const tomesLusManuel = parseInt(saga.volumesRead, 10) || 0;
  const tomesLus = Math.max(tomesLusManuel, tomesLusUniques.size);

  // 4. Nombre total de tomes
  let totalTomes = parseInt(saga.totalVolumes, 10) || 1;
  totalTomes = Math.max(totalTomes, maxTomeLivre, tomesLus, 1);

  // 5. Complétion
  const estCompletementLue = tomesLus >= totalTomes;
  const nbPossedes = livresAssocies.length;
  const nbPossedesTermines = livresAssocies.filter((l) => l.status === "Terminé").length;
  const tousPossedesLus = nbPossedes > 0 && nbPossedesTermines === nbPossedes;

  // 6. Prochain tome à lire
  let prochainTome = "";
  if (estCompletementLue) {
    prochainTome = "Saga complète lue ! 🎉";
  } else {
    let prochainNum = 1;
    while (tomesLusUniques.has(prochainNum) && prochainNum <= totalTomes) {
      prochainNum++;
    }
    if (prochainNum > totalTomes) {
      prochainNum = tomesLus + 1;
    }

    const livreSuivant = livresAssocies.find(
      (l) => (parseInt(l.sagaTome, 10) || extraireInfosSagaEtTome(l.title).tomeDetecte) === prochainNum
    );
    if (livreSuivant) {
      prochainTome = `Tome ${prochainNum} : ${livreSuivant.title}`;
    } else {
      prochainTome = `Tome ${prochainNum}`;
    }
  }

  // 7. Statut de lecture utilisateur
  let statutPerso = saga.userStatus || "À commencer";
  if (estCompletementLue) {
    statutPerso = "Terminée";
  } else if (tomesEnCoursUniques.size > 0 || tomesLus > 0) {
    if (statutPerso !== "Abandonnée" && statutPerso !== "En pause") {
      statutPerso = "En cours";
    }
  }

  saga.volumesRead = tomesLus;
  saga.totalVolumes = totalTomes;
  saga.nextVolume = prochainTome;
  saga.userStatus = statutPerso;
  saga.estCompletementLue = estCompletementLue;
  saga.tousPossedesLus = tousPossedesLus;
  saga.livresAssociesCount = nbPossedes;

  return saga;
}

function synchroniserToutesLesSagas(tousLivres = null) {
  try {
    const sagas = getSagas();
    if (!sagas || sagas.length === 0) return;
    if (!tousLivres) tousLivres = getLivres();

    let modifie = false;
    sagas.forEach((s) => {
      const avant = `${s.volumesRead}|${s.totalVolumes}|${s.userStatus}|${s.nextVolume}`;
      synchroniserStatistiquesSaga(s, tousLivres);
      const apres = `${s.volumesRead}|${s.totalVolumes}|${s.userStatus}|${s.nextVolume}`;
      if (avant !== apres) modifie = true;
    });

    if (modifie) {
      sauvegarderSagas(sagas);
    }
  } catch (e) {
    console.warn("Erreur synchroniserToutesLesSagas :", e);
  }
}

function initialiserSagas() {
  const container = document.getElementById("sagas-container");
  const btnCreerDepuisLivre = document.getElementById("btn-creer-depuis-livre");
  const btnNouvelleSaga = document.getElementById("btn-nouvelle-saga");
  const selectFiltre = document.getElementById("filtre-saga-statut");
  const inputRecherche = document.getElementById("filtre-saga-texte");

  // Modale Saga principale
  const modal = document.getElementById("saga-modal");
  const modalTitle = document.getElementById("saga-modal-title");
  const modalClose = document.getElementById("saga-modal-close");
  const tabsNav = document.getElementById("saga-tabs-nav");
  const tabBtnLivre = document.getElementById("tab-btn-livre");
  const tabBtnManuel = document.getElementById("tab-btn-manuel");
  const viewLivre = document.getElementById("saga-view-livre");
  const viewManuel = document.getElementById("saga-view-manuel");

  // Éléments Onglet 1 : Création depuis un livre existant
  const stepChoix = document.getElementById("saga-picker-step-choix");
  const inputSearchLivre = document.getElementById("saga-picker-search");
  const gridLivresPicker = document.getElementById("saga-picker-books-grid");
  const stepConfirmer = document.getElementById("saga-picker-step-confirmer");
  const btnRetourChoix = document.getElementById("saga-chosen-btn-retour");
  const formDepuisLivre = document.getElementById("saga-form-depuis-livre");

  const chosenCover = document.getElementById("saga-chosen-cover");
  const chosenTitle = document.getElementById("saga-chosen-title");
  const chosenAuthor = document.getElementById("saga-chosen-author");
  const chosenMeta = document.getElementById("saga-chosen-meta");

  const livreTitre = document.getElementById("saga-livre-titre");
  const livreAuteur = document.getElementById("saga-livre-auteur");
  const livreGenre = document.getElementById("saga-livre-genre");
  const livreStatutSaga = document.getElementById("saga-livre-statut-saga");
  const livreStatutPerso = document.getElementById("saga-livre-statut-perso");
  const livreTotalTomes = document.getElementById("saga-livre-total-tomes");
  const livreLusTomes = document.getElementById("saga-livre-lus-tomes");
  const livreTomeNum = document.getElementById("saga-livre-tome-num");
  const livreProchain = document.getElementById("saga-livre-prochain");
  const livreSourceId = document.getElementById("saga-livre-source-id");
  const livreCoverUrl = document.getElementById("saga-livre-cover-url");
  const livreNotes = document.getElementById("saga-livre-notes");
  const btnLivreAnnuler = document.getElementById("saga-livre-btn-annuler");

  // Éléments Onglet 2 : Saisie manuelle ou modification
  const formManuel = document.getElementById("saga-form");
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

  // Modale Associer un livre existant
  const modalAssocier = document.getElementById("associer-livre-modal");
  const associerModalClose = document.getElementById("associer-modal-close");
  const associerSagaNom = document.getElementById("associer-saga-nom");
  const associerStepGalerie = document.getElementById("associer-step-galerie");
  const associerSearchInput = document.getElementById("associer-search-input");
  const associerBooksGrid = document.getElementById("associer-books-grid");
  const associerStepConfirm = document.getElementById("associer-step-confirm");
  const associerBtnRechoisir = document.getElementById("associer-btn-rechoisir");
  const associerForm = document.getElementById("associer-livre-form");
  const associerConfirmCover = document.getElementById("associer-confirm-cover");
  const associerConfirmTitle = document.getElementById("associer-confirm-title");
  const associerConfirmAuthor = document.getElementById("associer-confirm-author");
  const associerInputTome = document.getElementById("associer-input-tome");
  const associerBookIdHidden = document.getElementById("associer-book-id-hidden");
  const associerBtnAnnuler = document.getElementById("associer-btn-annuler");

  let sagaEnEditionId = null;
  let sagaCibleAssocier = null;

  // ------------------------------------------------------------------------
  // KPIs & Affichage
  // ------------------------------------------------------------------------

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
    const tousLivres = getLivres();

    // Synchronisation dynamique immédiate de toutes les sagas
    let aModifie = false;
    sagas.forEach((s) => {
      const avant = `${s.volumesRead}|${s.totalVolumes}|${s.userStatus}|${s.nextVolume}`;
      synchroniserStatistiquesSaga(s, tousLivres);
      const apres = `${s.volumesRead}|${s.totalVolumes}|${s.userStatus}|${s.nextVolume}`;
      if (avant !== apres) aModifie = true;
    });
    if (aModifie) {
      sauvegarderSagas(sagas);
    }

    // Détection en arrière-plan pour les sagas non encore vérifiées en ligne
    sagas.forEach((saga) => {
      if (!saga.tomesVerifies) {
        chercherNombreTomesSaga(saga.title, saga.author).then((nbReel) => {
          if (nbReel && nbReel > 0) {
            const liste = getSagas();
            const target = liste.find((s) => s.id === saga.id);
            if (target && target.totalVolumes !== nbReel) {
              target.totalVolumes = nbReel;
              target.tomesVerifies = true;
              synchroniserStatistiquesSaga(target, getLivres());
              sauvegarderSagas(liste);
              rafraichirSagas();
            } else if (target) {
              target.tomesVerifies = true;
              sauvegarderSagas(liste);
            }
          } else {
            const liste = getSagas();
            const target = liste.find((s) => s.id === saga.id);
            if (target) {
              target.tomesVerifies = true;
              sauvegarderSagas(liste);
            }
          }
        }).catch(() => {});
      }
    });

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
        <div class="empty-state" style="grid-column: 1 / -1; padding: 40px 20px;">
          ${sagas.length === 0 
            ? `Vous n'avez pas encore de saga suivie.<br><br>
               <button id="btn-empty-add-livre" class="btn-primary" style="margin-right: 10px;">📚 Créer depuis ma bibliothèque</button>
               <button id="btn-empty-add-manuel" class="btn-secondary">✏️ Créer manuellement</button>`
            : `Aucune saga ne correspond à vos filtres.`}
        </div>
      `;
      const btnEmptyLivre = document.getElementById("btn-empty-add-livre");
      const btnEmptyManuel = document.getElementById("btn-empty-add-manuel");
      if (btnEmptyLivre) btnEmptyLivre.onclick = () => ouvrirModalDepuisLivre();
      if (btnEmptyManuel) btnEmptyManuel.onclick = () => ouvrirModalManuel();
      return;
    }

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
        .filter((l) => l.sagaId === saga.id || (l.saga && normaliserChaine(l.saga) === normaliserChaine(saga.title)))
        .sort((a, b) => (parseInt(a.sagaTome, 10) || 0) - (parseInt(b.sagaTome, 10) || 0));

      // Bannières de statut / complétion
      let bannerHtml = "";
      if (saga.estCompletementLue || tomesLus >= totalTomes) {
        bannerHtml = `
          <div class="saga-banner saga-completed-banner">
            <span>🏆 <strong>Saga terminée !</strong> Vous avez lu les ${totalTomes} tomes de cette saga.</span>
          </div>
        `;
      } else if (saga.tousPossedesLus && livresAssocies.length > 0) {
        bannerHtml = `
          <div class="saga-banner saga-caught-up-banner">
            <div class="saga-caught-up-text">
              <span>✨ <strong>À jour !</strong> Tous vos tomes possédés (${livresAssocies.length}/${livresAssocies.length}) sont lus.</span>
            </div>
            <button type="button" class="btn-saga-finish-now" data-saga-id="${saga.id}" title="Si vous considérez cette saga finie pour vous">
              🏁 Marquer comme terminée
            </button>
          </div>
        `;
      }

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

        ${bannerHtml}

        <div class="saga-progress-section">
          <div class="saga-progress-header">
            <span class="saga-tomes-count">
              Tomes lus : <strong>${tomesLus}</strong> / ${totalTomes}
              <button type="button" class="btn-detect-tomes-card" data-saga-id="${saga.id}" title="Rechercher en ligne le vrai nombre de tomes de cette saga">
                🔍 Détecter tomes
              </button>
            </span>
            <span class="saga-percent">${pourcentage}%</span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill ${saga.estCompletementLue ? 'fill-completed' : ''}" style="width: ${pourcentage}%;"></div>
          </div>
          <div class="saga-tomes-remaining">
            ${(saga.estCompletementLue || tomesRestants === 0)
              ? "🎉 Félicitations, vous avez terminé cette saga !" 
              : `Il vous reste : <strong>${tomesRestants}</strong> tome${tomesRestants > 1 ? "s" : ""} à lire`}
          </div>
        </div>

        <div class="saga-next-box ${(saga.estCompletementLue || tomesRestants === 0) ? 'saga-next-box-completed' : ''}">
          <span class="saga-next-icon">${(saga.estCompletementLue || tomesRestants === 0) ? '🏆' : '🎯'}</span>
          <div>
            <div class="saga-next-text">${(saga.estCompletementLue || tomesRestants === 0) ? "Statut :" : "Prochain tome à lire :"}</div>
            <div class="saga-next-title">${escapeHtml(saga.nextVolume || (tomesRestants === 0 ? "Saga complète lue ! 🎉" : `Tome ${tomesLus + 1}`))}</div>
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
          <button type="button" class="btn-quick-read" ${(saga.estCompletementLue || tomesLus >= totalTomes) ? "disabled" : ""} title="Marquer un tome supplémentaire comme lu">
            ➕ 1 Tome lu
          </button>
          <button type="button" class="btn-detect-action" data-saga-id="${saga.id}" title="Rechercher en ligne le nombre réel de tomes">
            🔍 Vrai nb tomes
          </button>
          <div class="saga-card-buttons">
            <button type="button" class="btn-text btn-edit" title="Modifier la saga">✏️</button>
            <button type="button" class="btn-text delete-button" title="Supprimer la saga">🗑</button>
          </div>
        </div>
      `;

      // Clic Marquer comme finie
      const btnFinishNow = card.querySelector(".btn-saga-finish-now");
      if (btnFinishNow) {
        btnFinishNow.onclick = (e) => {
          e.stopPropagation();
          demanderConfirmation(`Voulez-vous marquer la saga "${saga.title}" comme complètement terminée pour vous ?`, () => {
            const liste = getSagas();
            const target = liste.find((s) => s.id === saga.id);
            if (!target) return;
            target.totalVolumes = tomesLus;
            target.volumesRead = tomesLus;
            target.userStatus = "Terminée";
            target.nextVolume = "Saga complète lue ! 🎉";
            target.tomesVerifies = true;
            sauvegarderSagas(liste);
            rafraichirSagas();
            afficherNotification(`Félicitations ! La saga "${target.title}" est marquée comme terminée ! 🏆`, "Saga terminée");
          });
        };
      }

      // Clic Détecter le vrai nombre de tomes
      card.querySelectorAll(".btn-detect-tomes-card, .btn-detect-action").forEach((btnDetect) => {
        btnDetect.onclick = async (e) => {
          e.stopPropagation();
          const origText = btnDetect.innerHTML;
          btnDetect.innerHTML = "⏳ Recherche...";
          btnDetect.disabled = true;
          try {
            const nb = await chercherNombreTomesSaga(saga.title, saga.author);
            if (nb && nb > 0) {
              const liste = getSagas();
              const target = liste.find((s) => s.id === saga.id);
              if (target) {
                target.totalVolumes = nb;
                target.tomesVerifies = true;
                synchroniserStatistiquesSaga(target, getLivres());
                sauvegarderSagas(liste);
                rafraichirSagas();
                afficherNotification(`✨ Vrai nombre de tomes détecté : ${nb} tomes pour "${target.title}" !`, "Détection réussie");
              }
            } else {
              afficherNotification(`Impossible de déterminer avec certitude le nombre de tomes pour "${saga.title}". Vous pouvez le modifier avec ✏️.`, "Information");
              btnDetect.innerHTML = origText;
              btnDetect.disabled = false;
            }
          } catch (err) {
            afficherNotification("Erreur lors de la détection en ligne.", "Erreur");
            btnDetect.innerHTML = origText;
            btnDetect.disabled = false;
          }
        };
      });

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
            synchroniserStatistiquesSaga(target, getLivres());
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
          ouvrirModalModification(saga.id);
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
            const sagasActuelles = getSagas();
            const targetSaga = sagasActuelles.find((s) => s.id === saga.id);
            if (targetSaga) {
              synchroniserStatistiquesSaga(targetSaga, livres);
              sauvegarderSagas(sagasActuelles);
            }
            rafraichirSagas();
            afficherNotification(`Le livre "${livre.title}" a été dissocié de la saga.`);
          }
        };
      });

      container.appendChild(card);
    });
  }

  // ------------------------------------------------------------------------
  // Navigation par onglets dans la modale Saga
  // ------------------------------------------------------------------------

  function activerOnglet(onglet) {
    if (onglet === "livre") {
      if (tabBtnLivre) tabBtnLivre.classList.add("active");
      if (tabBtnManuel) tabBtnManuel.classList.remove("active");
      if (viewLivre) viewLivre.style.display = "block";
      if (viewManuel) viewManuel.style.display = "none";
      rafraichirGrilleLivresSaga();
    } else {
      if (tabBtnManuel) tabBtnManuel.classList.add("active");
      if (tabBtnLivre) tabBtnLivre.classList.remove("active");
      if (viewManuel) viewManuel.style.display = "block";
      if (viewLivre) viewLivre.style.display = "none";
    }
  }

  if (tabBtnLivre) {
    tabBtnLivre.onclick = () => {
      activerOnglet("livre");
    };
  }

  if (tabBtnManuel) {
    tabBtnManuel.onclick = () => {
      activerOnglet("manuel");
    };
  }

  // ------------------------------------------------------------------------
  // Flux Onglet 1 : Créer depuis un livre de la bibliothèque
  // ------------------------------------------------------------------------

  function rafraichirGrilleLivresSaga() {
    if (!gridLivresPicker) return;
    const livres = getLivres();
    const sagas = getSagas();
    const recherche = inputSearchLivre ? normaliserChaine(inputSearchLivre.value) : "";

    const filtres = livres.filter((l) => {
      if (recherche) {
        const t = normaliserChaine(l.title);
        const a = normaliserChaine(l.authors);
        const g = normaliserChaine(l.genre);
        if (!t.includes(recherche) && !a.includes(recherche) && !g.includes(recherche)) {
          return false;
        }
      }
      return true;
    });

    gridLivresPicker.innerHTML = "";

    if (filtres.length === 0) {
      gridLivresPicker.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; padding: 24px;">
          ${livres.length === 0 ? "Votre bibliothèque est vide. Ajoutez d'abord des livres !" : "Aucun livre trouvé correspondant à la recherche."}
        </div>
      `;
      return;
    }

    filtres.forEach((livre) => {
      const card = document.createElement("div");
      card.classList.add("picker-book-card");

      const coverHtml = livre.cover
        ? `<img src="${escapeHtml(livre.cover)}" alt="${escapeHtml(livre.title)}" class="picker-book-cover" onerror="this.onerror=null; this.src='${PLACEHOLDER_COVER}';">`
        : `<div class="picker-book-cover-placeholder">📖</div>`;

      const sagaLiee = livre.sagaId ? sagas.find((s) => s.id === livre.sagaId) : null;
      const sagaBadgeHtml = sagaLiee
        ? `<span class="badge-saga-link" style="font-size: 0.68rem; padding: 2px 6px;">📚 ${escapeHtml(sagaLiee.title)}${livre.sagaTome ? ` (T.${livre.sagaTome})` : ""}</span>`
        : "";

      card.innerHTML = `
        <div class="picker-book-cover-wrap">
          ${coverHtml}
        </div>
        <h4 class="picker-book-title" title="${escapeHtml(livre.title)}">${escapeHtml(livre.title)}</h4>
        <p class="picker-book-author" title="${escapeHtml(livre.authors)}">${escapeHtml(livre.authors)}</p>
        <div class="picker-book-footer">
          <span class="status-badge ${getBadgeClasse(livre.status)}" style="font-size: 0.68rem; padding: 1px 5px;">${escapeHtml(livre.status)}</span>
          ${sagaBadgeHtml}
        </div>
      `;

      card.onclick = () => {
        selectionnerLivrePourNouvelleSaga(livre);
      };

      gridLivresPicker.appendChild(card);
    });
  }

  if (inputSearchLivre) {
    inputSearchLivre.oninput = rafraichirGrilleLivresSaga;
  }

  function selectionnerLivrePourNouvelleSaga(livre) {
    if (!livre) return;
    const info = extraireInfosSagaEtTome(livre.title);
    const titreDetecte = info.nomSousTitre ? info.titreSaga : (info.titreSaga || livre.title);
    const tomeDetecte = info.tomeDetecte || 1;

    // Récapitulatif visuel
    if (chosenCover) chosenCover.src = livre.cover || PLACEHOLDER_COVER;
    if (chosenTitle) chosenTitle.textContent = livre.title;
    if (chosenAuthor) chosenAuthor.textContent = livre.authors || "Auteur inconnu";
    if (chosenMeta) chosenMeta.textContent = `Statut : ${livre.status} • Tome ${tomeDetecte} détecté`;

    // Champs pré-remplis
    if (livreTitre) livreTitre.value = titreDetecte;
    if (livreAuteur) livreAuteur.value = livre.authors || "";
    if (livreGenre) livreGenre.value = (livre.genre && livre.genre !== "Inconnu") ? livre.genre : "";
    if (livreStatutSaga) livreStatutSaga.value = "Terminée";
    if (livreTomeNum) livreTomeNum.value = tomeDetecte;
    if (livreTotalTomes) livreTotalTomes.value = tomeDetecte || 1;

    // Détection des tomes déjà lus dans la bibliothèque pour cette même saga
    const livresMemeSaga = getLivres().filter((l) => {
      const memeNom = l.saga && normaliserChaine(l.saga) === normaliserChaine(titreDetecte);
      const titreInclut = normaliserChaine(l.title).includes(normaliserChaine(titreDetecte));
      return memeNom || titreInclut;
    });
    const tomesLusExistants = new Set();
    livresMemeSaga.forEach((l) => {
      if (l.status === "Terminé") {
        const t = parseInt(l.sagaTome, 10) || extraireInfosSagaEtTome(l.title).tomeDetecte || 1;
        tomesLusExistants.add(t);
      }
    });
    if (livre.status === "Terminé") tomesLusExistants.add(tomeDetecte);

    const nbLusInitial = tomesLusExistants.size;
    if (livreLusTomes) livreLusTomes.value = nbLusInitial;

    if (livre.status === "Terminé") {
      let next = 1;
      while (tomesLusExistants.has(next)) next++;
      if (livreStatutPerso) livreStatutPerso.value = "En cours";
      if (livreProchain) livreProchain.value = `Tome ${next}`;
    } else if (livre.status === "En cours") {
      if (livreStatutPerso) livreStatutPerso.value = "En cours";
      if (livreProchain) livreProchain.value = `Tome ${tomeDetecte}`;
    } else {
      if (livreStatutPerso) livreStatutPerso.value = "À commencer";
      if (livreProchain) livreProchain.value = `Tome ${tomeDetecte}`;
    }

    if (livreSourceId) livreSourceId.value = livre.id;
    if (livreCoverUrl) livreCoverUrl.value = livre.cover || "";
    if (livreNotes) livreNotes.value = (livre.description && livre.description !== "Pas de résumé disponible.") ? livre.description : "";

    // Lancer la détection du vrai nombre de tomes en ligne
    chercherNombreTomesSaga(titreDetecte, livre.authors).then((nbReel) => {
      if (nbReel && nbReel > 0 && livreTotalTomes) {
        livreTotalTomes.value = Math.max(nbReel, tomeDetecte);
        ajusterDepuisLivre();
      }
    }).catch(() => {});

    if (stepChoix) stepChoix.style.display = "none";
    if (stepConfirmer) stepConfirmer.style.display = "block";
  }

  if (btnRetourChoix) {
    btnRetourChoix.onclick = () => {
      if (stepConfirmer) stepConfirmer.style.display = "none";
      if (stepChoix) stepChoix.style.display = "block";
    };
  }

  // Bouton Détecter en ligne dans l'onglet depuis un livre
  const btnDetecterLivre = document.getElementById("btn-detecter-depuis-livre");
  if (btnDetecterLivre) {
    btnDetecterLivre.onclick = async () => {
      const titre = livreTitre ? livreTitre.value.trim() : "";
      const auteur = livreAuteur ? livreAuteur.value.trim() : "";
      if (!titre) {
        afficherNotification("Veuillez renseigner un titre de saga.");
        return;
      }
      btnDetecterLivre.textContent = "⏳ Recherche...";
      btnDetecterLivre.disabled = true;
      const nb = await chercherNombreTomesSaga(titre, auteur);
      btnDetecterLivre.textContent = "🔍 Détecter";
      btnDetecterLivre.disabled = false;
      if (nb && nb > 0) {
        if (livreTotalTomes) livreTotalTomes.value = nb;
        afficherNotification(`✨ ${nb} tomes détectés pour "${titre}" !`, "Détection réussie");
        ajusterDepuisLivre();
      } else {
        afficherNotification("Aucun nombre de tomes précis trouvé en ligne. Vous pouvez saisir le nombre manuellement.", "Information");
      }
    };
  }

  // Ajustement dynamique sur le formulaire depuis un livre
  if (livreLusTomes && livreTotalTomes && livreStatutPerso && livreProchain) {
    const ajusterDepuisLivre = () => {
      const lus = parseInt(livreLusTomes.value, 10) || 0;
      const total = parseInt(livreTotalTomes.value, 10) || 1;
      if (lus >= total) {
        livreStatutPerso.value = "Terminée";
        if (!livreProchain.value || livreProchain.value.toLowerCase().startsWith("tome")) {
          livreProchain.value = "Saga terminée ! 🎉";
        }
      } else if (lus > 0) {
        if (livreStatutPerso.value === "À commencer" || livreStatutPerso.value === "Terminée") {
          livreStatutPerso.value = "En cours";
        }
        if (!livreProchain.value || livreProchain.value.toLowerCase().startsWith("tome") || livreProchain.value.includes("terminée")) {
          livreProchain.value = `Tome ${lus + 1}`;
        }
      } else {
        if (livreStatutPerso.value === "Terminée" || livreStatutPerso.value === "En cours") {
          livreStatutPerso.value = "À commencer";
        }
        if (!livreProchain.value || livreProchain.value.toLowerCase().startsWith("tome") || livreProchain.value.includes("terminée")) {
          livreProchain.value = "Tome 1";
        }
      }
    };
    livreLusTomes.addEventListener("input", ajusterDepuisLivre);
    livreTotalTomes.addEventListener("input", ajusterDepuisLivre);
  }

  // Soumission création de saga depuis un livre existant
  if (formDepuisLivre) {
    formDepuisLivre.onsubmit = (e) => {
      e.preventDefault();
      const titre = livreTitre ? livreTitre.value.trim() : "";
      const auteur = livreAuteur ? livreAuteur.value.trim() : "";
      if (!titre || !auteur) {
        afficherNotification("Veuillez indiquer au minimum le titre et l'auteur de la saga.");
        return;
      }

      const totalTomes = Math.max(1, parseInt(livreTotalTomes ? livreTotalTomes.value : "1", 10) || 1);
      let tomesLus = Math.max(0, parseInt(livreLusTomes ? livreLusTomes.value : "0", 10) || 0);
      if (tomesLus > totalTomes) tomesLus = totalTomes;

      let prochainTome = livreProchain ? livreProchain.value.trim() : "";
      if (!prochainTome) {
        prochainTome = tomesLus >= totalTomes ? "Saga complète lue ! 🎉" : `Tome ${tomesLus + 1}`;
      }

      const sagas = getSagas();
      const nouvelleSaga = {
        id: "saga_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
        title: titre,
        author: auteur,
        genre: livreGenre ? livreGenre.value.trim() : "",
        cover: livreCoverUrl ? livreCoverUrl.value.trim() : "",
        sagaStatus: livreStatutSaga ? livreStatutSaga.value : "Terminée",
        userStatus: livreStatutPerso ? livreStatutPerso.value : "À commencer",
        totalVolumes: totalTomes,
        volumesRead: tomesLus,
        nextVolume: prochainTome,
        notes: livreNotes ? livreNotes.value.trim() : "",
        tomesVerifies: true,
      };

      sagas.push(nouvelleSaga);

      // Association automatique du livre source et des autres livres du même nom
      const bookId = livreSourceId ? livreSourceId.value : "";
      const tomeNum = (livreTomeNum && livreTomeNum.value) ? parseInt(livreTomeNum.value, 10) : 1;
      const livres = getLivres();
      if (bookId) {
        const livreSrc = livres.find((l) => l.id === bookId);
        if (livreSrc) {
          livreSrc.sagaId = nouvelleSaga.id;
          livreSrc.sagaTome = tomeNum || 1;
        }
      }
      livres.forEach((l) => {
        if (!l.sagaId && l.saga && normaliserChaine(l.saga) === normaliserChaine(titre)) {
          l.sagaId = nouvelleSaga.id;
          if (!l.sagaTome) {
            const inf = extraireInfosSagaEtTome(l.title);
            l.sagaTome = inf.tomeDetecte || 1;
          }
        }
      });
      sauvegarderLivres(livres);

      synchroniserStatistiquesSaga(nouvelleSaga, livres);
      sauvegarderSagas(sagas);

      modal.style.display = "none";
      rafraichirSagas();
      afficherNotification(`✨ La saga "${titre}" a été créée et synchronisée !`, "Saga créée");
    };
  }

  // ------------------------------------------------------------------------
  // Flux Onglet 2 / Manuel & Modification
  // ------------------------------------------------------------------------

  function ouvrirModalDepuisLivre() {
    if (!modal) return;
    sagaEnEditionId = null;
    if (modalTitle) modalTitle.textContent = "Ajouter une saga";
    if (tabsNav) tabsNav.style.display = "flex";
    if (stepChoix) stepChoix.style.display = "block";
    if (stepConfirmer) stepConfirmer.style.display = "none";
    if (inputSearchLivre) inputSearchLivre.value = "";
    activerOnglet("livre");
    modal.style.display = "flex";
    if (inputSearchLivre) inputSearchLivre.focus();
  }

  function ouvrirModalManuel() {
    if (!modal) return;
    sagaEnEditionId = null;
    if (modalTitle) modalTitle.textContent = "Ajouter une saga";
    if (tabsNav) tabsNav.style.display = "flex";
    if (formManuel) formManuel.reset();
    if (inputStatutSaga) inputStatutSaga.value = "Terminée";
    if (inputStatutPerso) inputStatutPerso.value = "À commencer";
    if (inputTotal) inputTotal.value = "1";
    if (inputLus) inputLus.value = "0";
    if (inputProchain) inputProchain.value = "Tome 1";
    if (btnSupprimer) btnSupprimer.style.display = "none";
    activerOnglet("manuel");
    modal.style.display = "flex";
    if (inputTitre) inputTitre.focus();
  }

  function ouvrirModalModification(sagaId) {
    if (!modal) return;
    sagaEnEditionId = sagaId;
    const sagas = getSagas();
    const saga = sagas.find((s) => s.id === sagaId);
    if (!saga) return;

    if (modalTitle) modalTitle.textContent = "Modifier la saga";
    if (tabsNav) tabsNav.style.display = "none"; // Masquer les onglets en édition
    if (viewLivre) viewLivre.style.display = "none";
    if (viewManuel) viewManuel.style.display = "block";

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

    modal.style.display = "flex";
    if (inputTitre) inputTitre.focus();
  }

  // Bouton Détecter en ligne dans l'onglet manuel
  const btnDetecterManuel = document.getElementById("btn-detecter-manuel");
  if (btnDetecterManuel) {
    btnDetecterManuel.onclick = async () => {
      const titre = inputTitre ? inputTitre.value.trim() : "";
      const auteur = inputAuteur ? inputAuteur.value.trim() : "";
      if (!titre) {
        afficherNotification("Veuillez renseigner le titre de la saga.");
        return;
      }
      btnDetecterManuel.textContent = "⏳ Recherche...";
      btnDetecterManuel.disabled = true;
      const nb = await chercherNombreTomesSaga(titre, auteur);
      btnDetecterManuel.textContent = "🔍 Détecter";
      btnDetecterManuel.disabled = false;
      if (nb && nb > 0) {
        if (inputTotal) inputTotal.value = nb;
        afficherNotification(`✨ ${nb} tomes détectés pour "${titre}" !`, "Détection réussie");
        ajusterManuel();
      } else {
        afficherNotification("Aucun nombre précis détecté en ligne. Vous pouvez le saisir manuellement.", "Information");
      }
    };
  }

  // Ajustement dynamique sur le formulaire manuel
  if (inputLus && inputTotal && inputStatutPerso && inputProchain) {
    const ajusterManuel = () => {
      const lus = parseInt(inputLus.value, 10) || 0;
      const total = parseInt(inputTotal.value, 10) || 1;
      if (lus >= total) {
        inputStatutPerso.value = "Terminée";
        if (!inputProchain.value || inputProchain.value.toLowerCase().startsWith("tome")) {
          inputProchain.value = "Saga terminée ! 🎉";
        }
      } else if (lus > 0) {
        if (inputStatutPerso.value === "À commencer" || inputStatutPerso.value === "Terminée") {
          inputStatutPerso.value = "En cours";
        }
        if (!inputProchain.value || inputProchain.value.toLowerCase().startsWith("tome") || inputProchain.value.includes("terminée")) {
          inputProchain.value = `Tome ${lus + 1}`;
        }
      } else {
        if (inputStatutPerso.value === "Terminée" || inputStatutPerso.value === "En cours") {
          inputStatutPerso.value = "À commencer";
        }
        if (!inputProchain.value || inputProchain.value.toLowerCase().startsWith("tome") || inputProchain.value.includes("terminée")) {
          inputProchain.value = "Tome 1";
        }
      }
    };
    inputLus.addEventListener("input", ajusterManuel);
    inputTotal.addEventListener("input", ajusterManuel);
  }

  // Soumission formulaire manuel (création ou édition)
  if (formManuel) {
    formManuel.onsubmit = (e) => {
      e.preventDefault();
      const titre = inputTitre ? inputTitre.value.trim() : "";
      const auteur = inputAuteur ? inputAuteur.value.trim() : "";
      if (!titre || !auteur) {
        afficherNotification("Veuillez renseigner au minimum le titre et l'auteur de la saga.");
        return;
      }

      const totalTomes = Math.max(1, parseInt(inputTotal ? inputTotal.value : "1", 10) || 1);
      let tomesLus = Math.max(0, parseInt(inputLus ? inputLus.value : "0", 10) || 0);
      if (tomesLus > totalTomes) tomesLus = totalTomes;

      let prochainTome = inputProchain ? inputProchain.value.trim() : "";
      if (!prochainTome) {
        prochainTome = tomesLus >= totalTomes ? "Saga complète lue ! 🎉" : `Tome ${tomesLus + 1}`;
      }

      const sagas = getSagas();

      if (sagaEnEditionId === null) {
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
          tomesVerifies: true,
        };
        synchroniserStatistiquesSaga(nouvelleSaga, getLivres());
        sagas.push(nouvelleSaga);
        afficherNotification(`✨ La saga "${titre}" a été ajoutée !`, "Saga ajoutée");
      } else {
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
            tomesVerifies: true,
          };
          synchroniserStatistiquesSaga(sagas[index], getLivres());
          afficherNotification(`La saga "${titre}" a été mise à jour !`, "Saga modifiée");
        }
      }

      sauvegarderSagas(sagas);
      modal.style.display = "none";
      sagaEnEditionId = null;
      rafraichirSagas();
    };
  }

  // Suppression depuis modale d'édition
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

  // Fermetures modale Saga
  if (modalClose) modalClose.onclick = () => (modal.style.display = "none");
  if (btnAnnuler) btnAnnuler.onclick = () => (modal.style.display = "none");
  if (btnLivreAnnuler) btnLivreAnnuler.onclick = () => (modal.style.display = "none");

  // Boutons du bandeau supérieur
  if (btnCreerDepuisLivre) btnCreerDepuisLivre.onclick = () => ouvrirModalDepuisLivre();
  if (btnNouvelleSaga) btnNouvelleSaga.onclick = () => ouvrirModalManuel();

  // ------------------------------------------------------------------------
  // Modale Association directe d'un livre existant à une saga
  // ------------------------------------------------------------------------

  function rafraichirGrilleAssocier() {
    if (!associerBooksGrid) return;
    const livres = getLivres();
    const sagas = getSagas();
    const recherche = associerSearchInput ? normaliserChaine(associerSearchInput.value) : "";

    const filtres = livres.filter((l) => {
      if (recherche) {
        const t = normaliserChaine(l.title);
        const a = normaliserChaine(l.authors);
        if (!t.includes(recherche) && !a.includes(recherche)) return false;
      }
      return true;
    });

    associerBooksGrid.innerHTML = "";

    if (filtres.length === 0) {
      associerBooksGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; padding: 24px;">
          Aucun livre correspondant trouvé.
        </div>
      `;
      return;
    }

    filtres.forEach((livre) => {
      const card = document.createElement("div");
      card.classList.add("picker-book-card");

      const coverHtml = livre.cover
        ? `<img src="${escapeHtml(livre.cover)}" alt="${escapeHtml(livre.title)}" class="picker-book-cover" onerror="this.onerror=null; this.src='${PLACEHOLDER_COVER}';">`
        : `<div class="picker-book-cover-placeholder">📖</div>`;

      const estDansCetteSaga = sagaCibleAssocier && livre.sagaId === sagaCibleAssocier.id;
      const autreSaga = livre.sagaId && !estDansCetteSaga ? sagas.find((s) => s.id === livre.sagaId) : null;

      let badgeSaga = "";
      if (estDansCetteSaga) {
        badgeSaga = `<span class="badge-saga-link" style="background:#e0e7ff; color:#3730a3; font-size:0.68rem; padding:2px 6px;">Déjà dans cette saga (T.${livre.sagaTome || 1})</span>`;
      } else if (autreSaga) {
        badgeSaga = `<span class="badge-saga-link" style="font-size:0.68rem; padding:2px 6px;">Autre saga : ${escapeHtml(autreSaga.title)}</span>`;
      }

      card.innerHTML = `
        <div class="picker-book-cover-wrap">
          ${coverHtml}
        </div>
        <h4 class="picker-book-title" title="${escapeHtml(livre.title)}">${escapeHtml(livre.title)}</h4>
        <p class="picker-book-author" title="${escapeHtml(livre.authors)}">${escapeHtml(livre.authors)}</p>
        <div class="picker-book-footer">
          <span class="status-badge ${getBadgeClasse(livre.status)}" style="font-size: 0.68rem; padding: 1px 5px;">${escapeHtml(livre.status)}</span>
          ${badgeSaga}
        </div>
      `;

      card.onclick = () => {
        selectionnerLivrePourAssocier(livre);
      };

      associerBooksGrid.appendChild(card);
    });
  }

  if (associerSearchInput) {
    associerSearchInput.oninput = rafraichirGrilleAssocier;
  }

  function ouvrirModalAssocierLivre(saga) {
    if (!modalAssocier) return;
    sagaCibleAssocier = saga;

    if (associerSagaNom) {
      associerSagaNom.textContent = `Saga cible : ${saga.title} (${saga.author})`;
    }

    if (associerStepGalerie) associerStepGalerie.style.display = "block";
    if (associerStepConfirm) associerStepConfirm.style.display = "none";
    if (associerSearchInput) associerSearchInput.value = "";

    rafraichirGrilleAssocier();
    modalAssocier.style.display = "flex";
    if (associerSearchInput) associerSearchInput.focus();
  }

  function selectionnerLivrePourAssocier(livre) {
    if (!livre || !sagaCibleAssocier) return;

    const info = extraireInfosSagaEtTome(livre.title);
    const livres = getLivres();
    const nbDejaAssocies = livres.filter((l) => l.sagaId === sagaCibleAssocier.id).length;
    const tomePropose = info.tomeDetecte || (livre.sagaTome ? parseInt(livre.sagaTome, 10) : (nbDejaAssocies + 1));

    if (associerConfirmCover) associerConfirmCover.src = livre.cover || PLACEHOLDER_COVER;
    if (associerConfirmTitle) associerConfirmTitle.textContent = livre.title;
    if (associerConfirmAuthor) associerConfirmAuthor.textContent = livre.authors || "Auteur inconnu";
    if (associerInputTome) associerInputTome.value = tomePropose;
    if (associerBookIdHidden) associerBookIdHidden.value = livre.id;

    if (associerStepGalerie) associerStepGalerie.style.display = "none";
    if (associerStepConfirm) associerStepConfirm.style.display = "block";
  }

  if (associerBtnRechoisir) {
    associerBtnRechoisir.onclick = () => {
      if (associerStepConfirm) associerStepConfirm.style.display = "none";
      if (associerStepGalerie) associerStepGalerie.style.display = "block";
    };
  }

  if (associerForm) {
    associerForm.onsubmit = (e) => {
      e.preventDefault();
      if (!sagaCibleAssocier) return;

      const bookId = associerBookIdHidden ? associerBookIdHidden.value : "";
      if (!bookId) {
        afficherNotification("Veuillez sélectionner un livre.");
        return;
      }

      const tomeNum = (associerInputTome && associerInputTome.value ? parseInt(associerInputTome.value, 10) : 1) || 1;
      const livres = getLivres();
      const livre = livres.find((l) => l.id === bookId);
      if (!livre) return;

      livre.sagaId = sagaCibleAssocier.id;
      livre.sagaTome = tomeNum;
      sauvegarderLivres(livres);

      const sagasActuelles = getSagas();
      const targetSaga = sagasActuelles.find((s) => s.id === sagaCibleAssocier.id);
      if (targetSaga) {
        synchroniserStatistiquesSaga(targetSaga, livres);
        sauvegarderSagas(sagasActuelles);
      }

      modalAssocier.style.display = "none";
      const nomSaga = sagaCibleAssocier.title;
      sagaCibleAssocier = null;
      rafraichirSagas();
      afficherNotification(`"${livre.title}" a été associé comme Tome ${tomeNum} de "${nomSaga}" !`, "Livre associé");
    };
  }

  if (associerModalClose) associerModalClose.onclick = () => (modalAssocier.style.display = "none");
  if (associerBtnAnnuler) associerBtnAnnuler.onclick = () => (modalAssocier.style.display = "none");

  // Filtres
  if (selectFiltre) selectFiltre.addEventListener("change", rafraichirSagas);
  if (inputRecherche) inputRecherche.addEventListener("input", rafraichirSagas);

  rafraichirSagas();
}