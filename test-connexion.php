<?php
require_once __DIR__ . '/config/dp.php';
if (isset($pdo)) {
  echo "Connexion réussie";
} else {
  echo "Connexion échouée";
}
