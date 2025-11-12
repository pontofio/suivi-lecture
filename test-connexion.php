<?php
require 'config.php';

if (isset($pdo)) {
  echo "Connexion réussie";
} else {
  echo "Connexion échouée";
}
