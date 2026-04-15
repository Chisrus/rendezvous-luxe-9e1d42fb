

# Plan d'optimisation complète de RencontreDeLuxe

Voici toutes les modifications identifiées pour avoir une plateforme optimale, classées par priorité.

---

## 1. Authentification et Sécurité

- **Mot de passe oublié** : Ajouter un lien "Mot de passe oublié" sur la page Auth + créer une page `/reset-password` pour réinitialiser le mot de passe
- **Création automatique de profil à l'inscription** : Ajouter un trigger SQL `on_auth_user_created` qui crée automatiquement une entrée dans `profiles` avec le nom tiré de l'email. Actuellement un utilisateur inscrit n'a pas de profil, ce qui casse la logique de messagerie (car `id !== created_by`)
- **Redirection intelligente** : Après login, rediriger vers `/profiles` si déjà connecté quand on visite `/auth`

## 2. Profil utilisateur

- **Page "Mon Profil"** : Permettre à un vrai utilisateur de modifier son nom, photo, bio, ville, age, genre, centres d'intérêt depuis une page `/profile/edit`
- **Upload de photo de profil** pour les vrais utilisateurs (via le bucket `profile-photos` existant)
- **RLS pour les vrais utilisateurs** : Ajouter une policy permettant à un utilisateur de modifier son propre profil (`UPDATE WHERE id = auth.uid()`)

## 3. Navigation et UX

- **Navbar partagée** : Créer un composant `UserNavbar` réutilisable (actuellement le header est dupliqué dans Profiles, Inbox et potentiellement d'autres pages)
- **Page notifications utilisateur** : Ajouter une page `/notifications` listant toutes les notifications reçues (actuellement seul le toast temps réel existe, pas d'historique consultable)
- **Ne pas marquer automatiquement les notifications comme lues** dans le `NotificationListener` — laisser l'utilisateur les marquer manuellement depuis la page notifications
- **Navigation mobile responsive** : Ajouter un menu hamburger pour les utilisateurs sur mobile (la nav actuelle déborde sur petit écran)
- **Bouton "Retour" cohérent** dans l'inbox sur mobile

## 4. Messagerie

- **Rafraîchir la liste des conversations** après envoi d'un message (actuellement la liste ne se met pas à jour en temps réel)
- **Scroll automatique** vers le bas quand un nouveau message arrive dans l'inbox
- **Indicateur "en train d'écrire"** (optionnel, amélioration UX)
- **Message vide impossible** : Désactiver le bouton envoyer quand le champ est vide (déjà fait côté admin, manque côté inbox)

## 5. Admin

- **Statistiques dashboard** : Ajouter un aperçu sur la page admin — nombre de profils, nombre d'utilisateurs réels, nombre de messages, nombre de notifications envoyées
- **Recherche/filtre dans la liste des profils admin** quand il y en a beaucoup
- **Confirmer avant suppression** d'un profil (dialogue de confirmation)

## 6. Landing Page et SEO

- **Meta tags** : Ajouter title, description, Open Graph pour le partage sur les réseaux sociaux
- **Polices Google Fonts** : Charger Playfair Display correctement (actuellement référencé en CSS inline mais pas importé — risque de fallback)
- **Liens footer fonctionnels** : Les liens Conditions, Confidentialité, Contact pointent vers `#` — créer au moins des pages statiques basiques
- **Favicon** personnalisé au lieu du défaut Vite

## 7. Performance et Qualité

- **Lazy loading des routes** : Utiliser `React.lazy` + `Suspense` pour les pages Admin, Inbox, etc.
- **Limiter les requêtes** : La page Profiles charge TOUS les profils sans pagination — ajouter une pagination ou un infinite scroll
- **Images optimisées** : Ajouter `loading="lazy"` sur les images de profil dans la grille

## 8. Sécurité additionnelle

- **AntiScreenshot** : Le composant blur-on-focus est très agressif (blur quand on change d'onglet) et dégrade l'UX sans vraie protection. Envisager de le rendre configurable ou de le retirer
- **Validation côté serveur** des données de profil (longueur du nom, âge valide, etc.) via une fonction de validation trigger

---

## Résumé des priorités

| Priorité | Modification | Impact |
|----------|-------------|--------|
| Critique | Trigger auto-création profil à l'inscription | Sans ça, les vrais users n'apparaissent pas dans la messagerie admin |
| Critique | Page réinitialisation mot de passe | Fonctionnalité de base manquante |
| Haute | Page "Mon Profil" éditable | Les users ne peuvent pas personnaliser leur profil |
| Haute | RLS update pour propre profil | Sécurité |
| Haute | Navbar partagée + responsive mobile | UX dégradée sur mobile |
| Haute | Page historique notifications | Les notifs disparaissent après le toast |
| Moyenne | Dashboard stats admin | Visibilité pour l'admin |
| Moyenne | Pagination profils | Performance |
| Moyenne | Confirmation suppression | Prévention d'erreur |
| Basse | Meta tags / SEO / favicon | Présence en ligne |
| Basse | Lazy loading routes | Performance |

---

Souhaitez-vous que j'implémente tout d'un coup, ou voulez-vous prioriser certains points ?

