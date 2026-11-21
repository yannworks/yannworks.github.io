# yannworks.github.io : état

Skill : site-studio (mission ciblée sur un site existant). Mis à jour : 2026-11-21. Phase : 7 (livraison), publié le 2026-11-21.

Les missions précédentes (page et théâtre, puis graphe de contributions) sont décrites dans `.web-craft-history/2026-11-19-site/` et `.web-craft/`, deux archives à laisser telles quelles. Ce fichier suit les missions à partir de l'heure locale.

## Prochaine action
Aucune pour l'heure locale : mission terminée et publiée. Reste à regarder l'échange des chiffres sur un vrai téléphone (voir « Manques et limites »).

## Brief (mission « heure locale », 2026-11-21)
- But : afficher l'heure locale de Yann dans la phrase d'intro, pour qu'un visiteur sache tout de suite s'il est tard en France avant d'écrire.
- Décisions de Yann (entretien déjà fait, appliquées telles quelles) :
  1. Heure de Paris (`Europe/Paris`, changements d'heure compris), 24 h sans secondes (« 21:41 »). Rien ne bouge en continu.
  2. L'heure s'accroche à « France ». Formulation en anglais, passée au humanizer.
  3. Écart ajouté seulement si le fuseau du visiteur diffère (« 6 hours ahead of you », « 3 hours behind you »), demi-heures gérées.
- Détails : changement à la minute exacte sans intervalle qui dérive ; mise à jour au retour sur l'onglet ; sans JavaScript « a student living in France. » ; pas de saut de mise en page ; `<time>` sans région live ; mouvement réduit sans animation ; limite de l'horloge de l'appareil écrite dans le README ; états et paramètre de test dans `board.html`.
- Hors périmètre : la direction (inchangée), les images (aucune), `.web-craft/` et `.web-craft-history/`.
- Budget d'images : 0 (aucune image à générer).
- Stack : HTML, CSS et JavaScript sans framework ni build, servis par GitHub Pages depuis `main`.

## Direction
Inchangée (voir `.web-craft-history/2026-11-19-site/direction.md`) : points 1 bit encre sur papier, Geist pour le texte, Geist Serif pour les quatre mots-clés, seul Clawd en couleur. L'heure reste en Geist (ce n'est pas un mot-clé), avec des chiffres tabulaires.

## Fonctionnement
- `js/clock.js` : `zoneOffset()` demande au navigateur l'heure murale d'un fuseau et en déduit son décalage avec UTC en minutes ; `clockAt()` donne l'heure de Paris, la valeur `datetime` et l'écart (Paris moins visiteur) ; `gapText()` le met en mots ; `showClock()` écrit la proposition ; `startClock()` programme un réveil à la minute pile suivante, recalculé à chaque fois depuis la vraie horloge, et rafraîchit au retour sur l'onglet (`visibilitychange`, `pageshow`).
- `index.html` : `clock.js` chargé dans `<head>` sans `defer`, puis une ligne de script juste après l'intro écrit l'heure avant le premier rendu.
- `js/main.js` : ajoute `INVERSE`, les masques complémentaires des 65 masques de tramage, exposés dans `window.dither`.
- `style.css` : `.clock__time` en `tabular-nums` ; `.clock__swap` empile l'ancien et le nouveau chiffre pendant l'échange.
- Paramètres de test : `?now=<ISO>` (l'horloge repart de cet instant) et `?tz=<fuseau>` (se faire passer pour un visiteur de ce fuseau), sur la page et sur le board.

## Décisions
| Date | Décision | Raison |
| --- | --- | --- |
| 2026-11-21 | Phrase : « …living in France, where it's 21:41 (6 hours ahead of you). » ; même fuseau : « …where it's 21:41. » | Humanizer : aucun tic ; les parenthèses évitent une quatrième virgule dans la même phrase |
| 2026-11-21 | Écarts : « 1 hour », « 6 hours », « 4½ hours », « half an hour », « 4 hours 45 minutes » ; « 6 hours » et « ahead of you » soudés par des espaces insécables, une coupure possible entre les deux | Lisible pour toutes les zones réelles (Inde, Népal, Chatham) ; jamais « you). » seul en début de ligne (critique de Codex) ; lignes pleines à 320, 390 et 1440 px |
| 2026-11-21 | Écart du visiteur pris sur `getTimezoneOffset()` de l'appareil, pas sur le nom de fuseau | C'est le réglage qui fixe l'heure que le visiteur voit ; `?tz=` passe par le nom pour les essais |
| 2026-11-21 | Chiffres tabulaires de Geist | Mesuré : chiffres proportionnels de 38 à 66 unités, tabulaires tous à 60 ; la largeur ne change plus d'une minute à l'autre |
| 2026-11-21 | Script bloquant dans `<head>` plus une ligne inline après l'intro, au lieu d'un script différé | Un script différé peut s'exécuter après le premier rendu : la phrase s'allongerait sous les yeux du visiteur pendant l'entrée |
| 2026-11-21 | Changement de minute : seuls les chiffres changés s'échangent point par point, masques complémentaires de Bayer 8 × 8, 240 ms, linéaire | Emil : fréquence rare (la plupart des visiteurs ne voient jamais une minute passer), but « éviter un changement brusque » dans le langage du site ; sous 300 ms ; masques complémentaires : chaque point montre l'ancien ou le nouveau, jamais les deux |
| 2026-11-21 | Pas d'échange au retour sur l'onglet, quand l'onglet est caché, ni en mouvement réduit | Le visiteur ne regardait pas : l'heure juste s'affiche d'emblée |
| 2026-11-21 | Temps de l'échange lu avec `performance.now()` dans la boucle, pas l'argument de `requestAnimationFrame` | Sous l'horloge simulée de Playwright, les deux ne partagent pas la même origine et l'échange finissait à la première image |
| 2026-11-21 | Tests dans `tools/test-clock.mjs` (Playwright, Chrome installé), `node_modules/` ignoré par un `.gitignore` | Yann peut les relancer ; pas de dépendance ajoutée au site |

## Assets
Budget : 0 / 0 génération. Aucun asset ajouté.

## Critiques de Codex
### Point de contrôle 2 : captures de l'intro (2026-11-21)
Demande, critiques et réponses dans `critiques/clock-*.md`. Deux allers-retours.

| # | Gravité | Critique (résumé) | Réponse de Claude |
| --- | --- | --- | --- |
| 1 | majeure | La première phrase devient longue ; retirer « Online I go by yannworks » et « living » | Refusé : intro approuvée par Yann telle quelle, la mission ajoute seulement l'heure. Proposé à Yann comme option. Second tour : « reason holds » |
| 2 | majeure | Coupures de ligne dans la parenthèse (« you). » seul en début de ligne) ; abréger en « 6h » et souder toute la parenthèse | Partiel : mots entiers gardés ; « 6 hours » et « ahead of you » soudés par des espaces insécables, une seule coupure possible entre les deux. Parenthèse entière soudée essayée puis refusée : ligne à moitié vide à 390 et 1440 px, débordement de la forme longue à 320 px. Second tour : « fixed » |
| 3 | mineure | L'échange en points ressemble à un défaut de rendu ; changer l'heure d'un coup | Refusé : le brief prévoit un changement animé hors mouvement réduit, et c'est le même fondu que l'impression des mots-clés et le changement de thème ; 240 ms, chiffres changés seulement. Réglage `SWAP_MS: 0` pour le couper. Second tour : « reason holds » |

## Relecture du mouvement d'après Emil (2026-11-21)
Fichiers lus : `animate/SKILL.md`, `review-animations/SKILL.md`, `emil-design-eng/SKILL.md` (référence), règles V3, M2, M5 du wiki.

| Avant | Après | Pourquoi | Règle | Preuve |
| --- | --- | --- | --- | --- |
| 1. `js/clock.js` : le masque change à chaque image (`mask-image`), ce qui repeint au lieu de passer par le GPU | Gardé | 1 à 4 caractères, 240 ms, une fois par minute au plus ; même technique que l'impression des mots-clés déjà en place | P1 | Déduit |

Carte de fréquence : changement de minute rare (la plupart des visiteurs ne voient jamais une minute passer), jamais déclenché au clavier. But : éviter un saut brusque, dans le langage du site. 240 ms (sous 300 ms), progression linéaire des seuils comme le fondu du thème, interruption propre (un nouvel appel termine l'échange en cours), rien en mouvement réduit, onglet caché ou retour sur l'onglet. Chiffres tabulaires (V3). Décision : **Approuver**. À vérifier à l'œil : l'échange en temps réel sur un vrai téléphone.

## Critères de fin
- [x] États construits : même fuseau, en avance, en retard, demi-heure, quart d'heure, semaines décalées, minuit, sans JavaScript (board et tests)
- [x] Affichage propre à 390 et 1440 px, clair et sombre, normal et réduit, sans JavaScript (captures du 2026-11-21)
- [x] Relecture du mouvement d'après Emil : Approuver (section ci-dessus)
- [x] Tests : `node tools/test-clock.mjs`, 39 vérifications passées le 2026-11-21
- [x] Textes passés au humanizer
- [x] Critique de Codex sur les captures traitée point par point (deux tours, rien de bloquant)
- [x] Captures et décisions dans ce fichier

## Publication
- 2026-11-21, sur le mot « publish » de Yann : aucun nouveau commit de l'Action sur `main` depuis le clonage (`ab89e30`) ; `clock` fusionnée (`cf9da69`), poussée à 09:15 UTC, build GitHub Pages terminé quelques secondes plus tard.
- Vérifié en ligne (https://yannworks.github.io/?v=2) dans Chrome avec Playwright à 10:16 heure de Paris : Paris « where it's 10:16 », New York « (6 hours ahead of you) », Kolkata « (4½ hours behind you) », `datetime` 2026-11-21T10:16+01:00 ; aucune erreur dans la console, pas de défilement horizontal, scène et graphe actifs ; sans JavaScript « …living in France. ». Capture : `captures/clock/live-390-new-york.png`.

## Captures
`captures/clock/` (2026-11-21, branche `clock`, visiteur à New York, 2026-11-21 20:41 UTC) :
- `390-{light,dark}-{normal,reduced}.png`, `1440-…`, `390-nojs.png`, `1440-nojs.png` : pages entières.
- `intro-1440-light.png`, `intro-390-light.png`, `intro-390-dark.png` : l'intro recadrée.
- `swap-sequence.png` (et `swap-0…3`) : 21:59 → 22:00, avant, vers 80 ms, vers 140 ms, après.
- `intro-{320,390,1440}-longest.png` : la forme la plus longue (visiteur à Katmandou).
- `board-local-time.png` : la section du board.

## Idées non retenues
- Indiquer « (it's late here) » la nuit : hors brief, Yann a choisi l'heure et l'écart seuls.

## Manques et limites
- L'heure vient de l'horloge de l'appareil du visiteur : fausse si l'appareil l'est (écrit dans le README).
- Pendant les 240 ms de l'échange, la largeur de l'heure varie de 0,05 px (arrondi de la grille en ligne), revenue exactement ensuite ; invisible, mesurée dans les tests (tolérance 0,1 px).
- Pas testé sur un vrai iPhone ni avec un vrai lecteur d'écran (structure DOM vérifiée).
