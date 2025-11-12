<?php
session_start();
header('Content-Type: application/json');
require 'config.php';

if (!isset($_SESSION['utilisateur_id'])) {
    echo json_encode(['success' => false, 'message' => 'Non authentifié.']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT titre AS title, auteur AS authors, statut , note, date_debut AS startDate, date_fin AS endDate, genre, description, couverture AS cover FROM livres WHERE utilisateur_id = ?");
    $stmt->execute([$_SESSION['utilisateur_id']]);
    $livres = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'livres' => $livres]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la récupération des livres : ' . $e->getMessage()]);
}
