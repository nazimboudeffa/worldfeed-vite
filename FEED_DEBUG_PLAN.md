# Plan de Travail : Débogage du Flux de Données RSS (Feed Data Source Debugging)

**Objectif principal :** Identifier la cause de l'affichage "No news available" pour le panel d'actualités, en se concentrant sur la fiabilité des sources et gérant les problèmes potentiels liés aux données ou au proxy.

---

### 🚀 Tâches Prioritaires (HIGH PRIORITY)
Ces étapes doivent être exécutées en premier car elles touchent au cœur de l'échec du flux d'informations.

1.  **Analyser la source de données des feeds (`src/services/rss.ts`) :**
    *   Vérifier que les URLs sources RSS sont accessibles et valides.
    *   Identifier si une source spécifique liée à l'Algérie ou au Moyen-Orient est configurée, et s'assurer qu'elle fonctionne correctement (accès réseau).

2.  **Rechercher la configuration Proxy/Réseau :**
    *   Scanner tout le code base (`src/*`) pour détecter toute utilisation de variables d'environnement ou de fonctions gérant explicitement les proxys HTTP/HTTPS.
    *   Examiner `src/services/rss.ts` spécifiquement pour déterminer si un mécanisme de proxy est en place, manquant, ou mal configuré (ex: besoin d'un *proxy-agent*).

### 🛠️ Tâches Intermédiaires (MEDIUM PRIORITY)
Ces étapes améliorent la résilience et le diagnostic du système.

3.  **Tester la robustesse du parsing RSS (`src/services/rss.ts`) :**
    *   Valider les gestionnaires d'erreurs (`try...catch` / `getValidDate`) pour garantir que même si une source XML est mal formée ou si les dates sont incohérentes, le processus ne plante pas et continue à récupérer des données des sources fonctionnelles.

4.  **Vérifier l'appel de données (Orchestration) :**
    *   Déterminer dans quel composant (`App.ts` / panneau parent) les feeds sont consommés et comment ils appellent `fetchCategoryFeeds`. Assurer que la logique d'envoi des requêtes est correcte.

### 🧪 Tâche à Long Terme (LOW PRIORITY)
Une fois le problème de fonctionnement identifié, cette tâche vise à prévenir sa réapparition.

5.  **Planification des tests unitaires/intégration :**
    *   Créer ou adapter un jeu de tests pour simuler des cas de défaillance réseau ou des données XML invalides, afin de valider la logique de *fallback* développée dans les étapes ci-dessus.

---
**Statut Actuel:** En cours (In Progress)
```
file_path:./FEED_DEBUG_PLAN.md