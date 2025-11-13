<?php
session_start();
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

require 'config.php';
if (!isset($_SESSION['utilisateur_id'])) {
  header("Location: login.php");
  exit;
}
?>

<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Accueil - Suivi de lectures</title>
  <link rel="stylesheet" href="style.css?v=<?php echo filemtime('style.css'); ?>" />
</head>
<body>
  <div id="menu-placeholder"></div>

  <main class="container">
    <h1>Tableau de bord lecture</h1>

    <div class="dashboard">
      <div class="dashboard-left">
        <div class="graph-container">
          <div class="challenge-block">
            <h3>📚 Challenge Lecture</h3>
            <div class="challenge-objective">
              <span>Objectif :</span>
              <span>30 livres</span>
            </div>
            <div class="challenge-progress">
              <div class="challenge-progress-label">
                <span>Progression :</span>
                <span id="progress-numbers">0 / 30</span>
              </div>
              <div class="progress-bar">
                <div class="progress-bar-fill" id="progress-bar-fill" style="width: 0%"></div>
              </div>
              <div class="progress-percentage" id="progress-percentage">0%</div>
            </div>
          </div>

          <div class="graph-block">
            <h2>Livres lus par mois</h2>
            <canvas id="graph-mois" width="600" height="300"></canvas>
          </div>

          <div class="graph-block">
            <h2>Livres lus par année</h2>
            <canvas id="graph-annee" width="600" height="300"></canvas>
          </div>

          <div class="graph-block">
            <h3>Répartition des genres littéraires</h3>
            <canvas id="graph-genres"></canvas>
          </div>
        </div>
      </div>

      <div class="dashboard-right">
        <h2>Mes dernières lectures</h2>
        <div id="derniers-livres" class="grid-container"></div>
      </div>
    </div>
  </main>

  <div id="edit-popup" class="popup" style="display:none;">
    <div class="popup-content">
      <span class="close-button" id="edit-close">&times;</span>
      <h2>Modifier le livre</h2>

      <div class="popup-layout">
        <img id="edit-cover" src="" alt="Couverture du livre" class="popup-cover" />
        <div class="popup-info">
          <p id="edit-title" class="edit-title"></p>
          <p id="edit-authors" class="edit-authors"></p>
          <p><strong>Genre :</strong> <span id="edit-genre-text" class="edit-genre-text"></span></p>
          <p><strong>Résumé :</strong></p>
          <div id="edit-desc-text" class="edit-description"></div>
        </div>
      </div>

      <div class="edit-line">
        <div class="edit-field">
          <label for="edit-status">Statut :</label>
          <select id="edit-status">
            <option value="À lire">À lire</option>
            <option value="En cours">En cours</option>
            <option value="Terminé">Terminé</option>
            <option value="DNF">DNF</option>
          </select>
        </div>

        <div class="edit-field">
          <label for="edit-note">Note (sur 5) :</label>
          <input type="number" id="edit-note" min="1" max="5">
        </div>
      </div>

      <div class="edit-line">
        <div class="edit-field">
          <label for="edit-start">Début :</label>
          <input type="date" id="edit-start">
        </div>

        <div class="edit-field">
          <label for="edit-end">Fin :</label>
          <input type="date" id="edit-end">
        </div>
      </div>

      <div class="edit-buttons">
        <button id="edit-save">Enregistrer</button>
        <button id="edit-cancel">Annuler</button>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="script.js?v=<?php echo filemtime('script.js'); ?>"></script>
</body>
</html>