# yannworks.github.io : état

Skill : site-studio (missions ciblées sur un site existant). Mis à jour : 2026-11-21. Dernière mission : vitrine de composants, publiée le 2026-11-21.

Les missions précédentes (page et théâtre, puis graphe de contributions) sont décrites dans `.web-craft-history/2026-11-19-site/` et `.web-craft/`, deux archives à laisser telles quelles. Ce fichier suit les missions à partir de l'heure locale, la plus récente en haut.

## Prochaine action
Aucune pour la vitrine : mission terminée et publiée. Reste à essayer les composants sur un vrai téléphone (voir « Manques et limites »).

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
