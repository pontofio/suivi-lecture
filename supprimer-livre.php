<?php
require 'config.php';
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['utilisateur_id'])) {
    echo json_encode(['success' => false, 'message' => 'Non connecté']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

$titre = $data['titre'] ?? null;
$auteur = $data['auteur'] ?? null;
$utilisateur_id = $_SESSION['utilisateur_id'];

if (!$titre || !$auteur) {
    echo json_encode(['success' => false, 'message' => 'Titre ou auteur manquant']);
    exit;
}

try {
    $stmt = $pdo->prepare("DELETE FROM livres WHERE titre = ? AND auteur = ? AND utilisateur_id = ?");
    $stmt->execute([$titre, $auteur, $utilisateur_id]);

    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
