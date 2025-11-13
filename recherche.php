<?php
session_start();
if (!isset($_SESSION['utilisateur_id'])) {
    header("Location: login.php");
    exit;
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Recherche de livres</title>
  <link rel="stylesheet" href="style.css?v=<?php echo filemtime('style.css'); ?>">
</head>
<body>
  <div id="menu-placeholder"></div>

  <main>
    <h1>Rechercher un livre</h1>
    <form id="search-form">
      <input type="text" id="search-input" placeholder="Tape un titre ou un auteur..." required>
      <button type="submit">Rechercher</button>
    </form>
    <div id="result"></div>
  </main>

  <div id="popup-add" class="popup" style="display: none;">
     <div class="popup-content" style="width: 600px; max-width: 90%; padding: 24px; background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
      <span class="close-button" id="popup-add-close" style="position: absolute; top: 12px; right: 12px; font-size: 1.2rem; cursor: pointer;">&times;</span>
      <h2 style="margin-top: 0; font-size: 1.4rem; font-weight: 600;">Ajouter à ma bibliothèque</h2>
      <div class="popup-layout" style="display: flex; gap: 16px; align-items: flex-start; margin-top: 12px;">
        <div class="popup-left" style="flex-shrink: 0;">
          <img id="popup-add-cover-preview" src="" alt="Couverture du livre" style="width: 100px; height: 150px; object-fit: cover; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); display: none;">
        </div>
        <div class="popup-right" style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
          <p id="popup-add-title" style="font-size: 1.1rem; font-weight: 600; margin: 0;">Titre du livre</p>
          <p id="popup-add-authors" style="margin: 0; color: #555;">Auteur(s)</p>
          <p style="margin: 4px 0 0 0; font-size: 0.95rem;">
            <strong>Genre : </strong>
            <span id="popup-add-genre" style="color: #333; font-weight: 500;">Catégorie</span>
          </p>
          <p style="margin: 8px 0 4px 0; font-size: 0.95rem;"><strong>Résumé :</strong></p>
          <div id="popup-add-description" style="background: #fafafa; border: 1px solid #ddd; border-radius: 4px; padding: 8px; max-height: 120px; overflow-y: auto; color: #333; line-height: 1.4; font-size: 0.9rem;">
          </div>
        </div>
      </div>
      <div class="add-fields" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px;">
        <div class="add-field">
          <label for="popup-add-status" style="font-weight: 500; display: block; margin-bottom: 4px;">Statut :</label>
          <select id="popup-add-status" style="width: 100%; padding: 6px 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.9rem;">
            <option>À lire</option>
            <option>En cours</option>
            <option>Terminé</option>
            <option>DNF</option>
          </select>
        </div>
        <div class="add-field">
          <label for="popup-add-note" style="font-weight: 500; display: block; margin-bottom: 4px;">Note (1–5) :</label>
          <input type="number" id="popup-add-note" min="1" max="5" step="1" style="width: 100%; padding: 6px 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.9rem;">
        </div>
      </div>
      <div class="add-fields" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 12px;">
        <div class="add-field">
          <label for="popup-add-start" style="font-weight: 500; display: block; margin-bottom: 4px;">Début :</label>
          <input type="date" id="popup-add-start" style="width: 100%; padding: 6px 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.9rem;">
        </div>
        <div class="add-field">
          <label for="popup-add-end" style="font-weight: 500; display: block; margin-bottom: 4px;">Fin :</label>
          <input type="date" id="popup-add-end" style="width: 100%; padding: 6px 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.9rem;">
        </div>
      </div>
      <div class="add-buttons" style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px;">
        <button id="popup-add-save" style="padding: 8px 16px; background: #10b981; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
          Valider
        </button>
        <button id="popup-add-cancel" style="padding: 8px 16px; background: #ddd; color: #333; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
          Annuler
        </button>
      </div>
    </div>
  </div>


  <script src="script.js?v=<?php echo filemtime('script.js'); ?>" defer></script>
</body>
</html>