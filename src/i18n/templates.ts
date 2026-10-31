// Sentences built at runtime (numbers, names, titles). {placeholders} are filled in by translateUi.
export const templates: { en: string; rw: string; fr: string }[] = [
 {
  "en": "{n} day ago",
  "rw": "Hashize umunsi {n}",
  "fr": "Il y a {n} jour"
 },
 {
  "en": "{n} days ago",
  "rw": "Hashize iminsi {n}",
  "fr": "Il y a {n} jours"
 },
 {
  "en": "{n} min ago",
  "rw": "Hashize iminota {n}",
  "fr": "Il y a {n} min"
 },
 {
  "en": "{n} hours ago",
  "rw": "Hashize amasaha {n}",
  "fr": "Il y a {n} heures"
 },
 {
  "en": "{n} attended",
  "rw": "Abitabiriye: {n}",
  "fr": "{n} présents"
 },
 {
  "en": "{n} attended · credits awarded",
  "rw": "Abitabiriye: {n} · amanota yatanzwe",
  "fr": "{n} présents · crédits attribués"
 },
 {
  "en": "{n} attended, and credits were awarded automatically.",
  "rw": "Abantu {n} bitabiriye, kandi amanota yatanzwe mu buryo bwikora.",
  "fr": "{n} personnes ont participé et les crédits ont été attribués automatiquement."
 },
 {
  "en": "{n} attendees",
  "rw": "Abitabiriye {n}",
  "fr": "{n} participants"
 },
 {
  "en": "{kind} · issued {date} · reference {ref}",
  "rw": "{kind} · Itariki: {date} · Nimero: {ref}",
  "fr": "{kind} · délivré le {date} · référence {ref}"
 },
 {
  "en": "{title}, community photo {n}",
  "rw": "{title}, ifoto y'umuryango nimero {n}",
  "fr": "{title}, photo de la communauté {n}"
 },
 {
  "en": "{n} activity reports",
  "rw": "Raporo z'ibikorwa {n}",
  "fr": "{n} rapports d'activité"
 },
 {
  "en": "{n} more coming up",
  "rw": "Ibindi {n} biri imbere",
  "fr": "{n} autres à venir"
 },
 {
  "en": "{n} new",
  "rw": "Bishya: {n}",
  "fr": "{n} nouveaux"
 },
 {
  "en": "{n} exam questions",
  "rw": "Ibibazo by'ikizamini {n}",
  "fr": "{n} questions d'examen"
 },
 {
  "en": "{n} modules",
  "rw": "Ibice {n}",
  "fr": "{n} modules"
 },
 {
  "en": "{n} day left",
  "rw": "Hasigaye umunsi {n}",
  "fr": "{n} jour restant"
 },
 {
  "en": "{n} days left",
  "rw": "Hasigaye iminsi {n}",
  "fr": "{n} jours restants"
 },
 {
  "en": "{name} cancelled a mentorship session",
  "rw": "{name} yahagaritse isomo ry'ubujyanama",
  "fr": "{name} a annulé une séance de mentorat"
 },
 {
  "en": "{name} cancelled the session planned for {when}.",
  "rw": "{name} yahagaritse isomo ryari riteganyijwe ku wa {when}.",
  "fr": "{name} a annulé la séance prévue le {when}."
 },
 {
  "en": "{name} changed their session request.",
  "rw": "{name} yahinduye ubusabe bwe bw'isomo.",
  "fr": "{name} a modifié sa demande de séance."
 },
 {
  "en": "{name} has requested a mentorship session with you on PLP Hub.",
  "rw": "{name} yagusabye isomo ry'ubujyanama kuri PLP Hub.",
  "fr": "{name} vous a demandé une séance de mentorat sur PLP Hub."
 },
 {
  "en": "{name} updated their mentorship request",
  "rw": "{name} yavuguruye ubusabe bwe bw'ubujyanama",
  "fr": "{name} a mis à jour sa demande de mentorat"
 },
 {
  "en": "{name} cannot take the session requested for {when}.",
  "rw": "{name} ntazabasha kwitabira isomo ryasabwe ku wa {when}.",
  "fr": "{name} ne peut pas assurer la séance demandée pour le {when}."
 },
 {
  "en": "{name} confirmed your mentorship session.",
  "rw": "{name} yemeje isomo ryawe ry'ubujyanama.",
  "fr": "{name} a confirmé votre séance de mentorat."
 },
 {
  "en": "{name} confirmed your mentorship session",
  "rw": "{name} yemeje isomo ryawe ry'ubujyanama",
  "fr": "{name} a confirmé votre séance de mentorat"
 },
 {
  "en": "{name} moved your session.",
  "rw": "{name} yimuye isomo ryawe.",
  "fr": "{name} a déplacé votre séance."
 },
 {
  "en": "{name} proposed a new time for your session",
  "rw": "{name} yatanze igihe gishya cy'isomo ryawe",
  "fr": "{name} a proposé un nouvel horaire pour votre séance"
 },
 {
  "en": "{kind} must be 5 MB or smaller.",
  "rw": "Ingano ya {kind} ntigomba kurenza 5 MB.",
  "fr": "{kind} ne doit pas dépasser 5 MB."
 },
 {
  "en": "{a}/{b} passed",
  "rw": "{a}/{b} batsinze",
  "fr": "{a}/{b} réussis"
 },
 {
  "en": "{label} cannot be in the past.",
  "rw": "{label}: itariki ntishobora kuba yarashize.",
  "fr": "{label} ne peut pas être dans le passé."
 },
 {
  "en": "{label} must be {n} characters or fewer.",
  "rw": "{label}: ntigomba kurenza inyuguti {n}.",
  "fr": "{label} doit comporter {n} caractères au maximum."
 },
 {
  "en": "{label} must be at least {n} characters.",
  "rw": "{label}: igomba kugira nibura inyuguti {n}.",
  "fr": "{label} doit comporter au moins {n} caractères."
 },
 {
  "en": "{label} must be between 2020 and two years from today.",
  "rw": "{label}: igomba kuba hagati ya 2020 n'imyaka ibiri uhereye uyu munsi.",
  "fr": "{label} doit être compris entre 2020 et deux ans à partir d'aujourd'hui."
 },
 {
  "en": "{name} will be notified by email.",
  "rw": "{name} azamenyeshwa kuri imeyili.",
  "fr": "{name} sera informé(e) par e-mail."
 },
 {
  "en": "{a}/{b} modules",
  "rw": "Ibice {a}/{b}",
  "fr": "{a}/{b} modules"
 },
 {
  "en": "{a}/{b} lessons",
  "rw": "Amasomo {a}/{b}",
  "fr": "{a}/{b} leçons"
 },
 {
  "en": "{n} recipients",
  "rw": "Abahabwa {n}",
  "fr": "{n} destinataires"
 },
 {
  "en": "{n} certificate",
  "rw": "Icyemezo {n}",
  "fr": "{n} certificat"
 },
 {
  "en": "{n} certificates",
  "rw": "Ibyemezo {n}",
  "fr": "{n} certificats"
 },
 {
  "en": "{n} registered",
  "rw": "Abiyandikishije {n}",
  "fr": "{n} inscrits"
 },
 {
  "en": "{n} certificates are ready to download.",
  "rw": "Ibyemezo {n} byiteguye gukururwa.",
  "fr": "{n} certificats sont prêts à être téléchargés."
 },
 {
  "en": "{n} activity",
  "rw": "Igikorwa {n}",
  "fr": "{n} activité"
 },
 {
  "en": "{n} activities",
  "rw": "Ibikorwa {n}",
  "fr": "{n} activités"
 },
 {
  "en": "{n} assignments",
  "rw": "Imikoro {n}",
  "fr": "{n} devoirs"
 },
 {
  "en": "{n} assignment to review",
  "rw": "Umukoro {n} wo gusuzuma",
  "fr": "{n} devoir à corriger"
 },
 {
  "en": "{n} assignments to review",
  "rw": "Imikoro {n} yo gusuzuma",
  "fr": "{n} devoirs à corriger"
 },
 {
  "en": "{n} session",
  "rw": "Isomo {n}",
  "fr": "{n} séance"
 },
 {
  "en": "{n} sessions",
  "rw": "Amasomo {n}",
  "fr": "{n} séances"
 },
 {
  "en": "{n} member",
  "rw": "Umunyamuryango {n}",
  "fr": "{n} membre"
 },
 {
  "en": "{n} members",
  "rw": "Abanyamuryango {n}",
  "fr": "{n} membres"
 },
 {
  "en": "{n} of {m}",
  "rw": "{n} kuri {m}",
  "fr": "{n} sur {m}"
 },
 {
  "en": "{name} can't take this session",
  "rw": "{name} ntazabasha kwitabira iri somo",
  "fr": "{name} ne peut pas assurer cette séance"
 },
 {
  "en": "{name} cancelled a session",
  "rw": "{name} yahagaritse isomo",
  "fr": "{name} a annulé une séance"
 },
 {
  "en": "{name} changed their session request",
  "rw": "{name} yahinduye ubusabe bwe bw'isomo",
  "fr": "{name} a modifié sa demande de séance"
 },
 {
  "en": "{name} confirmed your mentoring session",
  "rw": "{name} yemeje isomo ryawe ry'ubujyanama",
  "fr": "{name} a confirmé votre séance de mentorat"
 },
 {
  "en": "{name} proposed a new session time",
  "rw": "{name} yatanze igihe gishya cy'isomo",
  "fr": "{name} a proposé un nouvel horaire de séance"
 },
 {
  "en": "{name} will participate",
  "rw": "{name} azitabira",
  "fr": "{name} participera"
 },
 {
  "en": "Applied on {site}",
  "rw": "Yasabiwe kuri {site}",
  "fr": "Candidature déposée sur {site}"
 },
 {
  "en": "Before publishing, add {list}.",
  "rw": "Mbere yo gutangaza, ongeramo {list}.",
  "fr": "Avant de publier, ajoutez {list}."
 },
 {
  "en": "Build practical {skill} skills",
  "rw": "Ubaka ubumenyi ngiro muri {skill}",
  "fr": "Développez des compétences pratiques en {skill}"
 },
 {
  "en": "Changes requested: {title}",
  "rw": "Hasabwe impinduka: {title}",
  "fr": "Modifications demandées : {title}"
 },
 {
  "en": "Completed {title}",
  "rw": "Wasoje {title}",
  "fr": "Terminé : {title}"
 },
 {
  "en": "From {source}",
  "rw": "Biturutse kuri {source}",
  "fr": "De {source}"
 },
 {
  "en": "Graded quiz · {n} questions · {m} min",
  "rw": "Isuzuma rifite amanota · ibibazo {n} · iminota {m}",
  "fr": "Quiz noté · {n} questions · {m} min"
 },
 {
  "en": "In {n} days",
  "rw": "Mu minsi {n}",
  "fr": "Dans {n} jours"
 },
 {
  "en": "In {n} day",
  "rw": "Mu munsi {n}",
  "fr": "Dans {n} jour"
 },
 {
  "en": "Issued {date}",
  "rw": "Cyatanzwe ku wa {date}",
  "fr": "Délivré le {date}"
 },
 {
  "en": "Keep at least one {kind} in the fun corner.",
  "rw": "{kind}: hagomba gusigara nibura kimwe mu gace k'imyidagaduro.",
  "fr": "Conservez au moins un élément de type {kind} dans le coin détente."
 },
 {
  "en": "Line {n}: \"{email}\" is not a valid email.",
  "rw": "Umurongo {n}: \"{email}\" si imeyili yemewe.",
  "fr": "Ligne {n} : \"{email}\" n'est pas une adresse e-mail valide."
 },
 {
  "en": "Line {n}: {email} appears twice in this list.",
  "rw": "Umurongo {n}: {email} igaragara kabiri muri uru rutonde.",
  "fr": "Ligne {n} : {email} apparaît deux fois dans cette liste."
 },
 {
  "en": "Line {n}: {email} is already in the register.",
  "rw": "Umurongo {n}: {email} isanzwe yanditswe mu gitabo.",
  "fr": "Ligne {n} : {email} figure déjà dans le registre."
 },
 {
  "en": "Line {n}: enter the member's full name.",
  "rw": "Umurongo {n}: andika amazina yose y'umunyamuryango.",
  "fr": "Ligne {n} : saisissez le nom complet du membre."
 },
 {
  "en": "Line {n}: the name is longer than 100 characters.",
  "rw": "Umurongo {n}: izina rirenze inyuguti 100.",
  "fr": "Ligne {n} : le nom dépasse 100 caractères."
 },
 {
  "en": "Module {n} knowledge check",
  "rw": "Isuzuma ry'ubumenyi ry'igice cya {n}",
  "fr": "Contrôle des connaissances du module {n}"
 },
 {
  "en": "Module {n} quiz time limit (minutes)",
  "rw": "Igihe ntarengwa cy'isuzuma ry'igice cya {n} (iminota)",
  "fr": "Durée limite du quiz du module {n} (minutes)"
 },
 {
  "en": "New activity: {title}",
  "rw": "Igikorwa gishya: {title}",
  "fr": "Nouvelle activité : {title}"
 },
 {
  "en": "New application from {name}",
  "rw": "Ubusabe bushya bwa {name}",
  "fr": "Nouvelle candidature de {name}"
 },
 {
  "en": "New course: {title}",
  "rw": "Isomo rishya: {title}",
  "fr": "Nouveau cours : {title}"
 },
 {
  "en": "New mentorship session request from {name}",
  "rw": "Ubusabe bushya bw'isomo ry'ubujyanama bwa {name}",
  "fr": "Nouvelle demande de séance de mentorat de {name}"
 },
 {
  "en": "New opportunity: {title}",
  "rw": "Amahirwe mashya: {title}",
  "fr": "Nouvelle opportunité : {title}"
 },
 {
  "en": "New session request from {name}",
  "rw": "Ubusabe bushya bw'isomo bwa {name}",
  "fr": "Nouvelle demande de séance de {name}"
 },
 {
  "en": "New learning material: {title}",
  "rw": "Imfashanyigisho nshya: {title}",
  "fr": "Nouveau support d'apprentissage : {title}"
 },
 {
  "en": "Notifications, {n} unread",
  "rw": "Amamenyesha, {n} atarasomwa",
  "fr": "Notifications, {n} non lues"
 },
 {
  "en": "Option {letter}",
  "rw": "Ihitamo {letter}",
  "fr": "Option {letter}"
 },
 {
  "en": "Option {letter} (optional)",
  "rw": "Ihitamo {letter} (si ngombwa)",
  "fr": "Option {letter} (facultatif)"
 },
 {
  "en": "Page {n} of {m}",
  "rw": "Urupapuro {n} kuri {m}",
  "fr": "Page {n} sur {m}"
 },
 {
  "en": "Participation {status}",
  "rw": "Kwitabira: {status}",
  "fr": "Participation : {status}"
 },
 {
  "en": "Photo {n}",
  "rw": "Ifoto {n}",
  "fr": "Photo {n}"
 },
 {
  "en": "Reactivate {name}?",
  "rw": "Kongera gufungura konti ya {name}?",
  "fr": "Réactiver {name} ?"
 },
 {
  "en": "Reactivate {name}",
  "rw": "Ongera ufungure konti ya {name}",
  "fr": "Réactiver {name}"
 },
 {
  "en": "Request {status}",
  "rw": "Ubusabe: {status}",
  "fr": "Demande : {status}"
 },
 {
  "en": "Request {n} certificate",
  "rw": "Saba icyemezo {n}",
  "fr": "Demander {n} certificat"
 },
 {
  "en": "Request {n} certificates",
  "rw": "Saba ibyemezo {n}",
  "fr": "Demander {n} certificats"
 },
 {
  "en": "Resend in {time}",
  "rw": "Ongera wohereze mu {time}",
  "fr": "Renvoyer dans {time}"
 },
 {
  "en": "Session with {name} recorded",
  "rw": "Isomo na {name} ryanditswe",
  "fr": "Séance avec {name} enregistrée"
 },
 {
  "en": "Since {date}",
  "rw": "Kuva {date}",
  "fr": "Depuis {date}"
 },
 {
  "en": "Start {title}?",
  "rw": "Gutangira {title}?",
  "fr": "Commencer {title} ?"
 },
 {
  "en": "Still needed: {list}",
  "rw": "Biracyakenewe: {list}",
  "fr": "Encore requis : {list}"
 },
 {
  "en": "Suspend {name}?",
  "rw": "Guhagarika {name}?",
  "fr": "Suspendre {name} ?"
 },
 {
  "en": "Suspend {name}",
  "rw": "Hagarika {name}",
  "fr": "Suspendre {name}"
 },
 {
  "en": "The {kind} was deleted",
  "rw": "Byasibwe: {kind}",
  "fr": "{kind} supprimé(e)"
 },
 {
  "en": "Until {date}",
  "rw": "Kugeza ku wa {date}",
  "fr": "Jusqu'au {date}"
 },
 {
  "en": "Up to {date}",
  "rw": "Kugeza ku wa {date}",
  "fr": "Jusqu'au {date}"
 },
 {
  "en": "Up to {n} can be shown",
  "rw": "Hashobora kugaragazwa {n} gusa",
  "fr": "Jusqu'à {n} peuvent être affichés"
 },
 {
  "en": "Use at most 10 photos per activity ({n} already added).",
  "rw": "Koresha amafoto 10 gusa ku gikorwa kimwe (hamaze kongerwamo {n}).",
  "fr": "Utilisez au maximum 10 photos par activité ({n} déjà ajoutées)."
 },
 {
  "en": "Written · at least {n} words",
  "rw": "Byanditse · nibura amagambo {n}",
  "fr": "Écrit · au moins {n} mots"
 },
 {
  "en": "You earned {n} PLP credits",
  "rw": "Wabonye amanota ya PLP {n}",
  "fr": "Vous avez obtenu {n} crédits PLP"
 },
 {
  "en": "You now have {role} access to the PLP Hub.",
  "rw": "Ubu ufite uburenganzira bwa {role} kuri PLP Hub.",
  "fr": "Vous avez désormais un accès {role} à PLP Hub."
 },
 {
  "en": "Your 5 GB file allowance is full",
  "rw": "Umwanya wawe wa 5 GB wo kubika amadosiye wuzuye",
  "fr": "Votre espace de 5 GB pour les fichiers est plein"
 },
 {
  "en": "Your 50 MB file allowance is full",
  "rw": "Umwanya wawe wa 50 MB wo kubika amadosiye wuzuye",
  "fr": "Votre espace de 50 MB pour les fichiers est plein"
 },
 {
  "en": "Your {what} was approved",
  "rw": "Byemejwe: {what}",
  "fr": "Votre {what} a été approuvé(e)"
 },
 {
  "en": "Your {what} was not approved",
  "rw": "Ntibyemejwe: {what}",
  "fr": "Votre {what} n'a pas été approuvé(e)"
 },
 {
  "en": "Your session with {name} is complete",
  "rw": "Isomo ryawe na {name} ryarangiye",
  "fr": "Votre séance avec {name} est terminée"
 },
 {
  "en": "Delete {kind}",
  "rw": "Siba {kind}",
  "fr": "Supprimer {kind}"
 },
 {
  "en": "Delete {name}'s account?",
  "rw": "Gusiba konti ya {name}?",
  "fr": "Supprimer le compte de {name} ?"
 },
 {
  "en": "Delete module {n}?",
  "rw": "Gusiba igice cya {n}?",
  "fr": "Supprimer le module {n} ?"
 },
 {
  "en": "Delete this {kind}?",
  "rw": "Gusiba {kind}?",
  "fr": "Supprimer cet élément ({kind}) ?"
 },
 {
  "en": "Edit {kind}",
  "rw": "Hindura {kind}",
  "fr": "Modifier {kind}"
 },
 {
  "en": "Document {n}",
  "rw": "Inyandiko {n}",
  "fr": "Document {n}"
 },
 {
  "en": "Hide {label}",
  "rw": "Hisha {label}",
  "fr": "Masquer {label}"
 },
 {
  "en": "Show {label}",
  "rw": "Erekana {label}",
  "fr": "Afficher {label}"
 },
 {
  "en": "Publish {title}",
  "rw": "Tangaza {title}",
  "fr": "Publier {title}"
 },
 {
  "en": "Unpublish {title}",
  "rw": "Hagarika gutangaza {title}",
  "fr": "Dépublier {title}"
 },
 {
  "en": "Save {title}",
  "rw": "Bika {title}",
  "fr": "Enregistrer {title}"
 },
 {
  "en": "Unsave {title}",
  "rw": "Kuramo {title} mu byabitswe",
  "fr": "Retirer {title} des enregistrements"
 },
 {
  "en": "{place} · {date}. Let them know if you'll participate.",
  "rw": "{place} · {date}. Bamenyeshe niba uzitabira.",
  "fr": "{place} · {date}. Indiquez-leur si vous participerez."
 },
 {
  "en": "Welcome back, {name}",
  "rw": "Murakaza neza nanone, {name}",
  "fr": "Bon retour, {name}"
 },
 {
  "en": "Club leaders: {names}",
  "rw": "Abayobozi b'ihuriro: {names}",
  "fr": "Responsables du club : {names}"
 },
 {
  "en": "For attending {title}",
  "rw": "Kubera kwitabira {title}",
  "fr": "Pour la participation à {title}"
 },
 {
  "en": "{name}: {n} {unit} ({p}%)",
  "rw": "{name}: {n} {unit} ({p}%)",
  "fr": "{name} : {n} {unit} ({p} %)"
 },
 {
  "en": "{name}: {n} {unit}",
  "rw": "{name}: {n} {unit}",
  "fr": "{name} : {n} {unit}"
 },
 {
  "en": "{n} questions",
  "rw": "Ibibazo {n}",
  "fr": "{n} questions"
 },
 {
  "en": "{n} min",
  "rw": "Iminota {n}",
  "fr": "{n} min"
 },
 {
  "en": "{n} hours a month",
  "rw": "Amasaha {n} ku kwezi",
  "fr": "{n} heures par mois"
 },
 {
  "en": "{n} hour",
  "rw": "Isaha {n}",
  "fr": "{n} heure"
 },
 {
  "en": "{n} hours",
  "rw": "Amasaha {n}",
  "fr": "{n} heures"
 },
 {
  "en": "Last submitted {date}",
  "rw": "Byatanzwe bwa nyuma ku wa {date}",
  "fr": "Dernière soumission le {date}"
 },
 {
  "en": "Submitted {date}",
  "rw": "Byatanzwe ku wa {date}",
  "fr": "Soumis le {date}"
 },
 {
  "en": "Member since {date}",
  "rw": "Umunyamuryango kuva {date}",
  "fr": "Membre depuis {date}"
 },
 {
  "en": "Expected to graduate {year}",
  "rw": "Biteganyijwe ko azarangiza amashuri mu {year}",
  "fr": "Diplôme prévu en {year}"
 },
 {
  "en": "Graduated {year}",
  "rw": "Yarangije amashuri mu {year}",
  "fr": "Diplômé(e) en {year}"
 },
 {
  "en": "Apply by {date}",
  "rw": "Saba bitarenze ku wa {date}",
  "fr": "Postulez avant le {date}"
 },
 {
  "en": "Closes in {n} days",
  "rw": "Birafunga mu minsi {n}",
  "fr": "Clôture dans {n} jours"
 },
 {
  "en": "Closes today",
  "rw": "Birafunga uyu munsi",
  "fr": "Clôture aujourd'hui"
 },
 {
  "en": "{n} unread",
  "rw": "Bitarasomwa: {n}",
  "fr": "{n} non lus"
 },
 {
  "en": "{n} lessons",
  "rw": "Amasomo {n}",
  "fr": "{n} leçons"
 },
 {
  "en": "{n} credits",
  "rw": "Amanota {n}",
  "fr": "{n} crédits"
 },
 {
  "en": "{n} PLP credits",
  "rw": "Amanota ya PLP {n}",
  "fr": "{n} crédits PLP"
 },
 {
  "en": "{n} requests",
  "rw": "Ubusabe {n}",
  "fr": "{n} demandes"
 },
 {
  "en": "{n} approved",
  "rw": "Byemejwe: {n}",
  "fr": "{n} approuvés"
 },
 {
  "en": "{n} reports submitted",
  "rw": "Raporo {n} zatanzwe",
  "fr": "{n} rapports soumis"
 },
 {
  "en": "{n} completed",
  "rw": "Byarangiye: {n}",
  "fr": "{n} terminés"
 },
 {
  "en": "{n} upcoming",
  "rw": "Biri imbere: {n}",
  "fr": "{n} à venir"
 },
 {
  "en": "{n} records",
  "rw": "Inyandiko {n}",
  "fr": "{n} enregistrements"
 },
 {
  "en": "{n} record",
  "rw": "Inyandiko {n}",
  "fr": "{n} enregistrement"
 },
 {
  "en": "Search {what}",
  "rw": "Shakisha {what}",
  "fr": "Rechercher {what}"
 }
];
