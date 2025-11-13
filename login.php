<?php
#okok ok
session_start();
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");


require 'config.php';

$email = $_POST['email'] ?? '';
$mot_de_passe = $_POST['mot_de_passe'] ?? '';

require_once("config.php");

$stmt = $pdo->prepare("SELECT * FROM utilisateurs WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch();

if ($user && password_verify($mot_de_passe, $user['mot_de_passe'])) {
  $_SESSION['utilisateur_id'] = $user['id'];
  header("Location: index.php");
  exit;
} else {
  if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $error = "Identifiants invalides.";
  }
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Connexion</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="auth-container">
    <h1>Connexion à votre bibliothèque</h1>
    <p style="text-align:center;">Connectez-vous pour suivre vos lectures, consulter vos statistiques et gérer vos livres favoris.</p>
    <form method="POST">
      <input type="email" name="email" placeholder="Email" required>
      <input type="password" name="mot_de_passe" placeholder="Mot de passe" required>
      <button type="submit">Se connecter</button>
    </form>
    <?php if (isset($error)): ?>
      <p class="error-message"><?= htmlspecialchars($error) ?></p>
    <?php endif; ?>
    <p>Pas encore de compte ? <a href="register.php">Créer un compte</a></p>
  </div>
</body>
</html>

