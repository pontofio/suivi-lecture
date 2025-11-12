<?php
session_start();
require 'config.php';
session_unset();  // Supprime toutes les variables de session
session_destroy(); // Détruit la session

// Redirige vers la page de login
header("Location: login.php");
exit;
