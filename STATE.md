# yannworks.github.io : état

Skill : site-studio (missions ciblées sur un site existant). Mis à jour : 2026-11-22. Dernières missions : refonte, puis points vivants, sur la branche `refonte`, pas encore publiées.

Les missions précédentes (page et théâtre, puis graphe de contributions) sont décrites dans `.web-craft-history/2026-11-19-site/` et `.web-craft/`, deux archives à laisser telles quelles. Ce fichier suit les missions à partir de l'heure locale, la plus récente en haut.

## Prochaine action
Intro : Yann garde la version 1 (2026-11-22). Publication demandée (« publish ») : voir « Publication » de la mission « points vivants ». Après publication : vérifier en ligne avec `?v=2` et mettre à jour la ligne « Objectif » de l'entrée du site dans `projects/README.md` d'AIOS.

# Mission « points vivants » (2026-11-22)

## Brief
- Faire vivre les points orange pour de vrai : les cases restent sur leur grille, seul le motif change (cases qui s'allument et s'éteignent), avec du hasard. Plus de translation, de découpe ni de fondu du bloc ; plus de `clip-path` sur la bande de la carte.
- Trois zones, trois mouvements, chacun lié à son rôle. Nouvelle graine à chaque visite. Cadence de pixel (8 à 15 images par seconde), une seule boucle `requestAnimationFrame`, en pause hors de l'écran et onglet caché. Mouvement réduit : une image fixe. Sans JavaScript : rien. Rien sous un contenu, couleur unique `#d97757`, pas de bibliothèque.
- Bande des mots-clés : pas de mouvement continu pendant la lecture. Carte active : peut vivre en continu, lentement, seulement active et à l'écran. Skill animate pour la qualité ; exploration par variantes à la demande explicite de Yann.

## Choix de Yann
Neuf variantes construites dans `board.html` (trois par zone, bouton « nouvelle graine », bouton « mouvement réduit simulé »), vidéo `captures/refonte/video-variants-board.mp4`. **Yann a choisi B, B, C** : Scintillement sous les mots-clés, Flux sur la carte active, Dérive en bas de page. Les six autres restent au board, section « Not chosen » (`js/dots-lab.js`, jamais chargé par la page).

## Fonctionnement
- `js/dots.js` : le moteur. Une `Field` par zone (canvas, grille de cases, densité par case = forme × bruit doux, seuil Bayer 8 × 8, ordre aléatoire des cases) ; une case est allumée quand sa densité dépasse son seuil. Une seule boucle `requestAnimationFrame`, qui ne fait un pas que tous les 83 ms (12 par seconde) ; chaque zone a sa propre horloge, qui n'avance que si la zone est à l'écran (IntersectionObserver), l'onglet visible et son mouvement occupé ; la boucle s'arrête quand plus rien ne l'est. Seules les cases qui changent sont repeintes. Graine tirée par `crypto` à chaque visite. Mouvement réduit : image fixe, suivie en direct si le réglage change. `DOTS.stats` compte le temps de script par pas.
- Les trois mouvements (dans `js/dots.js`) : `kwSparkle`, `fringeFlow` (avec `activity`, l'allumage et l'extinction en ordre aléatoire), `endDrift`.
- `js/accent.js` : pose les canvas et choisit la carte active (dernière pointée, touchée ou atteinte au clavier ; la première au repos). Expose `window.accent.items` pour les tests et les mesures.
- `style.css` : plus de `clip-path` ni de transition sur les points ; seule la lueur derrière la bande garde un fondu (300 ms à l'allumage, 200 ms à l'extinction, aucun en mouvement réduit) ; la bande d'un mot-clé reste cachée pendant son impression.

## Décisions
| Date | Décision | Raison |
| --- | --- | --- |
| 2026-11-22 | Mots-clés : Scintillement. Apparition une fois, cases en ordre aléatoire, après l'impression du mot ; au survol du mot, des cases au hasard s'inversent pendant 600 ms, de moins en moins, puis la bande revient exactement à l'identique | Choix de Yann. Le mot qu'on pointe répond, et rien ne bouge pendant qu'on lit (test : aucune case change en 2 s sans pointeur) |
| 2026-11-22 | Carte active : Flux. Le bruit sous la bande dérive de 1,5 case par seconde (avec un léger balancement vertical) tant que la carte est active et à l'écran ; allumage en ordre aléatoire en 300 ms, extinction en 200 ms | Choix de Yann. C'est la carte qu'on regarde : sa bande coule doucement, les autres sont éteintes |
| 2026-11-22 | Bas de page : Dérive. Le champ roule lentement (1,1 case par seconde de côté, 0,6 vers le haut) dès qu'il est à l'écran | Choix de Yann. La page finit sur quelque chose de calme et vivant |
| 2026-11-22 | **Exception voulue à la règle « rien ne bouge tout seul »** : la bande de la carte active et le champ du bas bougent sans action du visiteur | Demande de Yann pour ce travail ; limitée à deux zones décoratives, lentes, sans texte dessus, en pause hors de l'écran et onglet caché, absente en mouvement réduit. Les mots-clés, le graphe et les composants restent soumis à la règle |
| 2026-11-22 | 12 pas par seconde, une seule boucle pour toutes les zones | Cadence de pixel demandée (8 à 15) : les points changent par petits sauts au lieu de glisser à 60 Hz ; une boucle, une seule horloge à mettre en pause |
| 2026-11-22 | Graine nouvelle à chaque visite (`crypto.getRandomValues`), plus le hasard dans le temps (scintillement, ordre des cases) | Demande de Yann : jamais deux fois le même motif |
| 2026-11-22 | Au clavier, la carte change d'un coup (pas d'allumage progressif) | Emil M1 : pas de mouvement sur une action au clavier ; un focus qui suit un clic ou un toucher garde l'allumage |
| 2026-11-22 | Changement d'avis en cours d'allumage : on repart de la part de cases déjà allumée | Emil M11 : pas de saut ni de redémarrage à zéro (test) |
| 2026-11-22 | La lueur derrière la bande garde un fondu de 300 / 200 ms | C'est la lumière, pas les points ; sans fondu, le dégradé apparaissait d'un coup avant les premières cases |
| 2026-11-22 | Cache du bruit borné (4 096 valeurs, recalculables) | Le bruit qui dérive rencontre sans cesse de nouveaux points de grille : sans limite, la mémoire grandirait pendant une longue visite |
| 2026-11-22 | Variantes non retenues gardées au board seulement (`js/dots-lab.js`) | Comparaison possible plus tard, sans poids pour la page |

## Relecture du mouvement d'après Emil (2026-11-22)
Fichiers lus : `animate/SKILL.md` (le skill installé), `review-animations/SKILL.md` et `STANDARDS.md`, règles M2, M5, M11 et P5 du wiki. Méthode : code, comptage des cases changées par le moteur (tests), vidéos en temps réel, mouvement réduit simulé et réel. Carte de fréquence : scintillement des mots-clés, rare ; changement de carte active, quelques dizaines de fois par visite ; flux et dérive, continus quand visibles.

| Avant | Après | Pourquoi | Règle | Preuve |
| --- | --- | --- | --- | --- |
| 1. `js/dots.js` `activity.set` : un changement de carte repartait de zéro, même au milieu d'un allumage | Repart de la part de cases déjà allumée | Une interaction qu'on inverse ne doit pas sauter | M11 | Observé (test « a quick change of mind ») |
| 2. Scintillement de 750 ms au survol d'un mot | 600 ms, l'essentiel des inversions dans les 250 premières | Survol : rester court ; au-delà de 300 ms, la décroissance le justifie | M5 | Déduit |
| 3. Cache du bruit sans limite | Borné à 4 096 valeurs | Mémoire stable pendant une longue visite | P (performance) | Déduit |
| 4. Allumage de la carte au clavier | Immédiat | Pas de mouvement sur une action au clavier | M1 | Observé (test) |

Tient : rien ne glisse ni ne se découpe (test : ni `clip-path` ni `transform` sur les canvas) ; le flux et la dérive sont des mouvements constants, donc linéaires (STANDARDS : constant motion → linear) ; la carte active est un état à indiquer (M2) ; mouvement réduit : image fixe, aucune case ne change (test) ; boucle en pause hors de l'écran (test) et onglet caché. Point d'attention : le moteur tourne sur le fil principal (canvas), et non sur le compositeur ; mesuré ci-dessous, son coût reste bas. **Décision : Approuver.** À vérifier sur un vrai téléphone : la sensation du flux à 12 pas par seconde, et l'autonomie si la page reste ouverte longtemps en bas.

## Mesures (`node tools/measure-dots.mjs`, `captures/refonte/measure-dots.txt`)
Téléphone 390 × 844, processeur ralenti 4 fois, 10 s par cas.

| Zone à l'écran | Script par pas (moyen / pire) | Fil principal occupé | Dont scripts |
| --- | --- | --- | --- |
| Bande de la carte active, animée | 2,72 / 8,40 ms | 10,6 % | 3,9 % |
| Même chose, mouvement réduit | aucun pas | 0,3 % | 0,0 % |
| Bas de page, animé | 2,80 / 5,20 ms | 8,7 % | 3,7 % |
| Même chose, mouvement réduit | aucun pas | 0,1 % | 0,0 % |

120 pas en 10 s : la cadence de 12 par seconde tient même ralentie. Le reste du temps occupé (au-delà des scripts) est la peinture des canvas et l'appel de la boucle à chaque image de l'écran.

## Vidéos (temps réel)
`captures/refonte/video-dots-kw.mp4` (survol des quatre mots-clés, 1280 px), `video-dots-card.mp4` (passage d'une carte à l'autre puis repos, 1280 px), `video-dots-end.mp4` (bas de page au téléphone, 390 px), `video-variants-board.mp4` (les neuf variantes). Captures : `captures/refonte/live-final/` (320, 390, 1440 px ; clair, sombre, mouvement réduit, sans JavaScript). Le board se recapture avec `node tools/capture.mjs <dossier> board.html`.

## Critères de fin
- [x] Chaque zone a le mouvement choisi par Yann (B, B, C)
- [x] Plus de `clip-path` sur la bande (test)
- [x] Vidéos en temps réel de chaque zone dans `captures/refonte/`
- [x] Mouvement réduit vérifié : image fixe, aucune case ne change, survol sans effet (tests)
- [x] Tests : `node tools/test-showcase.mjs` (98 vérifications, dont le test de pixels sous les mots-clés) et `node tools/test-clock.mjs` passent
- [x] Aucune erreur dans la console, aucun défilement horizontal à 320, 390 et 1440 px (captures)
- [x] Relecture d'Emil : Approuver ; coût mesuré
- [ ] Publication : sur le mot « publish » de Yann seulement

# Mission « refonte » (2026-11-22)

## Brief
- Retirer le théâtre et son code ; mettre les projets en avant, surtout les trois composants (inchangés, copies vérifiées dans `tools/showcase/vendor/`) ; Clawd du graphe plus petit et plus mignon, sur les grilles approuvées du skill clawd ; revoir la présentation du graphe et des composants ; tramage en accent seulement (jamais sous un contenu), orange de Clawd comme seule couleur d'accent, glows légers ; un peu plus de texte de présentation (deux versions au plus, aucun fait inventé).
- Contraintes : anglais, humanizer, rien ne bouge tout seul, mouvement réduit, AA au minimum ; site-studio, emil-craft, emil-design-eng, clawd, animate ; tests existants adaptés ; publication seulement sur « publish ».
- Motifs à éviter (Yann) : dégradés violet et bleu, verre dépoli, ombres floues partout, néon partout, pilules, numéros « 01/02/03 », étiquettes monospace décoratives.
- Références : `captures/references/pixel-shader-ui-{1,2}.webp` (tramage orange au bas de la carte active et en bas de l’écran, contenu net). Captures d’une autre app fournies par Yann : gardées sur le Mac, hors du dépôt public (`.gitignore`).
- Budget d'images : 0 (aucune image générée ; Clawd et l'image de partage viennent des grilles du skill clawd).
- Skill animate d'Emil installé dans AIOS avant le travail du mouvement (`.agents/skills/animate`, commit `64eb3de`, MIT), noté dans `skills-lock.json` et `.agents/skills/README.md` (branche AIOS `skills/animate`, pas encore envoyée).

## Diagnostic (captures `captures/refonte/before/`)
- Le théâtre occupait 848 × 472 px du premier écran à 1440 px et environ 240 px au téléphone ; en sombre il était presque vide. Les composants commençaient sous la ligne de flottaison : vers 950 px à 1440 px, vers 965 px au téléphone.
- Le graphe montrait 53 semaines à 1440 px alors que l'activité commence le 12 septembre 2026 : 40 colonnes de points vides. Clawd y faisait environ 88 px de large.
- Le tramage noir et blanc couvrait toute la scène et le graphe : rien n'attirait l'œil plus qu'autre chose.

## Directions proposées, choix de Yann
Trois maquettes réelles (vrais composants, vraies données, vrai Clawd) : `captures/refonte/maquettes/{a,b,c}.html` et planches `sheet-*.png` (pages entières retirées avant publication, régénérables avec `tools/capture.mjs`). A « Le labo d'abord » (cartes sous l'intro, tramage au bas de la carte active), B « Colonne fixe » (intro et graphe fixes à gauche, composants qui défilent), C « Vedette » (Shoji Bento en grand dès le premier écran). **Yann a choisi A.** Intro : version 1 mise en place en attendant son choix.

## Fonctionnement
- `index.html` : en-tête ; `.hero` (intro avec l'heure, liens) ; `.showcase` (trois cartes `.showcase__item`, chacune avec une bande `.fringe` vide) ; `.activity` ; `footer.end`. Plus de scène.
- `js/accent.js` (nouveau) : dessine les points orange sur des canvas, une fois par largeur (seuils Bayer 8 × 8, bruit doux à graine fixe, formes `kw`, `fringe`, `end`) ; gère la carte active (dernière pointée à la souris, touchée ou focalisée ; la première au repos ; au clavier, sans transition). Exposé dans `window.accent` pour le board.
- `js/activity.js` (réécrit) : 26 semaines partout, carrés en éléments `<i data-level>` colorés par le CSS (le thème suit tout seul), mois sous la grille, légende, ligne du jour (aujourd'hui par défaut), clavier inchangé ; Clawd sur un petit canvas en pixels d'écran entiers (2 px par case à côté de carrés de 12 px et plus, environ 1,5 px sinon), marche depuis 120 px à gauche à la première apparition, clignements et rebonds pendant 8 s puis immobile, salut (visage `> <`, bras levé) au survol ou au toucher.
- `js/main.js` : ne dépend plus de la scène ; `--cell` fixé à 2 px dans le CSS (masques du fondu, impression des mots-clés, chiffres de l'heure).
- `js/showcase.js` : inchangé dans sa logique ; la section étant au premier écran, le paquet se charge 250 ms après `load` sans défilement.
- `tools/make-clawd.py` : n'exporte plus que les 18 poses du graphe (42 avant) et dessine `img/share.png` (Clawd qui salue sur un champ de points orange). Favicons identiques au pixel près (non modifiés).
- Supprimés : `js/show.js`, `js/stage-art.js`, `js/stage.js`, `js/scene.js`, `img/stage-light.png`, `img/stage-dark.png`, le CSS et les balises de la scène, ses sections du board (scène, déroulé du spectacle, accessoires), ses passages du README.
- `tools/capture.mjs` (nouveau) : captures pleine page par largeur, thème, mouvement réduit, sans JavaScript ; erreurs de console et débordement affichés.

## Décisions
| Date | Décision | Raison |
| --- | --- | --- |
| 2026-11-22 | Direction A, choisie par Yann | Les composants juste sous l'intro, le tramage en accent sur la carte active, comme les références |
| 2026-11-22 | Intro : version 1 en place (« …My interface components live in Experiments, a public lab where you can copy the code, and three of them are just below. »), « Online I go by yannworks » retiré | Faits déjà publics seulement (profil, `projects/README.md`) ; la phrase retirée répétait le nom du haut de page ; humanizer passé ; Yann choisit entre les versions 1 et 2 |
| 2026-11-22 | Une seule couleur d'accent, `#d97757`, pour les formes et les points, jamais pour du petit texte | 3,1:1 sur blanc : assez pour une forme, pas pour un texte ; une seule couleur garde le caractère du site |
| 2026-11-22 | Deux gris ajoutés : `--muted` (texte secondaire, 6,7:1 clair, 7,7:1 sombre) et `--surface`/`--line` (cartes) | Les cartes et leurs lignes ont besoin d'un second niveau ; tout reste AA (board) |
| 2026-11-22 | Graphe : quatre niveaux d'orange, chacun au moins 3:1 sur le fond (plus foncé pour « plus » en clair, plus clair en sombre) | Un jour actif se voit toujours (WCAG 1.4.11) ; mesuré dans le board |
| 2026-11-22 | Points orange seulement dans des espaces laissés vides : bande de 4 px sous chaque mot-clé (2 px sous le mot), bande de 40 px au pied des cartes, champ de 56 px (72 px dès 768 px) en bas de page | Consigne « le tramage ne recouvre plus aucun contenu » ; vérifié par un test qui cache les points et cherche des pixels de texte à leur place (320, 390, 1440 px) |
| 2026-11-22 | Interligne de l'intro 1,4 → 1,65 | Deux lignes de mots-clés à la suite ne laissaient pas la place à la bande (elle touchait le haut de « things » à 1440 px) ; 0,41 em libres entre deux mots-clés, 8,6 px à 21 px |
| 2026-11-22 | Carte active : la dernière pointée, focalisée ou touchée ; la première au repos ; elle le reste quand le pointeur s'en va | Les points ne clignotent pas en traversant l'espace entre deux cartes (Emil I4) ; au téléphone, un toucher suffit |
| 2026-11-22 | À partir de 900 px, Shoji Bento mène (deux rangées de haut, 480 px de large par `--shoji-width`), Gem Clip et Snooze Button empilés à côté | Critique de Codex n° 2 : trois cartes égales faisaient « modèle de portfolio » et laissaient Snooze dans une grande scène vide. Variable documentée par le composant ; le composant lui-même est inchangé |
| 2026-11-22 | Hauteurs de scène fixes, réglées sur la largeur de la carte (requêtes de conteneur) : Gem Clip 184 / 160 / 136 / 112 px selon que la commande tient sur 4, 3, 2 ou 1 ligne ; Shoji 256 puis 296 px dès 336 px de carte | Rien ne bouge quand les composants arrivent ; mesuré de 320 à 1440 px (test « chaque composant tient dans sa scène ») ; Codex n° 2 au second tour |
| 2026-11-22 | Liens : en ligne sous l'intro au téléphone ; en colonne de 280 px juste à droite du texte (680 px, 80 px d'écart), alignés sur la première ligne, dès 1100 px | Codex n° 5 : collés au bord droit, ils paraissaient sans lien avec l'intro |
| 2026-11-22 | Graphe : 26 semaines partout, carrés de 6 à 16 px ; sur grand écran, le texte sous la carte de Shoji et la grille sous les deux autres | 53 semaines montraient surtout du vide (activité depuis septembre) ; Codex n° 6 : bloc aligné sur la grille des cartes plutôt que perdu à gauche |
| 2026-11-22 | Clawd : grille `front` approuvée (22 × 16), 2 px par case (44 × 32) à côté de carrés de 12 px et plus, environ 1,5 px par case en pixels d'écran entiers au téléphone ; pas de cœur | Moitié de l'ancienne taille ; `front_small` est réservé aux tailles sous 24 px et ne cligne pas ; le cœur de l'autocollant est rouge `#ea4646`, une seconde couleur |
| 2026-11-22 | Plus mignon : salut au survol ou au toucher (visage `> <`, bras levé, petit rebond), marche réduite à 120 px | Mouvements documentés du skill clawd ; rares, donc dans le budget de plaisir d'Emil |
| 2026-11-22 | Les carrés du graphe ne s'animent plus (l'ancien remplissage point par point est supprimé) | Emil M2 : pas de mouvement décoratif sur des données qu'on lit |
| 2026-11-22 | Image de partage refaite depuis les grilles (`tools/make-clawd.py`) | L'ancienne montrait le théâtre |
| 2026-11-22 | `tools/test-clock.mjs` : horloge simulée installée une seconde avant l'instant voulu, puis arrêtée sur lui | Le test échouait 2 fois sur 3 en fin de mission (« Cannot fast-forward to the past ») quand quelques millisecondes passaient entre l'installation et l'arrêt ; 4 passages sur 4 ensuite |
| 2026-11-22 | `tools/measure-load.mjs` compte la page sans le paquet et le paquet à part, sans défilement ; les URL `data:` ne comptent plus | La vitrine se charge maintenant sans défilement ; les masques de l'impression des mots-clés ne sont pas des téléchargements |

## Mesures (téléphone 390 px, 150 ms d'aller-retour, 1,6 Mbit/s, cache vide, gzip, médiane de 7)
| | `main` | `refonte` |
| --- | --- | --- |
| Page (sans le paquet de la vitrine) | 157,6 Ko, 16 requêtes | 144,2 Ko, 12 requêtes |
| Premier affichage | 632 ms | 728 ms |
| Plus grand affichage | 1 048 ms | 968 ms |
| DOM prêt / `load` | 958 / 1 131 ms | 738 / 1 050 ms |
| Paquet de la vitrine | après défilement seulement | 77,8 Ko en 2 requêtes, composants à l'écran à 1 941 ms, sans défilement |

Le premier affichage recule de 96 ms ; la cause n'est pas isolée (CSS plus long de 6 Ko, impression des mots-clés). Position des cartes : la première carte commence à 567 px sur un téléphone 390 × 844 (avant : la vitrine à 965 px), 485 px à 1440 × 900 (avant : 950 px). Fichiers : `captures/refonte/measure-before.txt`, `measure-after.txt`.

## Assets
Budget : 0 génération. `img/share.png` redessinée en code depuis les grilles du skill clawd. `js/clawd-sprites.js` régénéré (18 poses).

## Critiques de Codex
Demandes, critiques et réponses dans `critiques/refonte-*.md`. Deux allers-retours, rien de bloquant.

| # | Gravité | Critique (résumé) | Réponse de Claude | Second tour |
| --- | --- | --- | --- | --- |
| 1 | majeure | L'intro passe encore avant les projets ; carte à 580 px au téléphone | Partiel : espacements resserrés (567 px) ; le texte de l'intro est le choix de Yann (la phrase ajoutée coûte environ 140 px, voir « Manques et limites ») ; titre de section gardé (convention du site : un mot-clé serif, une seule grande taille) | refus sur le texte : « reason holds » ; reste ouvert, décision de Yann |
| 2 | majeure | Trois cartes égales, petits composants perdus dans de grandes scènes | Partiel : Shoji mène sur grand écran ; au second tour, scènes de Gem Clip réglées sur la largeur (136 px à 390 px) au lieu d'une hauteur unique | bureau : fixed ; téléphone corrigé après le second tour |
| 3 | majeure | Bandes sous les mots-clés comme des soulignements de correcteur | Accepté : 4 px, éparses, 2 px sous le mot ; interligne 1,65 ; test de recouvrement | fixed |
| 4 | majeure | Points trop denses au pied des cartes et en bas de page | Accepté : densité plafonnée vers la moitié, champ de 56/72 px plus léger | fixed |
| 5 | majeure | Liens isolés au bord droit à 1440 px | Accepté : grille 680 / 80 / 280 px, alignés sur la première ligne, note sous Experiments | fixed |
| 6 | majeure | Graphe perdu à gauche avec un grand vide | Partiel : pas centré (page alignée à gauche) ; posé sur les deux colonnes des cartes | reason holds, fixed |
| 7 | mineure | Clawd trop grand au téléphone, légende détachée | Partiel : environ 1,5 px par case au téléphone, jour affiché par défaut, pastilles de la taille des carrés | fixed (visuellement) |

## Relecture du mouvement et du toucher d'après Emil (2026-11-22)
Fichiers lus : `review-animations/SKILL.md`, `review-animations/STANDARDS.md`, `animate/SKILL.md` (le skill installé), la checklist d'emil-craft et `wiki/hot.md`. Méthode : code, captures image par image au ralenti (×10, `captures/refonte/frames-fringe.png`), images de Clawd tirées de son horloge (`frames-clawd.png`), tests au clavier, au toucher simulé et en mouvement réduit. Carte de fréquence : points des cartes, quelques dizaines de fois par visite (survol) ; marche et salut de Clawd, rares ; impression des mots-clés et entrée, une fois.

| Avant | Après | Pourquoi | Règle | Preuve |
| --- | --- | --- | --- | --- |
| 1. `js/accent.js` : le focus clavier faisait monter les points en 280 ms | Au clavier, les points sont là tout de suite (`data-instant`, `transition: none`) ; après un clic ou un toucher, la transition reste | Pas de mouvement sur une action au clavier | M1, R2 | Observé (test : durée 0 s au focus clavier) |
| 2. `style.css` : montée et descente symétriques en 280 ms | Montée 220 ms sur la carte qu'on vise, descente 160 ms sur celle qu'on quitte, `--ease-out` fort | Survol fréquent : réduire ; la réponse du système est plus rapide | M5, M13, R3 | Observé (images au ralenti) |
| 3. `style.css` : la bande sous un mot-clé apparaissait d'un coup à la fin de son impression | Fondu de 240 ms quand l'impression finit | Éviter un changement brusque | M2 | Déduit |
| 4. Remplissage animé des carrés du graphe | Supprimé | Données qu'on lit | M2, R3 | Observé |

Tient : transitions (pas d'images clés), donc interruptibles (M11) ; `clip-path` et `opacity` seulement sur les points, Clawd déplacé par `transform` (P1) ; survol limité à la souris (`pointerType`, I1) ; mouvement réduit : les points se fondent sans monter, Clawd ne marche ni ne rebondit (A1, testé). **Décision : Approuver.** À vérifier sur un vrai téléphone : le toucher d'une carte pendant un glisser de Shoji, et la sensation de la montée des points.

## Critères de fin
- [x] Théâtre et code retirés (4 scripts, 2 images, CSS, balises, board, README, tests ; test « aucun script de scène chargé »)
- [x] Composants mis en avant (première carte à 567 px au téléphone, 485 px à 1440 px), essayés à la souris, au doigt et au clavier (tests)
- [x] Nouveau Clawd en place, grilles du skill clawd, plus petit, salut au survol ou au toucher
- [x] Le tramage ne recouvre aucun contenu (test de pixels sous les mots-clés ; bandes des cartes sous le lien et la scène ; champ du bas sous tout)
- [x] Captures 320, 390, 1440 px, clair, sombre, mouvement réduit, sans JavaScript : `captures/refonte/final/` (remplacées avant publication par `live-final/`, prises après les points vivants)
- [x] Aucune erreur dans la console, aucun défilement horizontal (captures et tests)
- [x] Tests : `node tools/test-showcase.mjs` (85 vérifications) et `node tools/test-clock.mjs` (39, rendu fiable) passent
- [x] `board.html` à jour (couleurs et contrastes mesurés, points orange, graphe, cartes, 18 poses)
- [x] Critique de Codex (deux tours) et relecture d'Emil (Approuver)
- [x] README et STATE.md à jour
- [ ] Publication : sur le mot « publish » de Yann seulement

## Captures
`captures/refonte/` : `before/` (état de départ, 390 et 1440 px), `maquettes/` (les trois directions), `review/` (envoyées à Codex), `live-final/` (`page-{320,390,1440}-{light,dark}[-reduced].png`, `page-*-nojs.png`, état final avec les points vivants), `frames-fringe.png`, `frames-clawd.png`, `sheet-final-phones.png`.

## Idées non retenues
- Le cœur de l'autocollant au salut de Clawd : rouge, une seconde couleur.
- Un champ de points fixé en bas de l'écran, comme dans la référence : il passerait sur le contenu en défilant.
- Le graphe centré sur grand écran (Codex) : la page est alignée à gauche partout.
- Titre de section plus grand (Codex) : le site garde une seule grande taille, l'intro.

## Manques et limites
- Intro au téléphone : la phrase ajoutée (version 1) coûte environ 140 px ; sans elle, la première carte serait à 428 px au lieu de 567 px sur un téléphone 390 × 844 (480 contre 654 px à 320). La version 2 est plus longue encore. Décision de Yann.
- Le paquet de la vitrine (77,8 Ko gzip) se charge maintenant à chaque visite, puisque la section est au premier écran.
- Premier affichage 96 ms plus tard que sur `main` (cause non isolée).
- Pas testé sur un vrai téléphone, dans Safari ou Firefox, ni avec un vrai lecteur d'écran.
- Le contraste de la pilule de Snooze sur fond sombre (1,39:1) reste celui du composant, comme avant.

# Mission « vitrine de composants » (2026-11-21)

## Brief
- But : une vitrine de trois composants d'Experiments, essayables sur place sans changer de page, pour montrer le savoir-faire de Yann.
- Décisions de Yann (entretien déjà fait) : Shoji Bento (`shoji-bento`), Gem Clip (`gem-clip`), Snooze Button (`snooze-button`) ; les vrais composants, à la souris, au doigt et au clavier, suivant le thème, chacun avec un lien vers sa page Experiments ; ils gardent leur apparence, le cadre et les textes suivent la direction du site.
- Contraintes : même code source qu'Experiments (commit noté, mise à jour simple) ; code chargé à l'approche de la section ; pas de build pour le reste du site ; Experiments non modifié ; aucune animation lancée toute seule ; mouvement réduit, clavier, focus, lecteurs d'écran ; sans JavaScript ou en cas d'échec, les trois liens restent ; échec de copie visible.
- Hors périmètre : la direction (inchangée), `.web-craft/` et `.web-craft-history/`. Phases 1 et 2 sautées à la demande de Yann.
- Budget d'images : 0 / 3 (aucune image générée).

## Fonctionnement
- `tools/showcase/build.mjs` télécharge les `.tsx` et `.css` des trois composants sur GitHub au commit voulu dans `tools/showcase/vendor/` (copies identiques, empreintes SHA-256 dans `SOURCE.json`), puis esbuild assemble `entry.tsx` (code du site), les composants et React 19.3.1 en `showcase/showcase.js` (237 Ko, 74,6 Ko gzip) et `showcase/showcase.css` (10,6 Ko, 2,7 Ko gzip). Ces deux fichiers sont commités : GitHub Pages les sert tels quels.
- `index.html` : la section en HTML simple (titre, nom, ligne, scène vide `data-demo`, lien). `js/showcase.js` (script classique, différé) attend l'événement `load`, puis que la section reste 250 ms à l'écran, ajoute la feuille et le script, appelle `showcase.mount()` qui crée une racine React par scène (`flushSync`, donc présents quand la classe `is-live` arrive). Échec ou 15 s sans réponse : classe `is-failed`, scènes masquées.
- `style.css` : section, scènes à hauteur fixe, marques de coupe, consignes par appareil, `touch-action: pan-y` sur les lignes de Shoji au toucher. `js/main.js` : l'impression des mots-clés se limite à `.intro .kw`.
- Commit d'Experiments utilisé : `6342f05fe81102c4d4e073e10c0c4f7d638dfd64` (2026-11-21, sur `main` d'Experiments depuis la publication), 8 expériences. Avant : `045eb20` (2026-11-09). Mise à jour : `cd tools/showcase && npm ci && node build.mjs latest` ; avant un push d'Experiments : `node build.mjs --from <clone local> <commit>`.

## Décisions
| Date | Décision | Raison |
| --- | --- | --- |
| 2026-11-21 | Paquet construit une fois par esbuild (`tools/showcase/`), fichiers construits commités, chargés à la demande | Même source qu'Experiments, commit noté, aucune étape de build pour le site ni pour GitHub Pages. Écartés : Babel dans le navigateur (~3 Mo, compilation chez chaque visiteur), esm.sh (service tiers à chaque visite), Preact (~55 Ko de moins mais ce n'est plus React : un défaut vu ici ne serait pas celui du composant) |
| 2026-11-21 | Copies des composants dans `vendor/`, vérifiées par empreinte à chaque reconstruction | Le code relu est visible dans le dépôt du site ; une retouche à la main y est refusée, elle doit se faire dans Experiments |
| 2026-11-21 | Format IIFE chargé par une balise `<script>`, pas un module | Le site reste en scripts classiques (décision du 2026-11-19) ; marche aussi en ouvrant `index.html` comme fichier |
| 2026-11-21 | Emplacement : dernière section, après le graphe ; en pleine largeur et trois colonnes à partir de 1280 px | L'ordre de lecture reste « qui je suis, où me trouver, le spectacle, mon activité », puis ce que je fabrique pour qui veut aller plus loin ; le premier écran (1440 × 900) ne change pas ; c'est la seule section chargée au défilement, elle doit être sous la ligne de flottaison ; les trois colonnes alignées (subgrid) laissent comparer |
| 2026-11-21 | Chargement quand la section arrive à l'écran (marge 0), après `load` et 250 ms de présence | Elle commence juste sous le premier écran partout (881 px sur un téléphone 390 × 844, 924 px à 1440 × 900) : toute marge la chargerait pour des visiteurs qui ne défilent pas. Juste après `load`, le graphe n'est pas encore dessiné (il attend ses données) et la section est brièvement visible : le délai évite ce faux départ (mesuré : chargée sans défilement avant le délai) |
| 2026-11-21 | Titre « Three components from my lab », « Three » en mot-clé serif ; noms en 17 px 500 ; lignes en 15 px | Même modèle que la ligne du graphe (17 px, un mot-clé serif) ; le site garde une seule grande taille, celle de l'intro |
| 2026-11-21 | Lignes : « A grid drawn with thin lines, like a paper screen. » / « A paper clip that copies the text it holds. Here it holds the command that downloads my whole lab. » / « A button with sleepy eyes. » ; consigne ajoutée seulement quand les composants sont là, en version souris ou toucher | Humanizer (une répétition de « copies » retirée) ; sans JavaScript, la ligne ne promet rien d'absent ; critique de Codex n° 1 et 3 |
| 2026-11-21 | Gem Clip copie `git clone https://github.com/yannworks/experiments.git`, affiché avec des points de coupure après les barres (`<wbr>`, prop `children` documentée) | La commande qui télécharge tout le labo : utile pour qui veut les composants ; sans coupure, l'URL se cassait au milieu d'un mot (« experiment / s.git ») |
| 2026-11-21 | Shoji Bento en taille `sm` avec les trois faits de l'aperçu d'Experiments (8 expériences, 2 fichiers, 0 dépendance) ; le nombre d'expériences vient du commit | Faits réels et vérifiables, comme sur la page d'accueil d'Experiments ; « A component here » devient « Each component » (hors d'Experiments, « here » était ambigu) |
| 2026-11-21 | Snooze Button en taille `lg`, « Press me », cycle factice « Working » puis « Done » | Le cycle fait vivre le composant au doigt (pas de survol) ; libellé qui ne promet aucun vrai contact, comme l'aperçu d'Experiments |
| 2026-11-21 | Couleurs des composants inchangées (pas de `--shoji-fg` ni `--gem-clip-fg` posés) | Décision de Yann : ils gardent leur apparence ; leurs neutres (#21201c sur #fdfdfc) sont presque ceux du site |
| 2026-11-21 | Scènes à hauteur fixe : 256 / 184 / 120 px au téléphone, 296 px sur grand écran ; marques de coupe de 1 px, bras de 8 px | Rien ne bouge quand les composants arrivent (mesuré) ; tailles ajustées au contenu le plus haut (commande sur quatre lignes à 320 px) après la critique de Codex ; marques de coupe : le vocabulaire de l'impression, déjà celui de l'encre et des mots-clés « imprimés » |
| 2026-11-21 | Au toucher, `touch-action: pan-y` sur les lignes de Shoji (adaptation côté site) | Le composant met `none` : un pouce posé sur une ligne bloquait le défilement. Conséquence : au doigt, la ligne horizontale ne se tire plus (la page défile) ; la verticale se tire de côté ; toucher une case réorganise tout |
| 2026-11-21 | Pas d'apparition animée de la section ni des composants | Motif banni « fondu à l'apparition au défilement » et consigne de Yann : rien ne bouge tout seul |
| 2026-11-21 | Contraste des composants corrigé dans Experiments, à la demande de Yann (« Yes, fix them ») : `--gem-clip-muted` 55 → 65 %, `--shoji-line` 18 → 52 %, survol 55 → 80 % ; vitrine reconstruite depuis ce commit | Note « Copied » 3,70 → 5,11:1, lignes de Shoji 1,44 → 3,41:1 (clair) et 1,58 → 5,05:1 (sombre), mesurés dans le board. La pilule de Snooze en sombre reste à 1,39:1 : son libellé (12,8:1) l'identifie |
| 2026-11-21 | Option `--from <clone>` dans `build.mjs` | Construire depuis un commit d'Experiments avant son push ; les fichiers et le numéro de commit sont les mêmes une fois poussé |
| 2026-11-21 | Tests dans `tools/test-showcase.mjs`, mesures dans `tools/measure-load.mjs` | Yann peut les relancer ; même méthode que `test-clock.mjs` |

## Mesures (téléphone 390 px, 150 ms d'aller-retour, 1,6 Mbit/s, cache vide, gzip, médiane de 9)
| | `main` | `showcase` |
| --- | --- | --- |
| Ouverture | 154,6 Ko, 16 requêtes | 157,6 Ko, 17 requêtes |
| DOM prêt | 913 ms | 917 ms |
| `load` | 1 093 ms | 1 117 ms |
| Plus grand affichage | 1 008 ms | 1 036 ms |
| Vitrine, après défilement | — | 77,8 Ko en 2 requêtes, composants à l'écran 844 ms après le défilement |

Le premier affichage mesuré passe de 932 à 580 ms sur la branche, de façon stable ; la cause n'est pas isolée, je ne la compte pas comme un gain. Fichiers : `captures/showcase/measure-before.txt`, `measure-after.txt`.

## Assets
Budget : 0 / 3 génération. Aucun asset ajouté.

## Critiques de Codex
Demandes, critiques et réponses dans `critiques/showcase-*.md`. Deux allers-retours.

| # | Gravité | Critique (résumé) | Réponse de Claude | Second tour |
| --- | --- | --- | --- | --- |
| 1 | majeure | Interactions peu signalées au téléphone | Partiel : consignes ajoutées quand les composants sont là, en version souris ou toucher ; cibles internes aux composants non modifiées (mesurées au-dessus de 24 px) | fixed |
| 2 | majeure | Scènes trop grandes pour les petits composants | Accepté : 256 / 184 / 120 px au téléphone, 296 px sur grand écran, 44 px entre les entrées (272 px aurait coupé Shoji) | fixed |
| 3 | majeure | Snooze : ce que fait l'appui n'est pas dit | Accepté : consigne qui annonce le cycle factice | fixed |
| 4 | mineure | Marques de coupe trop présentes | Partiel : bras de 12 à 8 px (6 px ressemblaient à des points isolés) | fixed |
| 5 | mineure | Trois liens identiques | Refusé : chaque lien suit le nom de son composant, les lecteurs d'écran ont des noms distincts, cible d'environ 27 px | reason holds |
| 6 | mineure | Titre faible, « Try three components » | Refusé : faux sans JavaScript ; hiérarchie du site à une seule grande taille | reason holds |

## Relecture du mouvement et du toucher d'après Emil (2026-11-21)
Fichiers lus : `review-animations/SKILL.md`, la checklist d'emil-craft (règles M, I, P, A), `emil-design-eng/SKILL.md` en référence. Méthode : code, vidéos en temps réel, tests au toucher simulé (CDP), clavier et mouvement réduit dans Chrome. Carte de fréquence : section vue une fois par visite, chaque interaction rare et volontaire.

| Avant | Après | Pourquoi | Règle | Preuve |
| --- | --- | --- | --- | --- |
| 1. Shoji `.shoji__line { touch-action: none }` (composant) | `pan-y` au toucher, côté site (`style.css`) | Un glisser vertical commencé sur une ligne bloquait la page | I9, I11 | Observé (test : défilement de 100 px et plus depuis la ligne ; glisser latéral toujours actif) |
| 2. Shoji : le glisser change `width`, `height` des cases à chaque image (composant) | Gardé, signalé | Assumé par le README d'Experiments à cette échelle ; non modifiable ici | P1 | Déduit |
| 3. Ressorts de Shoji au-delà de 300 ms (composant) | Gardé | Interruptibles, rien n'attend dessus (README) | M5, M11 | Déduit |
| 4. Le site n'ajoute aucun mouvement : pas d'entrée, pas de fondu au défilement | — | Rien ne bouge tout seul (test : aucune mutation pendant 2 s) | M2 | Observé |

Clavier sans animation (Shoji saute, Gem Clip et Snooze passent en `instant`) : M1 respecté, observé. Survol limité à la souris dans les trois composants : I1, déduit du code. Mouvement réduit : Shoji prend sa place d'un coup (testé), Gem Clip ne voyage plus, Snooze ne roule plus les yeux (code). **Décision : Approuver.** À vérifier sur un vrai téléphone : le glisser latéral de Shoji et le défilement depuis une ligne, au pouce.

## Critères de fin
- [x] États : chargé, en chargement (scènes vides à hauteur fixe), échec, sans JavaScript (tests, board)
- [x] Captures à 320, 390 et 1440 px, clair et sombre, mouvement normal et réduit, et sans JavaScript (`captures/showcase/`)
- [x] Vidéos en temps réel de chaque interaction (`captures/showcase/video-*.mp4`)
- [x] Poids et temps de chargement avant et après (tableau ci-dessus)
- [x] Rien d'autre n'a changé : `node tools/test-showcase.mjs` (59 vérifications) et `node tools/test-clock.mjs` passent ; aucune erreur dans la console, pas de défilement horizontal à 320, 390, 1440, scène, horloge, graphe, thèmes et fondu vérifiés ; contraste du site inchangé (encre sur papier)
- [x] Relecture d'Emil : Approuver
- [x] Critique de Codex traitée (deux tours, rien de bloquant)
- [x] Textes passés au humanizer
- [x] Vitrine dans `board.html` (section vivante, état sans JavaScript, contraste mesuré des composants)

## Publication
- 2026-11-21, sur le mot « publish » de Yann. Experiments d'abord : `fix/contrast` poussée et `main` avancée jusqu'à `6342f05` (même commit), déploiement réussi, couleurs vérifiées en ligne (lignes 52 %, note 65 %, aucune erreur). Site ensuite : aucun commit de l'Action sur `main` depuis `616d8ec` ; `showcase` fusionnée (`ab2f363`), poussée vers 10:12 UTC, build GitHub Pages réussi.
- Vérifié en ligne (https://yannworks.github.io/?v=2) dans Chrome avec Playwright à 11:13 heure de Paris, à 390 px (tactile) et 1440 px : paquet non chargé avant le défilement, composants montés après (commit `6342f05`), copie de la commande `git clone` dans le presse-papiers, Snooze lancé d'un tap, scène, horloge et graphe actifs, aucune erreur dans la console, pas de défilement horizontal. Capture : `captures/showcase/live-390.png`.

## Captures et vidéos
`captures/showcase/` (2026-11-21, branche `showcase`) :
- `page-{320,390,1440}-{light,dark}-{normal,reduced}.png` et `page-{320,390,1440}-nojs.png` : pages entières (téléphones en émulation tactile).
- `section-…` : la section seule, mêmes variantes.
- `video-shoji-bento.mp4`, `video-gem-clip.mp4`, `video-snooze-button.mp4` (760 × 520, souris dessinée), `video-phone-touch.mp4` (390 × 700, doigt dessiné : glisser latéral, défilement depuis une ligne, appui sur Snooze). Enregistrées en temps réel par Chrome.
- `frames-shoji-gem.png`, `frames-snooze.png` : images extraites des vidéos ; `board-showcase.png` : la section du board.
- `measure-before.txt`, `measure-after.txt`.

## Idées non retenues
- Une image fixe de secours dans chaque scène : les liens suffisent, budget d'images à 0.
- Preact à la place de React : 55 Ko de moins, mais un autre moteur que celui des composants.

## Manques et limites
- Contraste des composants : corrigé dans Experiments (voir Décisions), tout passe dans le board sauf la pilule de Snooze sur fond sombre (1,39:1), gardée car son libellé l'identifie. La correction n'est en ligne qu'après le push d'Experiments.
- Au doigt, la ligne horizontale de Shoji ne se tire plus (la page défile) : conséquence voulue de `pan-y`.
- Captures Playwright : en pleine page ou par élément, Chrome oublie l'émulation tactile (consignes souris affichées) ; les captures de téléphone sont donc prises avec une fenêtre aussi haute que la page.
- Vidéos en pixels CSS (L13) : nettes mais petites.
- Pas testé sur un vrai iPhone ni avec un vrai lecteur d'écran (noms, rôles et annonces vérifiés dans le DOM).
- Le premier défilement sur réseau lent montre les scènes vides environ 0,8 s.

# Mission « heure locale » (2026-11-21, publiée)

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
