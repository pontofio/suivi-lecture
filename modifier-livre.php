<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

require 'config.php';
header('Content-Type: application/json');

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

if (!$livre_id) {
    echo json_encode(['success' => false, 'message' => 'ID du livre manquant']);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE livres SET statut = ?, note = ?, date_debut = ?, date_fin = ? WHERE id = ?");
    $stmt->execute([$statut, $note, $debut, $fin, $livre_id]);

    echo json_encode(['success' => true, 'message' => 'Livre modifié']);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
