<?php
session_start();
require 'config.php';
header('Content-Type: application/json');

if (!isset($_SESSION['utilisateur_id'])) {
  echo json_encode(['success' => false, 'message' => 'Non connecté']);
  exit;
}

try {
  $stmt = $pdo->prepare("SELECT * FROM livres WHERE utilisateur_id = ? ORDER BY id DESC LIMIT 10");
  $stmt->execute([$_SESSION['utilisateur_id']]);
  $livres = $stmt->fetchAll();

  echo json_encode([
    'success' => true,
    'livres' => $livres
  ]);
} catch (PDOException $e) {
  echo json_encode([
    'success' => false,
    'message' => 'Erreur SQL : ' . $e->getMessage()
  ]);
}
