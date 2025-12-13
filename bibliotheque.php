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
  <title>Ma Bibliothèque</title>
  <link rel="stylesheet" href="style.css?v=<?php echo filemtime('style.css'); ?>">
</head>
<body>
  <div id="menu-placeholder"></div>

  <main>
    <h1>Ma Bibliothèque</h1>

    <div id="filtre-tri-container">
      <div id="filtre-container">
        <label for="filtre-statut">Filter par statut :</label>
        <select id="filtre-statut">
          <option value="Tous">Tous</option>
          <option value="À lire">À lire</option>
          <option value="En cours">En cours</option>
          <option value="Terminé">Terminé</option>
        </select>
      </div>
      <div id="tri-container">
        <label for="tri-critere">Trier par :</label>
        <select id="tri-critere">
          <option value="titre">Titre</option>
          <option value="auteur">Auteur</option>
          <option value="note">Note</option>
          <option value="genre">Genre</option>
          <option value="date-croissant">Date (croissant)</option>
          <option value="date-decroissant">Date (décroissant)</option>
        </select>
      </div>
    </div>

    <div id="bibli-actions">
      <input type="file" id="import-csv" accept=".csv" style="display: none;">
      <button id="import-trigger">Importer CSV</button>
      <button id="export-csv">Exporter CSV</button>
      <button id="enrichir-fiches">Compléter les fiches</button>
    </div>

    <div id="library"></div>
  </main>

  <div id="popup-edit" class="popup" style="display: none;">
    <div class="popup-content" style="max-width: 600px; margin: auto; background: #fff; padding: 24px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
      <span class="close-button" id="popup-edit-close" style="position: absolute; top: 16px; right: 16px; font-size: 1.5rem; cursor: pointer;">&times;</span>
      <h2 style="margin-top: 0; font-size: 1.5rem;">Modifier le livre</h2>

      <div class="popup-layout" style="display: flex; gap: 16px; align-items: flex-start; margin-top: 16px;">
        <div class="popup-left" style="flex-shrink: 0;">
          <img id="popup-edit-cover" src="" alt="Couverture du livre" style="width: 100px; height: 150px; object-fit: cover; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);" />
        </div>
        <div class="popup-right" style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
          <p id="popup-edit-title" style="font-size: 1.2rem; font-weight: 600; margin: 0;"></p>
          <p id="popup-edit-authors" style="margin: 0; color: #555; font-size: 1rem;"></p>
          <p style="margin: 4px 0 0 0; font-size: 0.95rem;">
            <strong>Genre :</strong>
            <span id="popup-edit-genre-text" style="color: #333;"></span>
          </p>
          <p style="margin: 8px 0 4px 0; font-size: 0.95rem;"><strong>Résumé :</strong></p>
          <div id="popup-edit-desc-text" style="background: white; border: 1px solid var(--gray-300, #d1d5db); border-radius: 4px; padding: 8px; max-height: 120px; overflow-y: auto; color: var(--gray-600, #4b5563); line-height: 1.4; font-size: 0.9rem;">
          </div>
        </div>
      </div>
      <div class="edit-line" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 24px;">
        <div class="edit-field">
          <label for="popup-edit-status" style="display: block; font-weight: 600; margin-bottom: 4px;">Statut :</label>
          <select id="popup-edit-status" style="width: 100%; padding: 6px 10px; border: 1px solid var(--gray-300, #d1d5db); border-radius: 8px; font-size: 0.9rem;">
            <option>À lire</option>
            <option>En cours</option>
            <option>Terminé</option>
            <option>DNF</option>
          </select>
        </div>
        <div class="edit-field">
          <label for="popup-edit-note" style="display: block; font-weight: 600; margin-bottom: 4px;">Note (sur 5) :</label>
          <input type="number" id="popup-edit-note" min="1" max="5" step="1" style="width: 100%; padding: 6px 10px; border: 1px solid var(--gray-300, #d1d5db); border-radius: 8px; font-size: 0.9rem;">
        </div>
      </div>
      <div class="edit-line" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px;">
        <div class="edit-field">
          <label for="popup-edit-start" style="display: block; font-weight: 600; margin-bottom: 4px;">Début :</label>
          <input type="date" id="popup-edit-start" style="width: 100%; padding: 6px 10px; border: 1px solid var(--gray-300, #d1d5db); border-radius: 8px; font-size: 0.9rem;">
        </div>
        <div class="edit-field">
          <label for="popup-edit-end" style="display: block; font-weight: 600; margin-bottom: 4px;">Fin :</label>
          <input type="date" id="popup-edit-end" style="width: 100%; padding: 6px 10px; border: 1px solid var(--gray-300, #d1d5db); border-radius: 8px; font-size: 0.9rem;">
        </div>
      </div>
      <div class="edit-buttons" style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;">
        <button id="popup-edit-save" style="padding: 8px 16px; background: var(--primary-600, #8b5cf6); color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: 600; font-size: 0.95rem;">
          Enregistrer
        </button>
        <button id="popup-edit-cancel" style="padding: 8px 16px; background: var(--gray-300, #d1d5db); color: var(--gray-800, #1f2937); border: none; border-radius: 12px; cursor: pointer; font-weight: 600; font-size: 0.95rem;">
          Annuler
        </button>
      </div>
    </div>
  </div>

  <script src="script.js?v=<?php echo filemtime('script.js'); ?>"></script>
</body>
</html>