// Chargement du menu depuis menu.html une fois le DOM prêt
document.addEventListener("DOMContentLoaded", () => {
  // Vérifier si l'élément menu-placeholder existe (seulement sur index.html)
  const menuPlaceholder = document.getElementById("menu-placeholder");
  if (menuPlaceholder) {
    fetch("menu.html")
      .then(response => response.text())
      .then(data => {
        menuPlaceholder.innerHTML = data;
        // Une fois le menu chargé, on lance le reste du script
        initialiserPage();
      })
      .catch(error => {
        console.error("Erreur de chargement du menu :", error);
        // Même en cas d'erreur, initialiser la page
        initialiserPage();
      });
  } else {
    // Si pas de menu-placeholder, initialiser directement
    initialiserPage();
  }
});

let livreTemporaire = null; // Variable globale pour éviter les conflits

function initialiserPage() {
  // Détection de la page actuelle
  const page = window.location.pathname;

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
      e.stopPropagation(); // Empêcher la propagation du clic
      if (confirm("Êtes-vous sûr de vouloir supprimer ce livre ?")) {
        item.remove();
        supprimerLivre(bookData);
      }
    });
    
    container.appendChild(item);
  }

  function ajouterLivre(bookData) {
    const livres = JSON.parse(localStorage.getItem("bibliotheque")) || [];

    const existe = livres.some(
      (l) =>
        l.title.toLowerCase() === bookData.title.toLowerCase() &&
        l.authors.toLowerCase() === bookData.authors.toLowerCase(),
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
      (l) => l.title !== bookData.title || l.authors !== bookData.authors,
    );
    localStorage.setItem("bibliotheque", JSON.stringify(livres));
  }

  function calculerStatsLivres(livres) {
    const parMois = new Array(12).fill(0);
    const parAnnee = {};

    livres
      .filter((livre) => livre.status === "Terminé" && livre.endDate)
      .forEach((livre) => {
        const date = new Date(livre.endDate);
        const mois = date.getMonth();
        const annee = date.getFullYear();

        parMois[mois]++;
        parAnnee[annee] = (parAnnee[annee] || 0) + 1;
      });

    return { parMois, parAnnee };
  }

  // ----------------- Recherche (recherche.html) -----------------
  if (page.includes("recherche.html")) {
    const searchForm = document.getElementById("search-form");
    const popup = document.getElementById("popup");
    const popupSave = document.getElementById("popup-save");
    const popupCancel = document.getElementById("popup-cancel");
    const popupClose = document.getElementById("popup-close");

    if (!searchForm) return;

    searchForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const query = document.getElementById("search-input").value.trim();
      
      if (!query) {
        alert("Veuillez saisir un titre ou un auteur.");
        return;
      }

      const resultDiv = document.getElementById("result");
      resultDiv.innerHTML = "<p>Recherche en cours...</p>";

      fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&langRestrict=fr&maxResults=5`,
      )
        .then((response) => response.json())
        .then((data) => {
          resultDiv.innerHTML = "";
          if (!data.items || data.items.length === 0) {
            resultDiv.innerHTML = "<p>Aucun livre trouvé en français. Essayez un autre titre.</p>";
            return;
          }
          
          data.items.forEach((item) => {
            const book = item.volumeInfo;
            const bookDiv = document.createElement("div");
            bookDiv.classList.add("result-item");
            bookDiv.innerHTML = `
            <div class="image-and-button">
                <img src="${book.imageLinks?.thumbnail || ''}" alt="Couverture" onerror="this.style.display='none'">
                <button class="add-button">Ajouter à la bibliothèque</button>
            </div>
            <div class="book-content">
                <h3>${book.title || "Titre inconnu"}</h3>
                <h4>${book.authors ? book.authors.join(", ") : "Auteur inconnu"}</h4>
                <p>${book.description ? book.description.substring(0, 200) + "..." : "Pas de résumé disponible."}</p>
            </div>
            `;

            resultDiv.appendChild(bookDiv);

            const addButton = bookDiv.querySelector(".add-button");
            addButton.addEventListener("click", () => {
              livreTemporaire = {
                title: book.title || "Titre inconnu",
                authors: book.authors ? book.authors.join(", ") : "Auteur inconnu",
                cover: book.imageLinks?.thumbnail || "",
                description: book.description?.trim() || "Pas de résumé disponible.",
                genre: Array.isArray(book.categories) && book.categories.length > 0
                  ? book.categories[0].trim()
                  : "Inconnu",
              };

              document.getElementById("popup-genre").textContent = livreTemporaire.genre;
              document.getElementById("popup-description").textContent = livreTemporaire.description;

              popup.style.display = "block";
            });
          });
        })
        .catch((error) => {
          console.error("Erreur :", error);
          resultDiv.innerHTML = "<p>Erreur lors de la recherche. Vérifiez votre connexion.</p>";
        });
    });

    if (popupCancel) {
      popupCancel.addEventListener("click", () => {
        popup.style.display = "none";
        livreTemporaire = null;
      });
    }

    if (popupClose) {
      popupClose.addEventListener("click", () => {
        popup.style.display = "none";
        livreTemporaire = null;
      });
    }

    if (popupSave) {
      popupSave.addEventListener("click", () => {
        if (!livreTemporaire) return;

        const status = document.getElementById("popup-status").value;
        const note = document.getElementById("popup-note").value;
        const startDate = document.getElementById("popup-start").value;
        const endDate = document.getElementById("popup-end").value;

        const bookData = {
          ...livreTemporaire,
          status,
          note,
          startDate,
          endDate,
        };

        const ajoutOk = ajouterLivre(bookData);
        if (ajoutOk) {
          popup.style.display = "none";
          livreTemporaire = null;
          alert("Livre ajouté à votre bibliothèque !");
          // Réinitialiser le formulaire
          document.getElementById("popup-status").value = "À lire";
          document.getElementById("popup-note").value = "";
          document.getElementById("popup-start").value = "";
          document.getElementById("popup-end").value = "";
        }
      });
    }
  }

  // ----------------- Accueil (index.html) -----------------
  if (page.includes("index.html") || page === "/" || page === "") {
    const livres = JSON.parse(localStorage.getItem("bibliotheque")) || [];

    // Affiche les derniers livres
    const derniersLivresContainer = document.getElementById("derniers-livres");
    if (derniersLivresContainer) {
      const derniersLivres = livres.slice(-10).reverse();
      derniersLivres.forEach((livre) =>
        afficherLivre(livre, derniersLivresContainer),
      );
    }

    // Graphiques seulement si Chart.js est chargé
    if (typeof Chart !== 'undefined') {
      const { parMois, parAnnee } = calculerStatsLivres(livres);
        console.log("Livres analysés pour les graphes :", livres);
        console.log("Stats par mois :", parMois);
        console.log("Stats par année :", parAnnee);

      // Graphique par mois
      const graphMois = document.getElementById("graph-mois");
      if (graphMois) {
        new Chart(graphMois, {
          type: "bar",
          data: {
            labels: [
              "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
              "Juil", "Août", "Sep", "Oct", "Nov", "Déc",
            ],
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

      // Graphique par année
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

    // Challenge lecture
    const lus = livres.filter((l) => l.status === "Terminé").length;
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
      const livresFiltres = statut === "Tous" ? livres : livres.filter((l) => l.status === statut);
      
      if (livresFiltres.length === 0) {
        container.innerHTML = "<p>Aucun livre trouvé pour ce filtre.</p>";
        return;
      }
      
      livresFiltres.forEach((livre) => afficherLivre(livre, container));
    }

    // Initialisation : tous les livres
    afficherLivresFiltres("Tous");

    // Écoute du filtre
    if (selectFiltre) {
      selectFiltre.addEventListener("change", (e) => {
        afficherLivresFiltres(e.target.value);
      });
    }

    // Gestion du clic pour éditer un livre
    if (container) {
      container.addEventListener("click", (e) => {
        // Ignorer si c'est le bouton supprimer
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
          (l) => l.title === title && l.authors === authors,
        );

        if (!livre) return;

        livreEnCours = livre;

        // Remplir la popup d'édition
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

    // Boutons de la popup d'édition
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
          (l) => l.title === livreEnCours.title && l.authors === livreEnCours.authors,
        );

        if (index !== -1) {
          livres[index] = livreEnCours;
          localStorage.setItem("bibliotheque", JSON.stringify(livres));
        }

        document.getElementById("edit-popup").style.display = "none";
        livreEnCours = null;

        // Recharge la liste avec le filtre actuel
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

        const header = [
          "Titre", "Auteur(s)", "Statut", "Note", "Début", "Fin", "Genre", "Résumé"
        ];
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
            .join(","),
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
        reader.onload = async function (event) {
  try {
    const lignes = event.target.result
      .split("\n")
      .filter((l) => l.trim().length > 0);

    if (lignes.length <= 1) {
      alert("Le fichier CSV semble vide ou invalide.");
      return;
    }

    lignes.shift(); // En-tête
    const livres = JSON.parse(localStorage.getItem("bibliotheque")) || [];
    let nouveauxLivres = 0;

    for (const ligne of lignes) {
      try {
        const values = ligne
          .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
          .map((v) => v.replace(/^"|"$/g, "").replace(/""/g, '"'));

        if (values.length < 8) continue;

        const titre = values[0];
        const auteur = values[1];

        const existe = livres.some(
          (l) =>
            l.title.toLowerCase() === titre.toLowerCase() &&
            l.authors.toLowerCase() === auteur.toLowerCase(),
        );

        if (!existe) {
          const nouveau = {
            title: titre,
            authors: auteur,
            status: values[2] || "À lire",
            note: values[3] || "",
            startDate: values[4] || "",
            endDate: values[5] || "",
            genre: values[6] || "Inconnu",
            description: values[7] || "Pas de résumé disponible.",
            cover: "",
          };

          // Enrichissement API ici
          const donneesEnrichies = await enrichirLivreViaAPI(titre, auteur);
          Object.assign(nouveau, donneesEnrichies);

          livres.push(nouveau);
          nouveauxLivres++;
        }
      } catch (err) {
        console.error("Erreur traitement ligne :", err);
      }
    }

    localStorage.setItem("bibliotheque", JSON.stringify(livres));
    alert(`Import terminé ! ${nouveauxLivres} nouveaux livres ajoutés.`);

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
const enrichirBtn = document.getElementById("enrichir-fiches");
if (enrichirBtn) {
  enrichirBtn.addEventListener("click", async () => {
    const livres = JSON.parse(localStorage.getItem("bibliotheque")) || [];
    let livresModifies = 0;

    for (const livre of livres) {
      if (!livre.cover || livre.cover === "") {
        const enrichi = await enrichirLivreViaAPI(livre.title, livre.authors);
        if (enrichi.cover || enrichi.description !== "Pas de résumé disponible." || enrichi.genre !== "Inconnu") {
          Object.assign(livre, enrichi);
          livresModifies++;
        }
      }
    }

    localStorage.setItem("bibliotheque", JSON.stringify(livres));
    alert(`${livresModifies} livre(s) enrichi(s).`);

    const currentFiltre = selectFiltre ? selectFiltre.value : "Tous";
    afficherLivresFiltres(currentFiltre);
  });
}
  

}

const enrichirBtn = document.getElementById("enrichir-fiches");
const chargementDiv = document.getElementById("chargement-enrichissement");

if (enrichirBtn && chargementDiv) {
  enrichirBtn.addEventListener("click", async () => {
    chargementDiv.style.display = "block"; // Affiche le message de chargement
    enrichirBtn.disabled = true;

    const livres = JSON.parse(localStorage.getItem("bibliotheque")) || [];
    let livresModifies = 0;

    for (const livre of livres) {
      if (!livre.cover || livre.cover === "") {
        const enrichi = await enrichirLivreViaAPI(livre.title, livre.authors);
        if (enrichi.cover || enrichi.description !== "Pas de résumé disponible." || enrichi.genre !== "Inconnu") {
          Object.assign(livre, enrichi);
          livresModifies++;
        }
      }
    }

    localStorage.setItem("bibliotheque", JSON.stringify(livres));

    // Mise à jour UI
    chargementDiv.style.display = "none";
    enrichirBtn.disabled = false;

    alert(`${livresModifies} livre(s) enrichi(s).`);

    const currentFiltre = selectFiltre ? selectFiltre.value : "Tous";
    afficherLivresFiltres(currentFiltre);
  });
}


async function enrichirLivreViaAPI(titre, auteur) {
  try {
    const query = `${titre} ${auteur}`;
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&langRestrict=fr&maxResults=1`
    );
    const data = await response.json();
    const book = data.items?.[0]?.volumeInfo;

    if (!book) return {};

    return {
      cover: book.imageLinks?.thumbnail || "",
      description: book.description?.trim() || "Pas de résumé disponible.",
      genre: Array.isArray(book.categories) && book.categories.length > 0
        ? book.categories[0].trim()
        : "Inconnu",
    };
  } catch (e) {
    console.error("Erreur enrichissement API :", e);
    return {};
  }
}
}