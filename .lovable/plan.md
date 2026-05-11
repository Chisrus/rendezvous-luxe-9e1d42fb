
# Leviers de conversion vers l'abonnement

Idées concrètes à ajouter à RencontreDeLuxe pour transformer les visiteurs en abonnés payants. Classées par impact attendu vs effort.

---

## 1. Friction stratégique sur les actions clés (impact très élevé)

Aujourd'hui un utilisateur connecté peut liker et envoyer des messages librement. C'est le plus gros frein à la conversion.

- **Quota gratuit visible** : 3 messages / 5 likes offerts, puis paywall ("Vous avez utilisé 3/3 messages gratuits — passez Premium").
- **Messages flous côté destinataire non abonné** : il voit qu'il a reçu un message, mais le contenu est flouté avec CTA "Débloquez vos messages".
- **"Voir qui m'a liké"** réservé aux abonnés Premium / VIP (page existante mais teasée avec compteur : "3 personnes vous ont liké cette semaine").
- **Filtres avancés** (ville, âge, intérêts) verrouillés pour le plan gratuit.

## 2. Preuve sociale et urgence (impact élevé, effort faible)

- **Bandeau d'activité en direct** sur le hero et /profiles : "Aïcha vient de rejoindre Premium", "12 nouveaux profils VIP cette semaine" (rotation toutes les 5s).
- **Compteur "X membres en ligne maintenant"** dans la navbar.
- **Badge "Vu récemment"** sur les profils débloqués pour donner un sentiment de vivacité.
- **Témoignages / success stories** sur la landing (2–3 cartes avec photo floutée + prénom + ville).
- **Offre limitée** : bandeau "−30% sur Premium pendant 48h" avec compte à rebours pour les nouveaux inscrits.

## 3. Onboarding orienté conversion (impact élevé)

- **Écran de bienvenue après inscription** présentant immédiatement les 3 plans avec un focus sur Premium.
- **Email de bienvenue** (via edge function) listant ce qui est verrouillé + CTA Wave.
- **Barre de progression du profil** ("Profil complété à 60% — devenez VIP pour être mis en avant").
- **Suggestion de matchs premium** dès la première connexion : 3 profils ultra qualifiés visibles flous = "Débloquez pour découvrir".

## 4. Page Abonnement enrichie (impact moyen, effort faible)

- **Tableau comparatif détaillé** Découverte / Premium / VIP (likes, messages, filtres, mise en avant, etc.).
- **FAQ paiement** (Wave, sécurité, annulation, remboursement).
- **Garantie satisfait** : "7 jours pour changer d'avis".
- **Témoignage encart** sous chaque plan ("Marie, Premium depuis 3 mois — 12 matchs").
- **Badge "Le plus choisi"** déjà sur Premium → ajouter "Économie de X%" sur l'annuel (si on introduit un cycle annuel).

## 5. Mécaniques d'engagement payantes (impact moyen)

- **Boost de profil** : achat unique pour apparaître en haut pendant 24h (visible sur la carte profil).
- **Super Like** : 1 par jour gratuit, pack de 10 payant ou inclus VIP.
- **Lecture confirmée** des messages réservée aux abonnés.
- **Mode invisible / navigation anonyme** réservé VIP.
- **Cadeaux virtuels** (rose, diamant) à offrir pendant un chat.

## 6. Notifications de relance (impact moyen)

- **Notif "Quelqu'un vous a liké"** envoyée à l'utilisateur gratuit → CTA pour découvrir qui (paywall).
- **Notif "Match potentiel détecté"** basée sur intérêts communs → réservé Premium.
- **Email de réactivation** après 7 jours d'inactivité avec offre.
- **Push toast** au 3e message envoyé : "Vous êtes populaire — passez Premium pour répondre sans limite".

## 7. Gamification (impact moyen, effort plus élevé)

- **Niveau de profil** (Bronze / Argent / Or) selon complétude + activité, débloqué à fond uniquement avec abonnement.
- **Défis hebdomadaires** ("Likez 10 profils cette semaine pour gagner un Super Like").
- **Programme parrainage** : 1 mois Premium offert pour chaque ami inscrit + abonné.

## 8. Confiance et premium feel (impact moyen)

- **Page "Vérification d'identité"** (mise en avant du badge vérifié déjà existant) — réservé Premium/VIP.
- **Concierge VIP** : formulaire de demande personnalisée visible uniquement pour VIP.
- **Événements privés** : page /evenements listant des soirées exclusives, accessible aux abonnés.

---

## Détails techniques

- Quotas : table `usage_limits (user_id, action, count, period_start)` avec RPC `check_and_increment(action)` côté Supabase. RLS user_id = auth.uid().
- Tier abonné : table `subscriptions (user_id, plan, status, current_period_end)`, mise à jour manuelle par admin (Wave étant externe) + RPC `is_subscribed(user_id, min_plan)` security definer.
- Paywall composant `<PaywallGate plan="premium">` réutilisable autour des actions sensibles (like > quota, envoi message, filtres).
- Bandeau d'activité : table `activity_feed` + Realtime, ou fake côté client (rotation d'un tableau prédéfini) pour démarrer.
- Compte à rebours d'offre : stocké en localStorage à la première visite (48h fixes).
- Boost / Super Like : champs `boosted_until`, `super_likes_remaining` sur `profiles`.
- Programme parrainage : code unique sur `profiles.referral_code`, table `referrals`.

---

## Recommandation de priorisation

| Priorité | Action | Pourquoi |
|----------|--------|----------|
| Très haute | Quotas messages + likes avec paywall | Lève le frein principal à la monétisation |
| Très haute | "Voir qui m'a liké" verrouillé + teaser compteur | Curiosité = premier déclencheur d'achat |
| Haute | Bandeau activité + compteur membres en ligne | Crée la sensation de plateforme vivante |
| Haute | Onboarding écran abonnement + email bienvenue | Capte l'utilisateur au moment le plus chaud |
| Haute | Tableau comparatif + FAQ sur la page tarifs | Lève les dernières objections |
| Moyenne | Boost / Super Like / Mode invisible | Revenus additionnels après acquisition |
| Moyenne | Notifs de relance et email réactivation | Récupère les utilisateurs dormants |
| Moyenne | Gamification (niveaux, défis) | Engagement long terme |
| Basse | Parrainage / Concierge / Événements | Acquisition virale + premium feel |

---

Souhaitez-vous que je parte sur le **Top 3 très haute priorité** (quotas + paywall, "qui m'a liké" verrouillé, bandeau d'activité) ou que je vous laisse choisir un sous-ensemble précis ?
