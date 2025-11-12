<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

require 'config.php';
session_start(); // CORRECTION : Il faut démarrer la session
header('Content-Type: application/json');

// CORRECTION : Vérifier la session
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
$note = $data['note'] ?? null;
$debut = $data['date_debut'] ?? null;
$fin = $data['date_fin'] ?? null;
$utilisateur_id = $_SESSION['utilisateur_id']; // CORRECTION : Récupérer l'ID de session

if (!$livre_id) {
    echo json_encode(['success' => false, 'message' => 'ID du livre manquant']);
    exit;
}

try {
    // CORRECTION : La clause WHERE utilise l'ID du livre ET l'ID de l'utilisateur
    $stmt = $pdo->prepare("UPDATE livres SET statut = ?, note = ?, date_debut = ?, date_fin = ? WHERE id = ? AND utilisateur_id = ?");
    $stmt->execute([$statut, $note, $debut, $fin, $livre_id, $utilisateur_id]);

    echo json_encode(['success' => true, 'message' => 'Livre modifié']);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>