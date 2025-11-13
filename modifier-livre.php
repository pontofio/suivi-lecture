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

// CORRECTION : Convertir les "" de JS en NULL pour la BDD
$note_raw = $data['note'] ?? null;
$note = ($note_raw === '' || $note_raw === null) ? null : intval($note_raw);

$debut_raw = $data['date_debut'] ?? null;
$debut = ($debut_raw === '') ? null : $debut_raw;

$fin_raw = $data['date_fin'] ?? null;
$fin = ($fin_raw === '') ? null : $fin_raw;

// FIN DE LA CORRECTION

if (!$livre_id) {
    // C'est cette ligne qui génère l'erreur de votre screenshot
    echo json_encode(['success' => false, 'message' => 'ID du livre manquant']);
    exit;
}

try {
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
    error_log("ERREUR SQL FATALE : " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Erreur SQL: ' . $e->getMessage()]);
}
?>