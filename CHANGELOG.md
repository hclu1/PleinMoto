# Journal des modifications (CHANGELOG)

Toutes les modifications notables apportées à ce projet sont documentées dans ce fichier.
Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/) et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

## [1.2.0] - 2026-10-28
### Ajouté
- Choix du mode de saisie kilométrique pour chaque plein :
  - Mode **Compteur total (ODO)** : saisie du kilométrage global au tableau de bord avec calcul automatique des kilomètres parcourus.
  - Mode **Trip 1 (Compteur partiel remis à 0)** : saisie directe des kilomètres parcourus avec ce plein, avec calcul automatique du nouveau kilométrage compteur global.
- Indicateur de rappel visuel : « N'oubliez pas de remettre votre Trip 1 à zéro à la pompe ! ».
- Mémorisation du mode de saisie préféré de l'utilisateur.

## [1.1.0] - 2026-10-28
### Ajouté
- Sélecteur de mode d'affichage « PC / Téléphone » : bascule instantanée entre une simulation iPhone (cadre smartphone réaliste, Dynamic Island, ergonomie mobile) et le mode Bureau PC (affichage étendu plein écran fluide).
- Sauvegarde locale du mode d'affichage préféré de l'utilisateur.

## [1.0.0] - 2026-10-28
### Ajouté
- Version initiale de « Moto Carburant », application iPhone installable et commercialisable.
- Profil moto modifiable avec moto préremplie à l'installation : Kymco CV3 575 (2026), réservoir 16L, SP98.
- Gestion multi-motos avec sélection d'une moto active.
- Page 1 « Pleins & Consommation » : date du jour modifiable, kilométrage, calcul automatique des km parcourus et du prix/litre, marques personnalisables (TotalEnergies par défaut, Carrefour, E.Leclerc), carburants (SP98 par défaut), consommation L/100 km, stats min/max/moyenne, graphiques d'évolution et coût carburant au km.
- Page 2 « Entretien & Garage » : historique chronologique, catégories (révision, vidange, pneus, plaquettes, chaîne, courroie, réparation), garage ou moi-même, photo de facture locale, dépenses par mois/année/catégorie, estimation prochaine révision.
- Page 3 « Coût de Revient » : TCO complet (achat, carburant, entretien, assurance, accessoires), coût au km avec/sans achat, calcul de revente et moins-value, graphique de répartition visuelle.
- Page 4 « Stations & Prix » : intégration officielle Open Data gouvernementale française (flux instantané data.economie.gouv.fr), recherche géolocalisée consentie, affichage carte interactive & liste triée par prix croissant (SP98 par défaut), filtres enseignes, importation directe du prix dans le plein.
- Sauvegarde locale 100% hors ligne, export CSV et JSON, restauration locale.
- Mode sombre complet, Safe Area iPhone, gros boutons tactiles ergonomiques adaptés à l'usage à la pompe.
- Données de démonstration activables/désactivables.
