document.addEventListener("DOMContentLoaded", () => {
  const menuPlaceholder = document.getElementById("menu-placeholder");
  if (menuPlaceholder) {
    menuPlaceholder.innerHTML = `
      <nav>
        <a href="index.html">Accueil</a>
        <a href="bibliotheque.html">Ma Bibliothèque</a>
        <a href="pal.html">PAL</a>
        <a href="recherche.html">Recherche</a>
      </nav>
    `;
  }
  creerPopupsNotification();
  initialiserPage();
});

let livreTemporaire = null;

function creerPopupsNotification() {
  if (document.getElementById("custom-alert-popup")) return;

  const div = document.createElement("div");
  div.innerHTML = `
    <div id="custom-alert-popup" class="popup" style="display: none;">
      <div class="popup-content" style="max-width: 380px; height: auto; text-align: center; padding: 25px;">
        <h3 id="custom-alert-title" style="margin-top: 0; color: #444;">Information</h3>
        <p id="custom-alert-message" style="font-size: 0.95rem; color: #555; margin: 15px 0 20px 0; line-height: 1.4;"></p>
        <button id="custom-alert-ok" style="min-width: 100px;">OK</button>
      </div>
    </div>

    <div id="custom-confirm-popup" class="popup" style="display: none;">
      <div class="popup-content" style="max-width: 380px; height: auto; text-align: center; padding: 25px;">
        <h3 style="margin-top: 0; color: #444;">Confirmation</h3>
        <p id="custom-confirm-message" style="font-size: 0.95rem; color: #555; margin: 15px 0 20px 0; line-height: 1.4;"></p>
        <div style="display: flex; justify-content: center; gap: 10px;">
          <button id="custom-confirm-yes" style="min-width: 90px;">Confirmer</button>
          <button id="custom-confirm-no" style="min-width: 90px; background-color: #eee; color: #444;">Annuler</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(div);

  // Redirige tous les appels alert() existants vers la pop-up personnalisée
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

function demanderConfirmation(message, callback) {
  const popup = document.getElementById("custom-confirm-popup");
  const msgEl = document.getElementById("custom-confirm-message");
  const yesBtn = document.getElementById("custom-confirm-yes");
  const noBtn = document.getElementById("custom-confirm-no");
  if (!popup) return;

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

function initialiserPage() {
  const page = window.location.pathname.toLowerCase();

  function afficherLivre(bookData, container) {
    const item = document.createElement("div");
    item.classList.add("grid-item");
    item.innerHTML = `
      <img src="${bookData.cover || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgODAgMTAwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iODAiIGhlaWdodD0iMTAwIiBmaWxsPSIjZjBmMGYwIi8+CjxwYXRoIGQ9Ik0yNSAzMEg1NVYzNEgyNVYzMFpNMjUgNDBINTVWNDRIMjVWNDBaTTI1IDUwSDU1VjU0SDI1VjUwWiIgZmlsbD0iI2NjYyIvPgo8L3N2Zz4K'}" alt="Couverture">
      <div class="book-info">
        <p><strong>${bookData.title}</strong></p>
        <p>${bookData.authors}</p>
        <p><em>Statut : ${bookData.status}</em></p>
        <p><em>Note : ${bookData.note ? bookData.note + "/5" : "Pas noté"}</em></p>
        ${bookData.startDate ? `<p><em>Début : ${bookData.startDate}</em></p>` : ""}
        ${bookData.endDate ? `<p><em>Fin : ${bookData.endDate}</em></p>` : ""}
        <button class="delete-button">🗑 Supprimer</button>
      </div>
    `;

    item.querySelector(".delete-button").addEventListener("click", function (e) {
      e.stopPropagation();
      demanderConfirmation("Êtes-vous sûr de vouloir supprimer ce livre ?", () => {
        item.remove();
        supprimerLivre(bookData);
      });
    });

    container.appendChild(item);
  }

  function ajouterLivre(bookData) {
    const livres = JSON.parse(localStorage.getItem("bibliotheque")) || [];
    const existe = livres.some(
      (l) =>
        l.title.toLowerCase() === bookData.title.toLowerCase() &&
        l.authors.toLowerCase() === bookData.authors.toLowerCase()
    );
    if (existe) {
      alert("Ce livre est déjà présent dans votre bibliothèque.");
      return false;
    }
    livres.push(bookData);
    localStorage.setItem("bibliotheque", JSON.stringify(livres));
    return true;
  }

  function supprimerLivre(bookData) {
    let livres = JSON.parse(localStorage.getItem("bibliotheque")) || [];
    livres = livres.filter(
      (l) => l.title !== bookData.title || l.authors !== bookData.authors
    );
    localStorage.setItem("bibliotheque", JSON.stringify(livres));
  }

  function calculerStatsLivres(livres) {
    const parMois = new Array(12).fill(0);
    const parAnnee = {};
    livres
      .filter((livre) => (livre.status || "").toLowerCase().includes("termin") && livre.endDate)
      .forEach((livre) => {
        const date = new Date(livre.endDate);
        const mois = date.getMonth();
        const annee = date.getFullYear();
        if (!isNaN(mois)) parMois[mois]++;
        if (!isNaN(annee)) parAnnee[annee] = (parAnnee[annee] || 0) + 1;
      });
    return { parMois, parAnnee };
  }

  // ----------------- Recherche (recherche.html) -----------------
  if (page.includes("recherche.html")) {
    const searchForm = document.getElementById("search-form");
    const searchInput = document.getElementById("search-input");
    const resultDiv = document.getElementById("result");

    // Éléments Pop-up Infos
    const infoPopup = document.getElementById("info-popup");
    const infoClose = document.getElementById("info-close");
    const infoTitle = document.getElementById("info-title");
    const infoAuthors = document.getElementById("info-authors");
    const infoGenre = document.getElementById("info-genre");
    const infoDate = document.getElementById("info-date");
    const infoDescription = document.getElementById("info-description");
    const infoAddBtn = document.getElementById("info-add-btn");

    // Éléments Pop-up Ajout
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

    function ajusterChampsStatut() {
      const s = addStatus.value;
      if (s === "À lire") {
        fieldStart.style.display = "none";
        fieldEnd.style.display = "none";
        fieldNote.style.display = "none";
      } else if (s === "En cours") {
        fieldStart.style.display = "block";
        fieldEnd.style.display = "none";
        fieldNote.style.display = "none";
        if (!addStart.value) addStart.value = new Date().toISOString().split("T")[0];
      } else if (s === "Terminé") {
        fieldStart.style.display = "block";
        fieldEnd.style.display = "block";
        fieldNote.style.display = "block";
        if (!addEnd.value) addEnd.value = new Date().toISOString().split("T")[0];
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
      livreTemporaire = { ...book };
      addBookTitle.textContent = `${book.title} - ${book.authors}`;
      addStatus.value = "À lire";
      addStart.value = "";
      addEnd.value = "";
      addNote.value = "";
      ajusterChampsStatut();
      if (infoPopup) infoPopup.style.display = "none";
      addPopup.style.display = "flex";
    }

    function ouvrirPopupInfos(book) {
      livreTemporaire = { ...book };
      infoTitle.textContent = book.title;
      infoAuthors.textContent = book.authors;
      infoGenre.textContent = book.genre;
      infoDate.textContent = book.publishedDate || "Non renseignée";
      infoDescription.textContent = book.description;
      infoPopup.style.display = "flex";
    }

    if (infoClose) infoClose.onclick = () => infoPopup.style.display = "none";
    if (addClose) addClose.onclick = () => addPopup.style.display = "none";
    if (addCancel) addCancel.onclick = () => addPopup.style.display = "none";

    if (infoAddBtn) {
      infoAddBtn.onclick = () => {
        if (livreTemporaire) ouvrirPopupAjout(livreTemporaire);
      };
    }

    if (addSave) {
      addSave.onclick = () => {
        if (!livreTemporaire) return;
        const bookData = {
          ...livreTemporaire,
          status: addStatus.value,
          note: addNote.value,
          startDate: addStart.value,
          endDate: addEnd.value,
        };
        const ajoutOk = ajouterLivre(bookData);
        if (ajoutOk) {
          addPopup.style.display = "none";
          livreTemporaire = null;
          afficherNotification("Livre ajouté à votre bibliothèque !");
        }
      };
    }

    function filtrerEtFormater(items) {
      if (!items || items.length === 0) return [];
      const motsArchives = [
        "journal des débats", "revue des", "bulletin de", "gazette",
        "annales", "compte rendu", "procès-verbal", "assemblée nationale"
      ];
      const vu = new Set();

      return items
        .map((item) => {
          const b = item.volumeInfo || {};
          const titreComplet = b.subtitle ? `${b.title} : ${b.subtitle}` : (b.title || "Titre inconnu");
          const aIsbn = b.industryIdentifiers && b.industryIdentifiers.some((id) => id.type.includes("ISBN"));
          const annee = parseInt(b.publishedDate?.substring(0, 4), 10) || 0;
          const aAuteur = Array.isArray(b.authors) && b.authors.length > 0;
          const auteurNom = aAuteur ? b.authors.join(", ") : "Auteur inconnu";

          return {
            id: item.id,
            title: titreComplet,
            authors: auteurNom,
            cover: b.imageLinks?.thumbnail ? b.imageLinks.thumbnail.replace("http://", "https://") : "",
            description: b.description ? b.description.trim() : "Pas de résumé disponible.",
            genre: Array.isArray(b.categories) && b.categories.length > 0 ? b.categories[0].trim() : "Inconnu",
            publishedDate: b.publishedDate || "",
            annee,
            aIsbn,
            aAuteur,
          };
        })
        .filter((b) => {
          const cleUnique = `${b.title.toLowerCase().trim()}|${b.authors.toLowerCase().trim()}`;
          if (vu.has(cleUnique)) return false;
          vu.add(cleUnique);

          const t = b.title.toLowerCase();
          if (motsArchives.some((m) => t.includes(m))) return false;
          if (b.annee > 0 && b.annee < 1970 && !b.aIsbn) return false;
          if (b.authors === "Auteur inconnu" && !b.cover) return false;
          return true;
        });
    }

    if (searchForm) {
      searchForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        const query = searchInput ? searchInput.value.trim() : "";

        if (!query) {
          afficherNotification("Veuillez saisir un titre ou un auteur.");
          return;
        }

        resultDiv.innerHTML = "<p>Recherche en cours...</p>";
        let livresTrouves = [];

        try {
          const keyParam = typeof GOOGLE_API_KEY !== "undefined" ? `&key=${GOOGLE_API_KEY}` : "";
          const urlExacte = `https://www.googleapis.com/books/v1/volumes?q="${encodeURIComponent(query)}"&printType=books&langRestrict=fr&maxResults=40${keyParam}`;
          const urlLarge = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&printType=books&langRestrict=fr&maxResults=40${keyParam}`;

          const [resExacte, resLarge] = await Promise.allSettled([
            fetch(urlExacte),
            fetch(urlLarge)
          ]);

          let tousLesItems = [];
          const idsVus = new Set();

          const extraireItems = async (resultat) => {
            if (resultat.status === "fulfilled" && resultat.value.ok) {
              const data = await resultat.value.json();
              if (data.items) {
                for (const item of data.items) {
                  if (!idsVus.has(item.id)) {
                    idsVus.add(item.id);
                    tousLesItems.push(item);
                  }
                }
              }
            }
          };

          await extraireItems(resExacte);
          await extraireItems(resLarge);

          livresTrouves = filtrerEtFormater(tousLesItems);
        } catch (err) {
          console.warn("Google Books inaccessible");
        }

        if (livresTrouves.length === 0) {
          try {
            const resOL = await fetch(
              `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20`
            );
            if (resOL.ok) {
              const dataOL = await resOL.json();
              if (dataOL.docs && dataOL.docs.length > 0) {
                livresTrouves = dataOL.docs
                  .filter((b) => b.author_name && b.author_name.length > 0)
                  .map((b) => ({
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

        resultDiv.innerHTML = "";

        if (livresTrouves.length === 0) {
          resultDiv.innerHTML = "<p>Aucun livre trouvé. Essayez avec un autre titre.</p>";
          return;
        }

        const motsCles = query.toLowerCase().split(/\s+/).filter((m) => m.length > 1);
        livresTrouves.sort((a, b) => {
          const titreA = a.title.toLowerCase();
          const titreB = b.title.toLowerCase();

          const scoreA = motsCles.filter((m) => titreA.includes(m)).length;
          const scoreB = motsCles.filter((m) => titreB.includes(m)).length;

          if (scoreB !== scoreA) {
            return scoreB - scoreA;
          }

          return b.annee - a.annee;
        });

        livresTrouves.forEach((book) => {
          const bookDiv = document.createElement("div");
          bookDiv.classList.add("result-item");
          const anneeAffichage = book.publishedDate ? ` (${book.publishedDate.substring(0, 4)})` : "";
          bookDiv.innerHTML = `
            <div class="image-and-button">
              <img src="${book.cover || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgODAgMTAwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iODAiIGhlaWdodD0iMTAwIiBmaWxsPSIjZjBmMGYwIi8+Cjwvc3ZnPg=='}" alt="Couverture">
              <button class="add-button">Ajouter à la bibliothèque</button>
            </div>
            <div class="book-content">
              <h3>${book.title}${anneeAffichage}</h3>
              <h4>${book.authors}</h4>
              <p>${book.description.substring(0, 200) + (book.description.length > 200 ? "..." : "")}</p>
            </div>
          `;

          // Clic sur toute la carte pour afficher les infos complètes
          bookDiv.addEventListener("click", (e) => {
            if (e.target.classList.contains("add-button")) return;
            ouvrirPopupInfos(book);
          });

          // Clic sur le bouton pour ouvrir la pop-up de statut directement
          const btnAjout = bookDiv.querySelector(".add-button");
          btnAjout.addEventListener("click", (e) => {
            e.stopPropagation();
            ouvrirPopupAjout(book);
          });

          resultDiv.appendChild(bookDiv);
        });
      });
    }
  }

  // ----------------- Accueil (index.html) -----------------
  if (page.includes("index.html") || page.endsWith("/") || page === "") {
    const livres = JSON.parse(localStorage.getItem("bibliotheque")) || [];

    const derniersLivresContainer = document.getElementById("derniers-livres");
    if (derniersLivresContainer) {
      const derniersLivres = livres.slice(-10).reverse();
      derniersLivres.forEach((livre) =>
        afficherLivre(livre, derniersLivresContainer)
      );
    }

    if (typeof Chart !== "undefined") {
      const { parMois, parAnnee } = calculerStatsLivres(livres);

      const graphMois = document.getElementById("graph-mois");
      if (graphMois) {
        new Chart(graphMois, {
          type: "bar",
          data: {
            labels: ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"],
            datasets: [
              {
                label: "Livres lus",
                data: parMois,
                backgroundColor: "#c9a0ff",
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } },
          },
        });
      }

      const annees = Object.keys(parAnnee).sort();
      const counts = annees.map((y) => parAnnee[y]);
      const graphAnnee = document.getElementById("graph-annee");
      if (graphAnnee && annees.length > 0) {
        new Chart(graphAnnee, {
          type: "bar",
          data: {
            labels: annees,
            datasets: [
              {
                label: "Livres lus",
                data: counts,
                backgroundColor: "#b48eff",
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } },
          },
        });
      }
    }

    const lus = livres.filter((l) => (l.status || "").toLowerCase().includes("termin")).length;
    const progressionElement = document.getElementById("progression-challenge");
    if (progressionElement) {
      progressionElement.textContent = lus;
    }
  }

  // ----------------- Bibliothèque (bibliotheque.html) -----------------
  if (page.includes("bibliotheque.html")) {
    const container = document.getElementById("library");
    const selectFiltre = document.getElementById("filtre-statut");
    let livreEnCours = null;

    function afficherLivresFiltres(statut) {
      if (!container) return;
      container.innerHTML = "";
      const livres = JSON.parse(localStorage.getItem("bibliotheque")) || [];
      const livresFiltres = statut === "Tous"
        ? livres
        : livres.filter((l) => (l.status || "").toLowerCase().trim() === statut.toLowerCase().trim());

      if (livresFiltres.length === 0) {
        container.innerHTML = "<p>Aucun livre trouvé pour ce filtre.</p>";
        return;
      }

      livresFiltres.forEach((livre) => afficherLivre(livre, container));
    }

    afficherLivresFiltres("Tous");

    if (selectFiltre) {
      selectFiltre.addEventListener("change", (e) => {
        afficherLivresFiltres(e.target.value);
      });
    }

    if (container) {
      container.addEventListener("click", (e) => {
        if (e.target.classList.contains("delete-button")) return;

        const item = e.target.closest(".grid-item");
        if (!item) return;
        const titleElement = item.querySelector("strong");
        const authorsElement = item.querySelector("p:nth-child(2)");

        if (!titleElement || !authorsElement) return;
        const title = titleElement.textContent;
        const authors = authorsElement.textContent;
        const livres = JSON.parse(localStorage.getItem("bibliotheque")) || [];
        const livre = livres.find(
          (l) => l.title === title && l.authors === authors
        );
        if (!livre) return;
        livreEnCours = livre;

        document.getElementById("edit-title").textContent = livre.title;
        document.getElementById("edit-authors").textContent = livre.authors;
        document.getElementById("edit-status").value = livre.status;
        document.getElementById("edit-note").value = livre.note || "";
        document.getElementById("edit-genre-text").textContent = livre.genre || "Inconnu";
        document.getElementById("edit-desc-text").textContent = livre.description || "Pas de résumé disponible.";
        document.getElementById("edit-start").value = livre.startDate || "";
        document.getElementById("edit-end").value = livre.endDate || "";
        document.getElementById("edit-popup").style.display = "flex";
      });
    }

    const editCancel = document.getElementById("edit-cancel");
    const editClose = document.getElementById("edit-close");
    const editSave = document.getElementById("edit-save");

    if (editCancel) {
      editCancel.addEventListener("click", () => {
        document.getElementById("edit-popup").style.display = "none";
        livreEnCours = null;
      });
    }

    if (editClose) {
      editClose.addEventListener("click", () => {
        document.getElementById("edit-popup").style.display = "none";
        livreEnCours = null;
      });
    }

    if (editSave) {
      editSave.addEventListener("click", () => {
        if (!livreEnCours) return;
        livreEnCours.status = document.getElementById("edit-status").value;
        livreEnCours.note = document.getElementById("edit-note").value;
        livreEnCours.startDate = document.getElementById("edit-start").value;
        livreEnCours.endDate = document.getElementById("edit-end").value;

        const livres = JSON.parse(localStorage.getItem("bibliotheque")) || [];
        const index = livres.findIndex(
          (l) => l.title === livreEnCours.title && l.authors === livreEnCours.authors
        );
        if (index !== -1) {
          livres[index] = livreEnCours;
          localStorage.setItem("bibliotheque", JSON.stringify(livres));
        }
        document.getElementById("edit-popup").style.display = "none";
        livreEnCours = null;
        const currentFiltre = selectFiltre ? selectFiltre.value : "Tous";
        afficherLivresFiltres(currentFiltre);
      });
    }

    // EXPORT CSV
    const exportBtn = document.getElementById("export-csv");
    if (exportBtn) {
      exportBtn.addEventListener("click", () => {
        const livres = JSON.parse(localStorage.getItem("bibliotheque")) || [];
        if (livres.length === 0) {
          alert("Aucun livre à exporter.");
          return;
        }
        const header = ["Titre", "Auteur(s)", "Statut", "Note", "Début", "Fin", "Genre", "Résumé"];
        const lignes = livres.map((l) =>
          [
            l.title,
            l.authors,
            l.status,
            l.note || "",
            l.startDate || "",
            l.endDate || "",
            l.genre || "",
            (l.description || "").replace(/\n/g, " ").replace(/"/g, '""'),
          ]
            .map((val) => `"${val}"`)
            .join(",")
        );
        const csvContent = [header.join(","), ...lignes].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "ma_bibliotheque.csv");
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      });
    }

    // IMPORT CSV
    const importBtn = document.getElementById("import-csv");
    if (importBtn) {
      importBtn.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (event) {
          try {
            const lignes = event.target.result
              .split("\n")
              .filter((l) => l.trim().length > 0);

            if (lignes.length <= 1) {
              alert("Le fichier CSV semble vide ou invalide.");
              return;
            }

            const headerLine = lignes.shift();
            const isGoodreads = headerLine.includes("Book Id") || headerLine.includes("Exclusive Shelf");
            const livres = JSON.parse(localStorage.getItem("bibliotheque")) || [];
            let nouveauxLivres = 0;
            let livresMisAJour = 0;

            for (const ligne of lignes) {
              try {
                const values = ligne
                  .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
                  .map((v) => v.replace(/^"|"$/g, "").replace(/""/g, '"'));

                let titre = "";
                let auteur = "";
                let statut = "À lire";
                let note = "";
                let dateDebut = "";
                let dateFin = "";

                if (isGoodreads) {
                  if (values.length < 18) continue;
                  titre = values[1]?.trim();
                  auteur = values[2]?.trim();

                  const noteVal = parseFloat(values[7]);
                  note = noteVal > 0 ? Math.round(noteVal).toString() : "";

                  const shelf = values[17]?.trim().toLowerCase();
                  if (shelf === "read") {
                    statut = "Terminé";
                  } else if (shelf === "currently-reading") {
                    statut = "En cours";
                  } else if (shelf === "did-not-finish" || shelf === "dnf") {
                    statut = "Abandonné";
                  } else {
                    statut = "À lire";
                  }

                  if (values[13]) {
                    dateFin = values[13].replace(/\//g, "-").trim();
                  }
                  if (values[14] && statut === "En cours") {
                    dateDebut = values[14].replace(/\//g, "-").trim();
                  }
                } else {
                  if (values.length < 8) continue;
                  titre = values[0]?.trim();
                  auteur = values[1]?.trim();
                  statut = values[2]?.trim() || "À lire";
                  note = values[3]?.trim() || "";
                  dateDebut = values[4]?.trim() || "";
                  dateFin = values[5]?.trim() || "";
                }

                if (!titre || !auteur) continue;

                const livreExistant = livres.find(
                  (l) =>
                    l.title.toLowerCase() === titre.toLowerCase() &&
                    l.authors.toLowerCase() === auteur.toLowerCase()
                );

                if (livreExistant) {
                  livreExistant.status = statut;
                  if (note) livreExistant.note = note;
                  if (dateFin) livreExistant.endDate = dateFin;
                  if (dateDebut) livreExistant.startDate = dateDebut;
                  livresMisAJour++;
                } else {
                  livres.push({
                    title: titre,
                    authors: auteur,
                    status: statut,
                    note: note,
                    startDate: dateDebut,
                    endDate: dateFin,
                    genre: "Inconnu",
                    description: "Pas de résumé disponible.",
                    cover: "",
                  });
                  nouveauxLivres++;
                }
              } catch (err) {
                console.error("Erreur traitement ligne :", err);
              }
            }

            localStorage.setItem("bibliotheque", JSON.stringify(livres));
            alert(`Import réussi : ${nouveauxLivres} nouveaux livres ajoutés, ${livresMisAJour} livres mis à jour.`);
            const currentFiltre = selectFiltre ? selectFiltre.value : "Tous";
            afficherLivresFiltres(currentFiltre);
          } catch (err) {
            console.error("Erreur import CSV :", err);
            alert("Erreur lors de l'import du fichier CSV.");
          }
        };
        reader.readAsText(file);
      });
    }

    // ENRICHISSEMENT
    const enrichirBtn = document.getElementById("enrichir-fiches");
    const chargementDiv = document.getElementById("chargement-enrichissement");

    if (enrichirBtn && chargementDiv) {
      enrichirBtn.addEventListener("click", async () => {
        const livres = JSON.parse(localStorage.getItem("bibliotheque")) || [];
        const aTraiter = livres.filter((l) => !l.cover || l.cover === "");

        if (aTraiter.length === 0) {
          alert("Tous vos livres ont déjà une couverture.");
          return;
        }

        chargementDiv.style.display = "block";
        enrichirBtn.disabled = true;
        let enrichis = 0;

        for (let i = 0; i < aTraiter.length; i++) {
          const livre = aTraiter[i];
          chargementDiv.innerHTML = `<p>Enrichissement : ${i + 1} / ${aTraiter.length} (${livre.title})</p>`;

          const donnees = await enrichirLivreViaAPI(livre.title, livre.authors);

          if (donnees === "LIMIT") {
            alert("Quota Google temporairement atteint. Progression sauvegardée, réessayez dans quelques minutes.");
            break;
          }

          if (donnees && (donnees.cover || donnees.description !== "Pas de résumé disponible." || donnees.genre !== "Inconnu")) {
            Object.assign(livre, donnees);
            enrichis++;
            localStorage.setItem("bibliotheque", JSON.stringify(livres));
          }

          await new Promise((resolve) => setTimeout(resolve, 800));
        }

        chargementDiv.style.display = "none";
        enrichirBtn.disabled = false;
        alert(`${enrichis} livre(s) enrichi(s).`);

        const currentFiltre = selectFiltre ? selectFiltre.value : "Tous";
        afficherLivresFiltres(currentFiltre);
      });
    }

    async function enrichirLivreViaAPI(titre, auteur) {
  // 1. Tentative principale : Google Books
  let resultat = await chercherGoogleBooks(titre, auteur);

  // 2. Repli : Open Library si Google bloque (429), échoue ou n'a pas de couverture
  if (!resultat || resultat === "LIMIT" || !resultat.cover) {
    const resultatOL = await chercherOpenLibrary(titre, auteur);
    if (resultatOL && resultatOL.cover) {
      return resultatOL;
    }
  }

  return resultat === "LIMIT" ? null : resultat;
}

async function chercherGoogleBooks(titre, auteur) {
  try {
    const query = `${titre} ${auteur}`;
    const keyParam = typeof GOOGLE_API_KEY !== "undefined" ? `&key=${GOOGLE_API_KEY}` : "";
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&langRestrict=fr&maxResults=1${keyParam}`
        );

    if (response.status === 429) return "LIMIT";
    if (!response.ok) return null;

    const data = await response.json();
    const book = data.items?.[0]?.volumeInfo;
    if (!book) return null;

    return {
      cover: book.imageLinks?.thumbnail ? book.imageLinks.thumbnail.replace("http://", "https://") : "",
      description: book.description?.trim() || "Pas de résumé disponible.",
      genre: Array.isArray(book.categories) && book.categories.length > 0
        ? book.categories[0].trim()
        : "Inconnu",
    };
  } catch (e) {
    return null;
  }
}

async function chercherOpenLibrary(titre, auteur) {
  try {
    const query = `${titre} ${auteur}`;
    const response = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=1`
    );

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

  }

  // ----------------- Page PAL (pal.html) -----------------
  if (page.includes("pal.html")) {
    const palContainer = document.getElementById("pal-library");
    const countElement = document.getElementById("pal-count");
    const canvas = document.getElementById("wheel-canvas");
    const ctx = canvas ? canvas.getContext("2d") : null;
    const spinBtn = document.getElementById("spin-btn");
    const modal = document.getElementById("confirm-pal-modal");
    const modalTitre = document.getElementById("modal-livre-titre");
    const btnValider = document.getElementById("btn-valider-lecture");
    const btnAnnuler = document.getElementById("btn-annuler-lecture");

    const editPopup = document.getElementById("edit-popup");
    const editCancel = document.getElementById("edit-cancel");
    const editClose = document.getElementById("edit-close");
    const editSave = document.getElementById("edit-save");

    let livresPal = [];
    let livreSelectionne = null;
    let livreEnCours = null;
    let currentAngle = 0;
    let isSpinning = false;

    const couleurs = ["#ffd1dc", "#e0bbff", "#c9a0ff", "#b48eff", "#d8b4f8", "#ffcbf2"];

    function getLivresPal() {
      const livres = JSON.parse(localStorage.getItem("bibliotheque")) || [];
      return livres.filter((l) => {
        const s = (l.status || "").toLowerCase().trim();
        return (s.includes("lire") || s === "to-read") &&
          !s.includes("termin") &&
          !s.includes("cours") &&
          !s.includes("abandon") &&
          !s.includes("dnf");
      });
    }

    function rafraichirAffichage() {
      livresPal = getLivresPal();
      if (countElement) countElement.textContent = livresPal.length;

      if (palContainer) {
        palContainer.innerHTML = "";
        if (livresPal.length === 0) {
          palContainer.innerHTML = "<p>Aucun livre dans votre PAL actuellement.</p>";
        } else {
          livresPal.forEach((livre) => afficherLivre(livre, palContainer));
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
        ctx.fillStyle = "#eee";
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#888";
        ctx.font = "14px Segoe UI";
        ctx.textAlign = "center";
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
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.save();
        ctx.translate(centreX, centreY);
        ctx.rotate(start + arc / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "#333";
        ctx.font = "bold 11px Segoe UI";

        let titre = livresPal[i].title;
        if (titre.length > 15) titre = titre.substring(0, 13) + "...";
        ctx.fillText(titre, rayon - 12, 4);
        ctx.restore();
      }
    }

    if (spinBtn) {
      spinBtn.addEventListener("click", () => {
        if (isSpinning || livresPal.length === 0) return;

        isSpinning = true;
        spinBtn.disabled = true;

        const toursComplets = (Math.floor(Math.random() * 4) + 4) * 2 * Math.PI;
        const angleAleatoire = Math.random() * 2 * Math.PI;
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

            const arc = (2 * Math.PI) / livresPal.length;
            const angleNormalise = (2 * Math.PI - (currentAngle % (2 * Math.PI))) % (2 * Math.PI);
            const flecheAngle = (angleNormalise + 3 * Math.PI / 2) % (2 * Math.PI);
            const indexGagnant = Math.floor(flecheAngle / arc) % livresPal.length;

            livreSelectionne = livresPal[indexGagnant];
            modalTitre.textContent = `${livreSelectionne.title} - ${livreSelectionne.authors}`;
            modal.style.display = "flex";
          }
        }
        requestAnimationFrame(animer);
      });
    }

    if (btnAnnuler) {
      btnAnnuler.addEventListener("click", () => {
        modal.style.display = "none";
        livreSelectionne = null;
      });
    }

    if (btnValider) {
      btnValider.addEventListener("click", () => {
        if (!livreSelectionne) return;

        const dateAujourdhui = new Date().toISOString().split("T")[0];
        const tousLesLivres = JSON.parse(localStorage.getItem("bibliotheque")) || [];

        const index = tousLesLivres.findIndex(
          (l) => l.title === livreSelectionne.title && l.authors === livreSelectionne.authors
        );

        if (index !== -1) {
          tousLesLivres[index].status = "En cours";
          tousLesLivres[index].startDate = dateAujourdhui;
          localStorage.setItem("bibliotheque", JSON.stringify(tousLesLivres));
        }

        modal.style.display = "none";
        livreSelectionne = null;
        rafraichirAffichage();
      });
    }

    // Modification des livres depuis la PAL
    if (palContainer && editPopup) {
      palContainer.addEventListener("click", (e) => {
        if (e.target.classList.contains("delete-button")) return;

        const item = e.target.closest(".grid-item");
        if (!item) return;
        const titleElement = item.querySelector("strong");
        const authorsElement = item.querySelector("p:nth-child(2)");

        if (!titleElement || !authorsElement) return;
        const title = titleElement.textContent;
        const authors = authorsElement.textContent;
        const livres = JSON.parse(localStorage.getItem("bibliotheque")) || [];
        const livre = livres.find(
          (l) => l.title === title && l.authors === authors
        );
        if (!livre) return;
        livreEnCours = livre;

        document.getElementById("edit-title").textContent = livre.title;
        document.getElementById("edit-authors").textContent = livre.authors;
        document.getElementById("edit-status").value = livre.status;
        document.getElementById("edit-note").value = livre.note || "";
        document.getElementById("edit-genre-text").textContent = livre.genre || "Inconnu";
        document.getElementById("edit-desc-text").textContent = livre.description || "Pas de résumé disponible.";
        document.getElementById("edit-start").value = livre.startDate || "";
        document.getElementById("edit-end").value = livre.endDate || "";
        editPopup.style.display = "flex";
      });
    }

    if (editCancel) {
      editCancel.addEventListener("click", () => {
        editPopup.style.display = "none";
        livreEnCours = null;
      });
    }

    if (editClose) {
      editClose.addEventListener("click", () => {
        editPopup.style.display = "none";
        livreEnCours = null;
      });
    }

    if (editSave) {
      editSave.addEventListener("click", () => {
        if (!livreEnCours) return;
        livreEnCours.status = document.getElementById("edit-status").value;
        livreEnCours.note = document.getElementById("edit-note").value;
        livreEnCours.startDate = document.getElementById("edit-start").value;
        livreEnCours.endDate = document.getElementById("edit-end").value;

        const livres = JSON.parse(localStorage.getItem("bibliotheque")) || [];
        const index = livres.findIndex(
          (l) => l.title === livreEnCours.title && l.authors === livreEnCours.authors
        );
        if (index !== -1) {
          livres[index] = livreEnCours;
          localStorage.setItem("bibliotheque", JSON.stringify(livres));
        }
        editPopup.style.display = "none";
        livreEnCours = null;
        rafraichirAffichage();
      });
    }

    rafraichirAffichage();
  }
}