<?php

session_start();
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");


require 'config.php';

// Si le formulaire est soumis
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = $_POST['email'] ?? '';
    $mot_de_passe = $_POST['mot_de_passe'] ?? '';
    $confirmation = $_POST['confirmation'] ?? '';

    if (empty($email) || empty($mot_de_passe) || empty($confirmation)) {
        $message = "Tous les champs sont obligatoires.";
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $message = "Adresse email invalide.";
    } elseif ($mot_de_passe !== $confirmation) {
        $message = "Les mots de passe ne correspondent pas.";
    } else {
        // Vérifie si l'utilisateur existe déjà
        $stmt = $pdo->prepare("SELECT * FROM utilisateurs WHERE email = ?");
        $stmt->execute([$email]);

        if ($stmt->fetch()) {
            $message = "Cet email est déjà utilisé.";
        } else {
            // Insertion
            $hash = password_hash($mot_de_passe, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("INSERT INTO utilisateurs (email, mot_de_passe) VALUES (?, ?)");
            $stmt->execute([$email, $hash]);

            $_SESSION['utilisateur_id'] = $pdo->lastInsertId();
            header("Location: index.php");
            exit;
        }
    }
}
?>

<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Créer un compte</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="auth-container">
  <h1>Créer un compte</h1>

  <?php if (!empty($message)) : ?>
    <p style="color:red;"><?= htmlspecialchars($message) ?></p>
  <?php endif; ?>

  <form method="POST">
    <label>Email :</label>
    <input type="email" name="email" required>
    
    <label>Mot de passe :</label>
    <input type="password" name="mot_de_passe" required>

    <label>Confirmer le mot de passe :</label>
    <input type="password" name="confirmation" required>

    <button type="submit">Créer le compte</button>
  </form>

  <p>Déjà inscrit ? <a href="login.html">Se connecter</a></p>
  </div>
</body>
</html>
