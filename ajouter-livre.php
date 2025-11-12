<?php
session_start();
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

ini_set('display_errors', 1);
error_reporting(E_ALL);

require 'config.php'; // contient $pdo
if (!isset($_SESSION['utilisateur_id'])) {
    echo json_encode(['success' => false, 'message' => 'Non authentifié']);
    exit;
}

// Lire le JSON brut
$rawInput = file_get_contents("php://input");
$data = json_decode($rawInput, true);

// Validation minimale : titre + auteur obligatoires
if (
    !$data
    || empty(trim($data['title']))
    || empty(trim($data['authors']))
) {
    echo json_encode(['success' => false, 'message' => 'Titre et auteur sont obligatoires.']);
    exit;
}

// Extraire chaque clé du JSON
$titre       = trim($data['title']);        // col `titre`
$auteur      = trim($data['authors']);      // col `auteur`
$couverture  = isset($data['cover']) ? trim($data['cover']) : null;       // col `couverture`
$resume      = isset($data['description']) ? trim($data['description']) : null; // col `description`
$genre       = isset($data['genre']) ? trim($data['genre']) : null;         // col `genre`
$statut      = isset($data['status']) ? trim($data['status']) : 'À lire';    // col `statut`
$note        = isset($data['note']) ? intval($data['note']) : 0;            // col `note`
$dateDebut   = !empty($data['startDate']) ? trim($data['startDate']) : null; // col `date_debut`
$dateFin     = !empty($data['endDate'])   ? trim($data['endDate'])   : null; // col `date_fin`

try {
    $stmt = $pdo->prepare("
      INSERT INTO livres
        (utilisateur_id, titre, auteur, statut, note, date_debut, date_fin, genre, description, couverture)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
      $_SESSION['utilisateur_id'],
      $titre,
      $auteur,
      $statut,
      $note,
      $dateDebut,
      $dateFin,
      $genre,
      $resume,
      $couverture
    ]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => 'Livre ajouté avec succès.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Aucune insertion.']);
    }
} catch (PDOException $e) {
    error_log("Erreur PDO ajouter-livre : " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Erreur SQL lors de l\'insertion.']);
}
