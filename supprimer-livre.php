<?php
require 'config.php';
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['utilisateur_id'])) {
    echo json_encode(['success' => false, 'message' => 'Non connecté']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

// CORRECTION : Utiliser livre_id et non titre/auteur
$livre_id = $data['livre_id'] ?? null;
$utilisateur_id = $_SESSION['utilisateur_id'];

if (!$livre_id) {
    echo json_encode(['success' => false, 'message' => 'ID manquant']);
    exit;
}

try {
    // CORRECTION : Suppression par ID et vérification de l'utilisateur
    $stmt = $pdo->prepare("DELETE FROM livres WHERE id = ? AND utilisateur_id = ?");
    $stmt->execute([$livre_id, $utilisateur_id]);

    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>