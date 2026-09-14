PROJET : PLATEFORME DE SOURCING CHINE → SÉNÉGAL



1\. CONTEXTE



Nous voulons créer une plateforme professionnelle permettant aux particuliers, revendeurs, commerçants et petites entreprises sénégalaises d’acheter des produits auprès de fournisseurs en Chine, notamment via Alibaba et 1688.



Notre entreprise doit prendre en charge une grande partie du processus :



Recherche → Sourcing → Devis → Commande → Paiement → Contrôle qualité → Consolidation → Fret Chine → Sénégal → Livraison



Nous disposons déjà d’un partenaire freight forwarder en Chine.



L’objectif n’est PAS de créer un simple site e-commerce.



Nous voulons construire une plateforme de sourcing et de gestion d’importation Chine → Sénégal, capable d’évoluer vers une véritable infrastructure technologique.



\---



2\. OBJECTIFS DU PRODUIT



La plateforme doit permettre :



Pour le client



\- Créer un compte.

\- Envoyer un lien Alibaba/1688.

\- Envoyer une photo d’un produit.

\- Décrire le produit recherché.

\- Indiquer quantité, couleur, taille, variantes, budget, etc.

\- Recevoir un devis.

\- Accepter/refuser le devis.

\- Effectuer le paiement.

\- Suivre sa commande en temps réel.

\- Voir les différentes étapes logistiques.

\- Recevoir des photos de contrôle qualité.

\- Consulter ses factures et commandes.

\- Recevoir des notifications.

\- Contacter le support.



Pour l'équipe



\- Gérer les clients.

\- Gérer les demandes de sourcing.

\- Rechercher et enregistrer les fournisseurs.

\- Créer des devis.

\- Calculer les coûts.

\- Gérer les commandes.

\- Suivre les paiements.

\- Gérer les marchandises reçues en Chine.

\- Organiser la consolidation.

\- Gérer les expéditions.

\- Mettre à jour les statuts.

\- Gérer les livraisons au Sénégal.

\- Gérer les litiges.

\- Calculer les marges.

\- Produire des statistiques.



\---



3\. PRINCIPLE ARCHITECTURAL



Construire le système comme un produit SaaS/logistique moderne, avec séparation claire entre :



\- Frontend client

\- Backend/API

\- Base de données

\- Stockage de fichiers

\- Authentification

\- Paiements

\- Notifications

\- Administration

\- Services logistiques

\- Analytics



Ne pas construire un monolithe fragile.



L'architecture doit être suffisamment simple pour être maintenable par une petite équipe, mais suffisamment solide pour évoluer vers des dizaines de milliers d'utilisateurs.



\---



4\. STACK TECHNIQUE RECOMMANDÉE



Utiliser des technologies modernes, largement adoptées et maintenables.



Frontend Web



Next.js + TypeScript



Utiliser :



\- Next.js avec App Router

\- TypeScript strict

\- React

\- Tailwind CSS

\- composants UI accessibles

\- React Hook Form

\- Zod

\- TanStack Query lorsque pertinent



Le site doit être :



\- responsive

\- rapide

\- accessible

\- SEO-friendly

\- optimisé mobile

\- compatible avec les navigateurs modernes.



\---



5\. APPLICATION MOBILE



Ne pas commencer obligatoirement par deux applications natives.



Prévoir une architecture permettant de développer ensuite :



React Native + Expo



ou une autre solution cross-platform sérieuse.



Priorité initiale :



Web responsive / PWA



Puis application mobile lorsque le volume de clients le justifie.



\---



6\. BACKEND



Utiliser :



NestJS + TypeScript



avec une architecture modulaire.



Modules prévus :



auth

users

customers

sourcing

suppliers

quotes

orders

payments

quality-control

warehouse

shipments

delivery

notifications

support

documents

pricing

analytics

admin

audit



Le backend doit exposer une API propre et documentée.



Utiliser :



\- REST API

\- OpenAPI / Swagger

\- DTOs

\- validation stricte

\- guards

\- RBAC

\- logging

\- gestion centralisée des erreurs.



Prévoir GraphQL uniquement si un besoin réel apparaît.



\---



7\. BASE DE DONNÉES



Utiliser :



PostgreSQL



avec :



Prisma ORM



Principes :



\- migrations versionnées

\- foreign keys

\- contraintes d'intégrité

\- indexes

\- transactions

\- soft delete lorsque nécessaire

\- timestamps

\- UUIDs

\- auditabilité des opérations importantes.



Ne jamais stocker des données sensibles inutilement.



\---



8\. AUTHENTIFICATION



Mettre en place une authentification robuste.



Supporter :



\- téléphone

\- email

\- mot de passe

\- OTP lorsque pertinent

\- récupération de compte

\- vérification email/téléphone.



Prévoir MFA pour les comptes administrateurs.



Les administrateurs doivent bénéficier d'une sécurité beaucoup plus stricte que les comptes clients.



Ne jamais stocker les mots de passe en clair.



Utiliser un algorithme moderne de hashing adapté.



\---



9\. AUTORISATION



Implémenter un véritable RBAC.



Exemples :



CUSTOMER

SUPPORT\_AGENT

SOURCING\_AGENT

LOGISTICS\_AGENT

QUALITY\_CONTROL

FINANCE

MANAGER

ADMIN

SUPER\_ADMIN



Chaque rôle doit disposer uniquement des permissions nécessaires.



Principe :



Least Privilege



Aucun utilisateur ne doit pouvoir accéder à des données ou opérations qui ne sont pas nécessaires à son rôle.



\---



10\. MODULE CLIENT



Dashboard :



Bonjour \[Prénom]



Mes commandes

Mes demandes de devis

Mes paiements

Mes documents

Mes notifications

Support



Créer une UX extrêmement simple.



Le client doit pouvoir commencer une commande en quelques secondes.



CTA principal :



"Je veux acheter un produit"



\---



11\. CRÉATION D'UNE DEMANDE



Le client doit pouvoir choisir :



Option A



Coller un lien Alibaba/1688.



Option B



Uploader une photo.



Option C



Décrire ce qu'il recherche.



Formulaire :



Produit

Lien

Photo

Quantité

Couleur

Taille

Variantes

Budget

Destination

Commentaires



Après soumission :



DEMANDE REÇUE



Notre équipe analyse votre demande.



Statut :

🟡 En analyse



\---



12\. SOURCING



Créer un espace interne permettant aux agents de :



\- rechercher les fournisseurs

\- enregistrer leurs informations

\- comparer les prix

\- comparer les MOQ

\- noter les fournisseurs

\- enregistrer les conversations

\- enregistrer les liens

\- enregistrer les performances historiques.



Créer un système interne de :



Supplier Score



Critères possibles :



Prix

MOQ

Historique

Qualité

Délais

Réactivité

Taux de problème



\---



13\. SYSTÈME DE DEVIS



Créer un moteur de calcul.



Exemple :



Prix produit

\+

Transport intérieur Chine

\+

Frais fournisseur éventuels

\+

Contrôle qualité

\+

Consolidation

\+

Fret international

\+

Autres coûts applicables

\+

Frais de service

=

TOTAL CLIENT



Le système doit conserver :



\- coût réel

\- prix client

\- marge

\- frais

\- devise

\- taux de change utilisé

\- date du devis.



Chaque devis doit avoir :



QUOTE-2026-000001



et une durée de validité.



\---



14\. TRANSPARENCE DU PRIX



Le client doit pouvoir comprendre le devis.



Exemple :



Produit                 75 000 FCFA

Transport Chine          5 000 FCFA

Contrôle qualité         3 000 FCFA

Fret                    35 000 FCFA

Service                  10 000 FCFA

\-----------------------------------

TOTAL                   128 000 FCFA



Ne jamais présenter un prix calculé avec des hypothèses cachées.



Afficher clairement les éléments estimatifs.



\---



15\. COMMANDES



Lorsqu'un devis est accepté :



QUOTE

&#x20;  ↓

ACCEPTED

&#x20;  ↓

PAYMENT

&#x20;  ↓

ORDER CREATED



Créer un numéro unique :



ORD-2026-000001



Statuts :



QUOTE\_PENDING

QUOTE\_SENT

QUOTE\_ACCEPTED

PAYMENT\_PENDING

PAID

ORDERED

SUPPLIER\_PROCESSING

READY\_FOR\_SHIPMENT

AT\_CHINA\_WAREHOUSE

QUALITY\_CHECK

CONSOLIDATED

SHIPPED

IN\_TRANSIT

ARRIVED\_SENEGAL

CUSTOMS\_PROCESSING

READY\_FOR\_DELIVERY

OUT\_FOR\_DELIVERY

DELIVERED

COMPLETED

CANCELLED

DISPUTED



Les transitions de statut doivent être contrôlées côté backend.



\---



16\. PAIEMENTS



Ne jamais construire notre propre système bancaire.



Intégrer des prestataires de paiement fiables et adaptés au Sénégal.



Architecture :



Payment Provider

&#x20;      ↓

Webhook

&#x20;      ↓

Backend

&#x20;      ↓

Payment Verification

&#x20;      ↓

Order Status Update



IMPORTANT :



Ne jamais faire confiance uniquement au frontend pour confirmer un paiement.



Le backend doit vérifier les paiements via webhook/API du prestataire.



Prévoir :



\- idempotency

\- transaction IDs

\- payment status

\- refund status

\- reconciliation

\- logs.



\---



17\. LOGISTIQUE CHINE



Créer un module warehouse/logistics.



Lorsqu'une marchandise arrive :



Shipment received

↓

Warehouse check

↓

Photos

↓

Quantity verification

↓

Quality control

↓

Consolidation

↓

Shipping



Chaque colis doit avoir un identifiant.



Exemple :



PKG-2026-000321



\---



18\. CONTRÔLE QUALITÉ



Créer un module permettant à l'équipe chinoise de :



\- prendre des photos

\- uploader des vidéos si nécessaire

\- confirmer les quantités

\- vérifier les variantes

\- signaler un problème

\- ajouter des commentaires.



Le client peut voir les éléments autorisés par notre politique de service.



\---



19\. TRACKING



Créer une timeline visuelle.



Exemple :



✓ Commande confirmée

✓ Paiement reçu

✓ Fournisseur contacté

✓ Produit préparé

✓ Arrivé en Chine

✓ Contrôle qualité

✓ Consolidation

● Expédition internationale

○ Arrivée Sénégal

○ Livraison



Le client doit comprendre immédiatement où se trouve sa commande.



\---



20\. NOTIFICATIONS



Créer un service centralisé de notifications.



Canaux :



\- WhatsApp

\- Email

\- Push notification

\- SMS si nécessaire.



Événements :



Devis disponible

Paiement confirmé

Commande passée

Produit arrivé en Chine

Contrôle qualité disponible

Expédition effectuée

Arrivée au Sénégal

Livraison prévue

Commande livrée



Prévoir des préférences de notification.



\---



21\. ADMIN DASHBOARD



Créer un dashboard professionnel.



Sections :



Overview

Customers

Sourcing

Suppliers

Quotes

Orders

Payments

Warehouse

Quality Control

Shipments

Delivery

Support

Finance

Analytics

Users

Roles

Audit Logs

Settings



Dashboard avec :



\- chiffre d'affaires

\- commandes

\- marge

\- commandes en cours

\- demandes de sourcing

\- taux de conversion

\- clients actifs

\- problèmes/logistiques

\- délais moyens.



\---



22\. FINANCE



Créer un système interne de suivi financier.



Pour chaque commande :



Revenue

Product Cost

China Shipping

International Freight

Other Costs

Service Fee

Gross Margin



Ne jamais exposer les marges internes au client sauf décision commerciale explicite.



Prévoir exports CSV/Excel pour la comptabilité.



\---



23\. DOCUMENTS



Gérer :



\- devis

\- factures

\- reçus

\- documents logistiques

\- preuves de paiement

\- photos de contrôle.



Utiliser un stockage objet sécurisé.



Les documents ne doivent pas être publiquement accessibles par défaut.



Utiliser des URLs temporaires/signées lorsque nécessaire.



\---



24\. SÉCURITÉ



La sécurité est une priorité absolue.



Mettre en place au minimum :



Application



\- HTTPS

\- validation serveur

\- protection XSS

\- protection CSRF lorsque pertinente

\- protection SQL injection via ORM/requêtes paramétrées

\- rate limiting

\- brute-force protection

\- headers de sécurité

\- CORS strict

\- gestion sécurisée des sessions/tokens

\- secrets dans Secret Manager / variables sécurisées

\- aucun secret dans Git.



API



\- authentication

\- authorization

\- RBAC

\- validation DTO

\- rate limiting

\- request size limits

\- audit logs.



Infrastructure



\- backups automatisés

\- monitoring

\- alertes

\- logs centralisés

\- principe du moindre privilège

\- séparation dev/staging/production.



\---



25\. PROTECTION DES DONNÉES



Collecter uniquement les données nécessaires.



Prévoir :



\- politique de confidentialité

\- suppression de compte

\- export des données lorsque nécessaire

\- conservation limitée des données

\- contrôle des accès internes.



Les données clients ne doivent jamais être accessibles à toute l'équipe.



\---



26\. AUDIT LOG



Toute opération sensible doit pouvoir être retracée.



Exemple :



ADMIN USER

↓

Changed quote

↓

From: 125,000 FCFA

↓

To: 130,000 FCFA

↓

Date

↓

IP / metadata appropriée



Journaliser notamment :



\- modification de prix

\- remboursement

\- changement de statut sensible

\- changement de permissions

\- accès administrateur important

\- suppression de données.



Les logs d'audit doivent être protégés contre les modifications ordinaires.



\---



27\. ARCHITECTURE INFRASTRUCTURE



Commencer avec une infrastructure cloud moderne.



Exemple :



&#x20;               INTERNET

&#x20;                   |

&#x20;             CDN / WAF

&#x20;                   |

&#x20;             Next.js App

&#x20;                   |

&#x20;                API

&#x20;                   |

&#x20;             NestJS Backend

&#x20;                   |

&#x20;       ┌───────────┼───────────┐

&#x20;       ↓           ↓           ↓

&#x20;  PostgreSQL     Redis      Object Storage

&#x20;       |

&#x20;    Analytics



Ajouter progressivement :



\- queue workers

\- background jobs

\- search engine

\- event-driven architecture

\- observability.



Ne pas introduire Kubernetes ou une architecture excessivement complexe sans justification.



\---



28\. BACKGROUND JOBS



Certaines opérations doivent être asynchrones :



\- emails

\- notifications

\- génération de PDF

\- traitement d'images

\- synchronisation

\- calculs lourds

\- analytics

\- webhooks

\- tâches logistiques.



Utiliser une queue robuste, par exemple Redis + BullMQ ou équivalent.



\---



29\. OBSERVABILITY



Mettre en place dès le début :



\- structured logging

\- error tracking

\- metrics

\- health checks

\- uptime monitoring

\- database monitoring.



Prévoir une solution type :



OpenTelemetry + monitoring compatible



sans dépendre d'un fournisseur unique lorsque possible.



\---



30\. TESTS



Le projet doit être développé avec une vraie stratégie de tests.



Minimum :



Unit tests



Pour la logique métier.



Integration tests



Pour :



\- database

\- payments

\- authentication

\- order workflow.



E2E tests



Pour :



Customer

→ Request

→ Quote

→ Payment

→ Order

→ Tracking

→ Delivery



Security tests



Tester :



\- accès non autorisé

\- privilege escalation

\- IDOR

\- injection

\- brute force

\- mauvais contrôle de permissions.



\---



31\. CI/CD



Utiliser GitHub/GitLab CI ou équivalent.



Pipeline :



Push

↓

Lint

↓

Type Check

↓

Unit Tests

↓

Integration Tests

↓

Build

↓

Security Scan

↓

Deploy Staging

↓

E2E

↓

Production



Aucune modification directe en production.



\---



32\. ENVIRONNEMENTS



Créer au minimum :



development

staging

production



Les bases de données doivent être séparées.



Ne jamais utiliser les données réelles des clients en développement.



\---



33\. DESIGN UI/UX



L'application doit donner une impression :



Professionnelle + simple + fiable + moderne



Éviter :



\- interfaces surchargées

\- animations inutiles

\- trop de couleurs

\- formulaires compliqués.



Mobile-first.



Le client sénégalais doit pouvoir utiliser la plateforme facilement depuis un téléphone Android avec une connexion moyenne.



\---



34\. INTERNATIONALISATION



Prévoir dès le départ :



Français

Anglais



Architecture prête pour ajouter :



Wolof

Arabe



plus tard.



Devise principale :



FCFA/XOF



Mais architecture prête pour gérer :



\- CNY

\- USD

\- EUR

\- XOF.



\---



35\. IA — PHASE FUTURE



Ne pas mettre de l'IA partout inutilement.



Mais concevoir l'architecture pour permettre plus tard :



AI Product Search



Client :



«"Je cherche 100 polos noirs de bonne qualité à moins de 4 000 FCFA."»



L'IA peut aider à transformer la demande en critères de recherche.



Supplier Intelligence



Analyser les données historiques des fournisseurs.



Price Intelligence



Estimer si un prix fournisseur est intéressant.



Product Matching



Photo du client → produits similaires.



AI Assistant



Assistant capable de répondre aux questions :



«"Où est ma commande ?"»



«"Combien coûte l'importation de ce produit ?"»



«"Quel fournisseur est le plus intéressant ?"»



Toute fonctionnalité IA doit respecter les permissions et ne jamais exposer des données internes confidentielles.



\---



36\. API FIRST



Toutes les fonctions métier importantes doivent être accessibles via des services backend propres.



Prévoir éventuellement :



/api/v1/auth

/api/v1/customers

/api/v1/sourcing

/api/v1/quotes

/api/v1/orders

/api/v1/payments

/api/v1/shipments

/api/v1/documents

/api/v1/notifications



Utiliser une version d'API.



\---



37\. DATA MODEL INITIAL



Prévoir au minimum :



User

CustomerProfile

Address

SourcingRequest

Product

Supplier

SupplierEvaluation

Quote

QuoteItem

Order

OrderItem

Payment

PaymentTransaction

WarehousePackage

QualityInspection

Shipment

ShipmentEvent

Delivery

Document

Notification

SupportTicket

AuditLog

Role

Permission



Le modèle doit être conçu pour évoluer.



\---



38\. PRINCIPES DE DÉVELOPPEMENT



L'équipe doit respecter :



1\. TypeScript strict.

2\. Clean architecture pragmatique.

3\. SOLID lorsque pertinent.

4\. DRY sans créer une abstraction inutile.

5\. Validation côté serveur.

6\. Tests automatisés.

7\. Documentation.

8\. Code review obligatoire.

9\. Git propre.

10\. Aucun secret dans le repository.

11\. Aucun accès direct à la production sans procédure.

12\. Toutes les opérations financières doivent être auditables.



\---



39\. DOCUMENTATION OBLIGATOIRE



Créer :



README.md

ARCHITECTURE.md

API.md

DATABASE.md

SECURITY.md

DEPLOYMENT.md

ENVIRONMENT.md

CONTRIBUTING.md



Documenter également :



\- décisions architecturales

\- variables d'environnement

\- procédures de déploiement

\- récupération après incident

\- backups

\- intégrations externes.



\---



40\. MVP — PRIORITÉ



Ne construisez PAS toutes les fonctionnalités immédiatement.



MVP V1



Priorité absolue :



Authentication

Customer profile

Sourcing request

Admin dashboard

Supplier management

Quote system

Order management

Payment integration

Order tracking

Notifications

Basic logistics management

Document management

Audit logs



L'objectif est d'obtenir une première version réellement utilisable par de vrais clients.



\---



41\. V2



Ajouter :



Warehouse management

Advanced quality control

Consolidation

Advanced analytics

Customer wallet/credits if legally and technically appropriate

Mobile application

Advanced notifications

Supplier scoring



\---



42\. V3



Ajouter :



AI sourcing

Product image search

Supplier intelligence

Automated quotations

Advanced pricing engine

Marketplace/catalog

Business accounts

B2B tools

API for partners



\---



43\. DEFINITION OF DONE



Une fonctionnalité n'est pas considérée comme terminée simplement parce que l'interface fonctionne.



Elle est terminée lorsque :



\- frontend terminé

\- backend terminé

\- validation implémentée

\- permissions implémentées

\- tests écrits

\- erreurs gérées

\- logs appropriés

\- sécurité vérifiée

\- documentation mise à jour

\- responsive testé

\- code review effectué

\- staging validé.



\---



44\. ORDRE DE TRAVAIL DE L'ÉQUIPE



Commencer dans cet ordre :



Étape 1



Architecture + repository + conventions.



Étape 2



Authentication + users + RBAC.



Étape 3



Customer dashboard.



Étape 4



Sourcing requests.



Étape 5



Admin dashboard.



Étape 6



Suppliers.



Étape 7



Quotes + pricing engine.



Étape 8



Orders.



Étape 9



Payments.



Étape 10



Logistics + tracking.



Étape 11



Notifications.



Étape 12



Documents.



Étape 13



Security hardening.



Étape 14



Testing + CI/CD.



Étape 15



Production deployment.



\---



45\. OBJECTIF FINAL



Nous ne voulons pas simplement créer :



«"un site qui commande sur Alibaba."»



Nous voulons construire une plateforme technologique de confiance pour l'approvisionnement entre la Chine et le Sénégal.



Le produit doit être :



Secure

Scalable

Maintainable

Fast

Mobile-first

Professional

Transparent

API-first

Data-driven



Chaque décision technique doit être évaluée selon quatre critères :



1\. Sécurité



Les données et l'argent des clients doivent être protégés.



2\. Fiabilité



Une erreur de système ne doit pas facilement provoquer une commande ou un paiement incorrect.



3\. Scalabilité



L'architecture doit pouvoir évoluer avec l'entreprise.



4\. Simplicité



Ne pas ajouter de technologie uniquement parce qu'elle est à la mode.



\---



LIVRABLE ATTENDU DE L'ÉQUIPE



Avant de commencer le développement complet, fournir :



1\. Architecture technique détaillée.

2\. Diagramme de l'architecture.

3\. ERD de la base de données.

4\. Architecture des modules backend.

5\. Architecture frontend.

6\. Threat model / analyse de sécurité.

7\. Stratégie de sauvegarde.

8\. Stratégie CI/CD.

9\. Plan de monitoring.

10\. Découpage MVP → V2 → V3.

11\. Estimation des coûts d'infrastructure.

12\. Documentation des choix technologiques.



Ensuite seulement commencer l'implémentation.



Important : privilégier la qualité, la sécurité et la maintenabilité plutôt que la vitesse de livraison. 

