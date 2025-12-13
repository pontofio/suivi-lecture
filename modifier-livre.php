<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

require 'config.php';
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['utilisateur_id'])) {
    echo json_encode(['success' => false, 'message' => 'Non authentifié']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    echo json_encode(['success' => false, 'message' => 'Données manquantes']);
    exit;
}

$livre_id = $data['livre_id'] ?? null;
$statut = $data['statut'] ?? '';
$utilisateur_id = $_SESSION['utilisateur_id'];

// ==========================================================
//    CORRECTION CRUCIALE : Convertir "" en NULL pour la BDD
// ==========================================================

// Pour la NOTE (INT ou NULL)
$note_raw = $data['note'] ?? null;
$note = ($note_raw === '' || $note_raw === null) ? null : intval($note_raw);

// Pour la DATE DE DEBUT (DATE ou NULL)
$debut_raw = $data['date_debut'] ?? null;
$debut = ($debut_raw === '') ? null : $debut_raw;

// Pour la DATE DE FIN (DATE ou NULL)
$fin_raw = $data['date_fin'] ?? null;
$fin = ($fin_raw === '') ? null : $fin_raw;

// ==========================================================

if (!$livre_id) {
    echo json_encode(['success' => false, 'message' => 'ID du livre manquant']);
    exit;
}

try {
    // On utilise les nouvelles variables ($note, $debut, $fin)
    $stmt = $pdo->prepare("UPDATE livres SET statut = ?, note = ?, date_debut = ?, date_fin = ? WHERE id = ? AND utilisateur_id = ?");
    
    $stmt->execute([$statut, $note, $debut, $fin, $livre_id, $utilisateur_id]);

    $affectedRows = $stmt->rowCount();

    if ($affectedRows > 0) {
        echo json_encode(['success' => true, 'message' => 'Livre modifié']);
    } else {
        // 0 ligne modifiée = données identiques (ce n'est pas une erreur)
        echo json_encode(['success' => true, 'message' => 'Aucune modification nécessaire (données identiques).']);
    }

} catch (PDOException $e) {
    error_log("ERREUR SQL modifier-livre : " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Erreur SQL: ' . $e->getMessage()]);
}
?>